import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { agentService } from '@modules/chat/api/agent-service'
import type { AttachmentIn, MessageDTO } from '@modules/chat/api/agent-types'
import { useChatSessionStore } from '@modules/chat/model/chat-session-store'
import { isRefusal, parseRefusalReason } from '@modules/chat/model/refusal'
import { useRollbackHintsStore } from '@modules/chat/model/rollback-hints-store'
import type {
  ChatMessage,
  MessageRole,
  UploadedDocument,
} from '@modules/chat/model/types'

/**
 * Hydrates a session's messages from the BE on mount. Fires exactly once
 * per `sessionId` change, and is guarded by three conditions:
 *
 *   1. `sessionId` is present (skip on `/new`)
 *   2. Store has no messages for this session yet (in-memory cache hit → skip)
 *   3. Session is NOT currently streaming (race defense — never overwrite
 *      an in-flight token stream)
 *
 * On 404 → navigate to `/new`. Other errors are swallowed with a console
 * warn (a future global 401 handler will pluck those out separately).
 *
 * Historical attachments are mapped from `AttachmentIn` (BE) → `UploadedDocument`
 * (FE); the message-bubble renders them via `StoredAttachmentTile`, which
 * shares the preview-modal pipeline with live attachments.
 */
export function useHydrateSession(sessionId: string | null | undefined): void {
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionId) return

    // Guard: skip if store already has data, or if a stream is running.
    const cur = useChatSessionStore.getState().byId[sessionId]
    if (cur && cur.messages.length > 0) return
    if (cur?.streaming) return

    let cancelled = false
    const store = useChatSessionStore.getState()
    store.ensure(sessionId)
    store.setHydrating(sessionId, true)

    ;(async () => {
      try {
        const detail = await agentService.getSession(sessionId)
        if (cancelled) return

        // Re-check the guards — a stream may have started between the
        // effect firing and the network round-trip returning.
        const now = useChatSessionStore.getState().byId[sessionId]
        if (now?.streaming) return
        if (now && now.messages.length > 0) return

        const messages: ChatMessage[] = detail.messages.map(fromMessageDto)
        // Interrupted-turn synthesis: if the persisted tail is a user with
        // no assistant reply, the previous stream was cut off. Append a
        // client-only dim "The process was interrupted." marker so the
        // messages list carries the status inline (MessageBubble renders
        // it dim/italic). Never sent to the BE; re-synthesised on every
        // hydration. `send()` / `resume()` strip it before appending new
        // messages so it doesn't linger mid-list.
        const tail = messages[messages.length - 1]
        if (tail?.role === 'user') {
          messages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'The process was interrupted.',
            createdAt: tail.createdAt + 1,
            interrupted: true,
          })
        }
        useChatSessionStore.getState().setMessages(sessionId, messages)
        // Rollback self-heal: a hint that was written during the live turn
        // is only truthful if the BE actually rolled the turn back — which
        // manifests as `GET /sessions/{id}` returning fewer turns than the
        // in-memory transcript had. If any assistant message came back on
        // hydration, the "no answer" story the banner would tell is stale.
        // Clear it so the notice does not fire on a session that already
        // has a valid answer sitting in it.
        if (messages.some((m) => m.role === 'assistant' && !m.interrupted)) {
          useRollbackHintsStore.getState().clear(sessionId)
        }
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('404')) {
          console.warn('[hydrate-session] session not found, redirecting to /new')
          navigate('/new', { replace: true })
          return
        }
        console.warn('[hydrate-session]', msg)
      } finally {
        if (!cancelled) {
          useChatSessionStore.getState().setHydrating(sessionId, false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId, navigate])
}

/**
 * BE MessageDTO → FE ChatMessage. Since the BE doesn't emit stable message
 * ids or creation times per message, we synthesise:
 *   - `id`: `crypto.randomUUID()` — stable within this render session; React
 *           keys survive since we never mutate the array shape.
 *   - `createdAt`: 0 — historical marker; not used for sorting (BE order wins).
 */
function fromMessageDto(dto: MessageDTO): ChatMessage {
  const role: MessageRole = dto.role === 'assistant' ? 'assistant' : 'user'
  // Refusal detection on hydration: a NO_CONFIDENT_MATCH answer that landed
  // in a previous session must render as the same card the live path
  // produces — otherwise the token would flash into view every time the
  // page reloads. Applied here so the mapping is single-source.
  const isRefusalMsg = role === 'assistant' && isRefusal(dto.content)
  return {
    id: crypto.randomUUID(),
    role,
    // Wipe the raw token — the card renderer supplies its own copy. See
    // markLastAssistantRefusal for the mirror on the live path.
    content: isRefusalMsg ? '' : dto.content,
    createdAt: 0,
    attachments: dto.attachments && dto.attachments.length > 0
      ? dto.attachments.map(fromAttachmentIn)
      : undefined,
    // Only assistant messages carry `turn`; the BE returns null for user rows.
    responseTimeMs: dto.turn?.response_time_ms ?? null,
    requiresEscalation: dto.turn?.requires_escalation ?? null,
    citationRefs: dto.turn?.citation_refs ?? null,
    variant: isRefusalMsg ? 'refusal' : undefined,
    refusalReason: isRefusalMsg ? parseRefusalReason(dto.content) : undefined,
  }
}

/**
 * BE AttachmentIn → FE UploadedDocument. Historical attachments only carry
 * the 4-key SYNC-1 shape; we fill the rest with sensible defaults so the
 * downstream types line up. `status: 'done'` — BE never persists a failed
 * attachment reference on a message.
 */
function fromAttachmentIn(a: AttachmentIn): UploadedDocument {
  return {
    // key must be stable across renders — sourceId is guaranteed unique.
    key: a.source_id,
    sourceId: a.source_id,
    filename: a.filename,
    contentType: a.content_type,
    sizeBytes: a.size_bytes,
    status: 'done',
  }
}
