import { useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { agentService } from '@modules/chat/api/agent-service'
import type { AttachmentIn } from '@modules/chat/api/agent-types'
import {
  PRE_SESSION_KEY,
  useChatSessionStore,
} from '@modules/chat/model/chat-session-store'
import { useSessionsStore } from '@modules/chat/model/sessions-store'
import { ThinkingQueue } from '@modules/chat/model/thinking-queue'
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
        // Per-stream thinking queue — throttles thinking_delta display to
        // 0.8s each and buffers text_delta until the queue drains.
        const thinking = new ThinkingQueue({
          onThinking: (text) => store.setLastAssistantThinking(sid!, text),
          onText: (delta) => store.patchLastAssistant(sid!, delta),
        })
        await new Promise<void>((resolve, reject) => {
          open(
            sid!,
            { message: snapshot.text, attachments: attachmentsIn },
            {
              onFrame: (frame) => {
                if (frame.event === 'text_delta') {
                  thinking.addText(frame.data.delta)
                } else if (frame.event === 'thinking_delta') {
                  thinking.addThinking(frame.data.delta)
                } else if (frame.event === 'error') {
                  agentError = frame.data.message || 'Agent error'
                }
                // thinking_end / tool_* / warning / turn_start / citation —
                // typed for parser safety but not wired to UI yet.
              },
              onDone: (result) => {
                // Flush any buffered text and stop the drain timer before
                // we flip streaming off — otherwise a straggler chunk could
                // land after `setStreaming(false)` and look like a bug.
                thinking.dispose()
                store.setLastAssistantThinking(sid!, null)
                store.setStreaming(sid!, false)
                if (agentError) reject(new Error(agentError))
                else if (result.ok) resolve()
                else reject(new Error(result.error))
              },
            },
          )
        })
      } catch (err) {
        // RETRY protocol.
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
        store.setError(key, ERROR_BANNER, {
          text: snapshot.text,
          // Use the enriched attachments (with sourceId set on the ones
          // that succeeded) so retry skips them.
          attachments: uploadedAttachments,
        })
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
      const thinking = new ThinkingQueue({
        onThinking: (text) => store.setLastAssistantThinking(sessionId, text),
        onText: (delta) => store.patchLastAssistant(sessionId, delta),
      })
      try {
        await new Promise<void>((resolve, reject) => {
          open(
            sessionId,
            { message: last.content, attachments: attachmentsIn },
            {
              onFrame: (frame) => {
                if (frame.event === 'text_delta') {
                  thinking.addText(frame.data.delta)
                } else if (frame.event === 'thinking_delta') {
                  thinking.addThinking(frame.data.delta)
                } else if (frame.event === 'error') {
                  agentError = frame.data.message || 'Agent error'
                }
              },
              onDone: (result) => {
                thinking.dispose()
                store.setLastAssistantThinking(sessionId, null)
                store.setStreaming(sessionId, false)
                if (agentError) reject(new Error(agentError))
                else if (result.ok) resolve()
                else reject(new Error(result.error))
              },
            },
          )
        })
      } catch (err) {
        // Failure here → normal RETRY protocol so the user can hit Retry again.
        store.setError(sessionId, ERROR_BANNER, {
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
