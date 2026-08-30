import { useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { agentService } from '@modules/chat/api/agent-service'
import type { AttachmentIn } from '@modules/chat/api/agent-types'
import {
  PRE_SESSION_KEY,
  useChatSessionStore,
  type ChatAlertCode,
} from '@modules/chat/model/chat-session-store'
import { useSessionsStore } from '@modules/chat/model/sessions-store'
import { StatusStream } from '@modules/chat/model/status-stream'
import { useSseStream } from '@modules/chat/model/use-sse-stream'
import { useUploadDocuments } from '@modules/chat/model/use-upload-documents'
import type {
  ChatAttachment,
  ChatMessage,
  UploadedDocument,
} from '@modules/chat/model/types'

export interface SendPayload {
  text: string
  attachments: ChatAttachment[]
}

interface UseChatSendResult {
  /** Runs the full pipeline: upload → /sessions → /stream. */
  send: (payload: SendPayload) => Promise<void>
  /**
   * Re-opens `/stream` for a session whose last turn was interrupted
   * (page refresh mid-stream, tab close, etc.). Reads the last user
   * message from the store and re-fires the same content — no new
   * user bubble, no upload. No-op if the state isn't actually interrupted.
   */
  resume: (sessionId: string) => Promise<void>
  /** Cancels the current SSE stream, if any. */
  abort: () => void
}

const ERROR_BANNER = 'Error happened please try again'
const TITLE_MAX = 80

/**
 * BE error/finish codes that map to a typed ChatAlert (rate-limit today,
 * more to come). Membership here has two effects:
 *   - fires `store.setAlert(code)` when observed on an `error` frame or
 *     `turn_end` finish_reason,
 *   - suppresses the retry-banner in the catch path since these conditions
 *     are not resolved by clicking Retry.
 */
const ALERT_CODES: Record<string, ChatAlertCode> = {
  upstream_rate_limited: 'upstream_rate_limited',
}

/**
 * Orchestrates the New Chat send pipeline. Sequential per the plan:
 *
 *   1. Snapshot payload (defends against mid-flow state mutation).
 *   2. Upload any un-uploaded attachments (skips already-`done` on retry).
 *   3. POST /sessions if we don't have a session_id yet.
 *   4. OPEN /stream; stream tokens into the last assistant message.
 *
 * Any failure -> RETRY protocol: composer restores from `pendingPayload`,
 * banner ("Error happened please try again") shows above composer, and the
 * cached `session_id` (from step 3) survives so a stream-only retry skips
 * /sessions.
 *
 * `abort()` cancels the fetch — used by devtools-abort defense + the
 * hook's own cleanup on component unmount (via `useSseStream`).
 */
export function useChatSend(): UseChatSendResult {
  const navigate = useNavigate()
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>()
  const upload = useUploadDocuments()
  const { open, abort } = useSseStream()

  // Cached session_id — populated on successful /sessions. Read by the next
  // send() so a /stream-only retry skips /sessions. Route params
  // (useParams) take over once URL changes.
  const cachedSessionIdRef = useRef<string | null>(null)

  const send = useCallback(
    async (payload: SendPayload): Promise<void> => {
      // (1) SNAPSHOT — freeze the payload; any state mutation from here on
      // is invisible to the pipeline.
      const snapshot: SendPayload = {
        text: payload.text,
        attachments: [...payload.attachments],
      }
      const priorSid = routeSessionId ?? cachedSessionIdRef.current
      const store = useChatSessionStore.getState()

      // Clear a prior error banner — user is trying again.
      if (priorSid) store.clearError(priorSid)
      else store.clearError(PRE_SESSION_KEY)

      // Tracks the sessionId we should attach errors to. Starts null (pre-session),
      // updated once /sessions returns.
      let sid: string | null = priorSid
      let uploadedAttachments: ChatAttachment[] = snapshot.attachments
      // Hoisted so the catch block can see it — populated inside the stream
      // Promise when a typed alert (rate-limit et al) fires.
      let alertCode: ChatAlertCode | null = null

      // (SEED) User bubble + empty assistant placeholder are appended IMMEDIATELY
      // — before uploads / /sessions — so the message visibly commits the moment
      // Send is pressed instead of appearing to hang inside the composer for the
      // duration of the pre-stream work. When we don't yet have a sid (first
      // message on /new), the seed lands under PRE_SESSION_KEY and is migrated
      // to the real sid immediately after /sessions returns (see (3)).
      const seedKey = sid ?? PRE_SESSION_KEY
      store.ensure(seedKey)
      // Drop any leftover synthetic "The process was interrupted." marker so
      // a new turn doesn't stack on top of the previous interrupt notice.
      store.removeTrailingInterrupted(seedKey)
      const now = Date.now()
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: snapshot.text,
        createdAt: now,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      }
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: now + 1,
      }
      store.appendMessage(seedKey, userMsg)
      store.appendMessage(seedKey, assistantMsg)
      // streaming=true here so ChatMessages renders the Thinking indicator on
      // the empty assistant bubble even while /sessions is still round-tripping.
      store.setStreaming(seedKey, true)

      try {
        // (2) UPLOADS. Existing hook — parallel Promise.allSettled internally.
        if (uploadedAttachments.length > 0) {
          uploadedAttachments = await upload(uploadedAttachments)
          if (uploadedAttachments.some((a) => a.uploadStatus === 'failed')) {
            throw new Error('One or more uploads failed')
          }
          // Swap the pending-status attachments seeded on the user bubble for
          // the post-upload enriched shape so tiles flip pending → done.
          store.patchMessageAttachments(seedKey, userMsg.id, uploadedAttachments)
        }

        // (3) SESSION. Only if we don't already have one.
        if (!sid) {
          const title = snapshot.text.slice(0, TITLE_MAX) || 'New incident'
          const session = await agentService.createSession({
            title,
            severity: null,
          })
          sid = session.session_id
          cachedSessionIdRef.current = sid
          useSessionsStore.getState().addOptimistic(session)
          // Promote the PRE_SESSION_KEY seed to the real sid BEFORE navigating
          // so the router-triggered re-read finds messages under the new key
          // — otherwise the just-navigated ChatSection reads an empty state
          // for a frame and the bubbles flicker.
          store.migrateSession(PRE_SESSION_KEY, sid)
          navigate(`/chat/${sid}`, { replace: true })
        }

        // (4) STREAM.
        const attachmentsIn: AttachmentIn[] = uploadedAttachments
          .filter((a): a is ChatAttachment & { sourceId: string } =>
            Boolean(a.sourceId),
          )
          .map((a) => ({
            source_id: a.sourceId,
            filename: a.file.name,
            content_type: a.file.type,
            size_bytes: a.file.size,
          }))

        // `agentError` remembers an `error` frame across the stream so we
        // can reject the outer Promise on `turn_end` (BE emits error THEN
        // turn_end — see orchestrator.py fallback paths).
        let agentError: string | null = null
        // Per-stream status pane — paces reasoning and validation lines at
        // 0.8s each and buffers text_delta until the queue drains.
        const status = new StatusStream({
          onStatus: (line) => store.setLastAssistantStatus(sid!, line),
          onText: (delta) => store.patchLastAssistant(sid!, delta),
        })
        await new Promise<void>((resolve, reject) => {
          open(
            sid!,
            { message: snapshot.text, attachments: attachmentsIn },
            {
              onFrame: (frame) => {
                // Thinking, validation and the answer text all go to the status
                // pane; only what carries turn state is handled below.
                if (status.accept(frame)) return
                if (frame.event === 'error') {
                  agentError = frame.data.message || 'Agent error'
                  const mapped = frame.data.code
                    ? ALERT_CODES[frame.data.code]
                    : undefined
                  if (mapped) {
                    alertCode = mapped
                    store.setAlert(mapped)
                  }
                } else if (frame.event === 'turn_end') {
                  // Stamp response_time_ms onto the streaming assistant
                  // bubble so its "Answered in …s" caption shows the moment
                  // the stream lands.
                  if (typeof frame.data.response_time_ms === 'number') {
                    store.setLastAssistantResponseTime(
                      sid!,
                      frame.data.response_time_ms,
                    )
                  }
                  // Persist the per-message escalation flag so MessageBubble
                  // can render the inline chip. Boolean-normalised so the
                  // absence of the field reads as `false`, matching BE
                  // semantics (missing → not escalated).
                  store.setLastAssistantEscalation(
                    sid!,
                    Boolean(frame.data.requires_escalation),
                  )
                  // Rate-limit path: BE emits both `error` (with code) and
                  // `turn_end` (with finish_reason). This is the defensive
                  // catch when error frame is missed.
                  const finishMapped = frame.data.finish_reason
                    ? ALERT_CODES[frame.data.finish_reason]
                    : undefined
                  if (finishMapped && !alertCode) {
                    alertCode = finishMapped
                    store.setAlert(finishMapped)
                  }
                  // Escalation path: successful turn AND the agent signalled
                  // it wants a human. Set `alertCode` so onDone's clear path
                  // doesn't wipe the alert we just raised. When escalation
                  // is false the guard leaves `alertCode` null → onDone
                  // clears any prior escalation alert.
                  if (frame.data.requires_escalation && !alertCode) {
                    alertCode = 'requires_escalation'
                    store.setAlert('requires_escalation')
                  }
                  // Sources this answer rests on. Length-guarded so a turn that
                  // cited nothing cannot blank a list already on the message,
                  // and skipped on a rollback: the gate withheld the answer and
                  // replaced it with a refusal, so green "Verified" badges under
                  // "the sources do not support this" would say the opposite of
                  // what just happened.
                  if (!frame.data.rolled_back && frame.data.citation_refs?.length) {
                    store.setLastAssistantCitations(sid!, frame.data.citation_refs)
                  }
                  // Sidebar row tracks the message that just landed. Skipped
                  // for a rolled-back turn: BE reverted it, so the preview
                  // would name a message the next refetch won't return.
                  if (!frame.data.rolled_back) {
                    useSessionsStore
                      .getState()
                      .touchSession(sid!, snapshot.text)
                  }
                }
                // thinking_end / tool_* / warning / turn_start —
                // typed for parser safety but not wired to UI yet.
              },
              onDone: (result) => {
                // Clearing the status line and re-enabling the composer are
                // deferred into the settle callback: the gate's verdict lands
                // one frame before `turn_end`, so doing either now would wipe
                // the line the user is mid-way through reading.
                const settled = () => {
                  store.setLastAssistantStatus(sid!, null)
                  store.setStreaming(sid!, false)
                }
                // A failed or aborted turn keeps nothing queued — the
                // commentary is not worth waiting on once the turn is lost.
                if (result.ok && !agentError) status.finish(settled)
                else {
                  status.abandon()
                  settled()
                }
                if (agentError) reject(new Error(agentError))
                else if (result.ok) {
                  // Only clear when THIS turn didn't itself raise an alert —
                  // otherwise a successful turn carrying `requires_escalation`
                  // would wipe the alert it just set.
                  if (!alertCode) store.clearAlert()
                  resolve()
                }
                // User-initiated abort (Stop button) is NOT a retryable
                // error — the BE observed the socket close and will apply
                // its own rollback contract (FE_HANDOFF §6). Resolve
                // quietly so the RETRY banner + composer restore do not
                // fire on a deliberate cancel.
                else if (result.aborted) resolve()
                else reject(new Error(result.error))
              },
            },
          )
        })
      } catch (err) {
        // RETRY protocol — skip when the failure was a user abort (Stop
        // button). Handled above via `result.aborted`; this guard covers
        // the fallback path where an AbortError somehow escapes as a
        // native throw before onDone ran.
        if (err instanceof Error && err.message === 'Stream aborted') {
          if (sid) store.setStreaming(sid, false)
          return
        }
        const key = sid ?? PRE_SESSION_KEY
        // Rollback the pre-session seed: the user's message never made it to
        // the BE (upload / /sessions failure), so retaining the phantom user
        // bubble would confuse the retry (a subsequent successful Send would
        // append a SECOND user bubble on top of the orphaned one). Once sid
        // is set the bubbles KEEP existing — those represent an in-progress
        // turn the BE already persisted (interrupted-turn semantics; the
        // Retry banner + resume() take over).
        if (!sid) {
          store.setMessages(PRE_SESSION_KEY, [])
          store.setStreaming(PRE_SESSION_KEY, false)
        }
        // Ensure the slot exists so setError doesn't lose the banner.
        store.ensure(key)
        // Suppress the generic retry banner when a typed alert already
        // explains the failure (retry won't help for rate-limit et al).
        // We DO still stash pendingPayload so the composer restores.
        if (alertCode) {
          store.setError(key, null, {
            text: snapshot.text,
            attachments: uploadedAttachments,
          })
        } else {
          store.setError(key, ERROR_BANNER, {
            text: snapshot.text,
            // Use the enriched attachments (with sourceId set on the ones
            // that succeeded) so retry skips them.
            attachments: uploadedAttachments,
          })
        }
        // Log for devs; suppress the throw so the caller (ChatInput) doesn't
        // see a rejection. State-based error surface is enough.
        console.warn(
          '[useChatSend]',
          err instanceof Error ? err.message : String(err),
        )
      }
    },
    [routeSessionId, upload, open, navigate],
  )

  /**
   * Recovers from a mid-stream interruption (page refresh / tab close):
   *
   *   - Reads the last user message from the store (already hydrated from
   *     `GET /sessions/{id}` by `useHydrateSession`).
   *   - Seeds an empty assistant placeholder to receive tokens.
   *   - Re-opens `/stream` with the same message text + attachments.
   *
   * No new user bubble is created — the original one stays. Attachments,
   * if any, are already stored on the BE; we just resend their
   * `source_id + filename + content_type + size_bytes` on the wire.
   *
   * No-op if the state isn't actually interrupted (last message is
   * assistant, or the session is already streaming/hydrating).
   */
  const resume = useCallback(
    async (sessionId: string): Promise<void> => {
      const store = useChatSessionStore.getState()
      const cur = store.byId[sessionId]
      if (!cur || cur.streaming || cur.hydrating) return

      // Skip over the synthetic "The process was interrupted." marker
      // (if useHydrateSession appended one) so we still find the ORIGINAL
      // user message we need to re-fire.
      const tailIdx = cur.messages.length - 1
      const skipInterrupted = cur.messages[tailIdx]?.interrupted ? 1 : 0
      const last = cur.messages[tailIdx - skipInterrupted]
      if (!last || last.role !== 'user') return

      // Pull the wire-shape attachments from stored ChatMessage attachments.
      // Post-hydration these are `UploadedDocument`; pre-refresh they may
      // still be `ChatAttachment` — both carry `sourceId + filename + size`
      // so the mapping is uniform.
      const attachmentsIn: AttachmentIn[] = (last.attachments ?? [])
        .map((a): AttachmentIn | null => {
          if ('file' in a) {
            // Live attachment (ChatAttachment) — only include if uploaded.
            if (!a.sourceId) return null
            return {
              source_id: a.sourceId,
              filename: a.file.name,
              content_type: a.file.type,
              size_bytes: a.file.size,
            }
          }
          // Stored attachment (UploadedDocument).
          const doc = a as UploadedDocument
          if (!doc.sourceId) return null
          return {
            source_id: doc.sourceId,
            filename: doc.filename,
            content_type: doc.contentType,
            size_bytes: doc.sizeBytes,
          }
        })
        .filter((a): a is AttachmentIn => a !== null)

      const now = Date.now()
      // Drop the synthetic interrupted marker (if any) BEFORE we append the
      // real assistant placeholder — otherwise Retry would leave two
      // assistant bubbles in a row: "The process was interrupted." and the
      // fresh streaming one.
      store.removeTrailingInterrupted(sessionId)
      store.appendMessage(sessionId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: now,
      })
      store.setStreaming(sessionId, true)
      store.clearError(sessionId)

      // Same `agentError` capture pattern as `send` — BE emits `error`
      // frame BEFORE `turn_end`, so we buffer it and reject on turn_end.
      let agentError: string | null = null
      let alertCode: ChatAlertCode | null = null
      const status = new StatusStream({
        onStatus: (line) => store.setLastAssistantStatus(sessionId, line),
        onText: (delta) => store.patchLastAssistant(sessionId, delta),
      })
      try {
        await new Promise<void>((resolve, reject) => {
          open(
            sessionId,
            { message: last.content, attachments: attachmentsIn },
            {
              onFrame: (frame) => {
                // Same split as the send path — see there.
                if (status.accept(frame)) return
                if (frame.event === 'error') {
                  agentError = frame.data.message || 'Agent error'
                  const mapped = frame.data.code
                    ? ALERT_CODES[frame.data.code]
                    : undefined
                  if (mapped) {
                    alertCode = mapped
                    store.setAlert(mapped)
                  }
                } else if (frame.event === 'turn_end') {
                  if (typeof frame.data.response_time_ms === 'number') {
                    store.setLastAssistantResponseTime(
                      sessionId,
                      frame.data.response_time_ms,
                    )
                  }
                  store.setLastAssistantEscalation(
                    sessionId,
                    Boolean(frame.data.requires_escalation),
                  )
                  const finishMapped = frame.data.finish_reason
                    ? ALERT_CODES[frame.data.finish_reason]
                    : undefined
                  if (finishMapped && !alertCode) {
                    alertCode = finishMapped
                    store.setAlert(finishMapped)
                  }
                  if (frame.data.requires_escalation && !alertCode) {
                    alertCode = 'requires_escalation'
                    store.setAlert('requires_escalation')
                  }
                  // Same rollback guard as the send path — a withheld answer
                  // must not carry a verified-sources list.
                  if (!frame.data.rolled_back && frame.data.citation_refs?.length) {
                    store.setLastAssistantCitations(
                      sessionId,
                      frame.data.citation_refs,
                    )
                  }
                  // Same sidebar refresh as the send path. `last` is the
                  // user message this resume re-fired, so the preview lands
                  // on the same text a refetch would return.
                  if (!frame.data.rolled_back) {
                    useSessionsStore
                      .getState()
                      .touchSession(sessionId, last.content)
                  }
                }
              },
              onDone: (result) => {
                // Deferred for the same reason as the send path — see there.
                const settled = () => {
                  store.setLastAssistantStatus(sessionId, null)
                  store.setStreaming(sessionId, false)
                }
                if (result.ok && !agentError) status.finish(settled)
                else {
                  status.abandon()
                  settled()
                }
                if (agentError) reject(new Error(agentError))
                else if (result.ok) {
                  if (!alertCode) store.clearAlert()
                  resolve()
                } else reject(new Error(result.error))
              },
            },
          )
        })
      } catch (err) {
        // Failure here → normal RETRY protocol so the user can hit Retry again.
        // Suppress retry banner when a typed alert already explains the failure.
        store.setError(sessionId, alertCode ? null : ERROR_BANNER, {
          text: last.content,
          attachments: [],
        })
        console.warn(
          '[useChatSend.resume]',
          err instanceof Error ? err.message : String(err),
        )
      }
    },
    [open],
  )

  return { send, resume, abort }
}
