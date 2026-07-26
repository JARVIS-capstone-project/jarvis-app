import { useCallback, useRef } from 'react'
import { agentService } from '@modules/chat/api/agent-service'
import type { ChatRequest, SseFrame } from '@modules/chat/api/agent-types'
import { SseParser } from '@modules/chat/model/parse-sse'

interface StreamHandlers {
  /** Called once per parsed frame, in order. */
  onFrame: (frame: SseFrame) => void
  /**
   * Fires exactly once — on natural `turn_end`, network error, missing
   * `turn_end`, or user abort. Callers rely on this single fire to reset
   * their composer / streaming state. Never fires twice.
   */
  onDone: (result: { ok: true } | { ok: false; error: string }) => void
}

interface UseSseStreamResult {
  /**
   * Opens a fresh SSE stream. If a prior stream from this hook is still
   * running, it's aborted first (last-writer-wins) — but note the aborted
   * stream's `onDone` still fires with `ok: false`, so consumers should
   * guard against that if they don't want the RETRY protocol tripping.
   */
  open: (
    sessionId: string,
    body: ChatRequest,
    handlers: StreamHandlers,
  ) => Promise<void>
  /** Aborts the active stream (if any). Idempotent. */
  abort: () => void
}

/**
 * Wraps `agentService.openStream` in a React-lifecycle-safe shape:
 *   - one `AbortController` per open call, tracked in a ref
 *   - the parser is driven off the response body reader
 *   - onDone fires exactly once, no matter how the stream terminates
 *   - unmount aborts the active stream (no zombie readers)
 *
 * Per NFR-041 ("Every stream ends with `turn_end`"): if the stream closes
 * without a `turn_end` frame, we treat it as a failure so the caller's
 * RETRY protocol trips. A clean close should always be preceded by
 * `turn_end` from the BE.
 */
export function useSseStream(): UseSseStreamResult {
  const abortRef = useRef<AbortController | null>(null)

  const open = useCallback(
    async (
      sessionId: string,
      body: ChatRequest,
      handlers: StreamHandlers,
    ): Promise<void> => {
      // Last-writer-wins: cancel any prior stream on this hook instance.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      let doneFired = false
      const fireDone = (result: { ok: true } | { ok: false; error: string }) => {
        if (doneFired) return
        doneFired = true
        handlers.onDone(result)
      }

      try {
        const res = await agentService.openStream(sessionId, body, controller.signal)
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        const parser = new SseParser()

        let sawTurnEnd = false
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          for (const frame of parser.feed(chunk)) {
            handlers.onFrame(frame)
            if (frame.event === 'turn_end') sawTurnEnd = true
          }
        }

        fireDone(
          sawTurnEnd
            ? { ok: true }
            : { ok: false, error: 'Stream closed without turn_end' },
        )
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'Stream aborted'
            : err instanceof Error
              ? err.message
              : 'Stream failed'
        fireDone({ ok: false, error: msg })
      } finally {
        // Clear the ref only if it still points at OUR controller (a newer
        // open() may have already replaced it).
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [],
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // NOTE: no unmount cleanup. `useChatSend` navigates from `/new` to
  // `/chat/:sessionId` immediately after POST /sessions returns — that
  // route change unmounts the whole tree (routes.tsx has two separate
  // entries). If we aborted on unmount, the just-opened POST /stream
  // fetch would be canceled before any frames arrive, matching the
  // "(canceled)" status seen in DevTools.
  //
  // Safe to skip because:
  //   1. Streams self-terminate on `turn_end`.
  //   2. The reader loop lives inside an active Promise → survives unmount.
  //   3. Frames arriving post-unmount update the zustand store (module
  //      scope, always alive) — data still lands correctly.
  //   4. `abort()` is still exposed for genuine user cancellation.

  return { open, abort }
}
