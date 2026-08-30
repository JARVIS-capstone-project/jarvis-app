import { StatusQueue, type StatusQueueCallbacks } from '@modules/chat/model/status-queue'
import type { SseFrame } from '@modules/chat/api/agent-types'

/** Matches every `**bold**` span in the reasoning stream. Gemini structures
 *  thinking as `**Heading**\n\nBody…`; only the heading is worth showing, and
 *  `[^*]+` bans `**` from appearing inside so a partial opening mid-chunk
 *  cannot match. */
const HEADING_PATTERN = /\*\*([^*]+)\*\*/g

/**
 * Turns the stream's display-bearing frames into paced status lines.
 *
 * Owns the two pieces of per-stream state that decision needs — the queue, and
 * the reasoning text accumulated so far — so both the send and the resume path
 * get identical behaviour from one place. They previously carried a copy each
 * and had already drifted.
 *
 * **Thinking is accumulated, not forwarded.** A `thinking_delta` is a wire
 * chunk, not a thought: `"**Analyz"` and `"ing the query**\n\nThe user asks"`
 * are two frames of one heading. Enqueueing each would spend an 800 ms window
 * on a fragment that contains no complete `**…**` and so renders as the bare
 * word "Thinking…". Instead the text is appended to a buffer, the latest
 * heading re-extracted, and a line enqueued only when that heading actually
 * changes — so the pane advances once per thought rather than once per packet.
 */
export class StatusStream {
  private readonly queue: StatusQueue
  /** Every thinking delta this turn, concatenated. */
  private thinkingBuffer = ''
  /** Last heading pushed to the queue — the dedup key. */
  private lastHeading = ''

  constructor(cb: StatusQueueCallbacks) {
    this.queue = new StatusQueue(cb)
  }

  /**
   * Consume `frame` if the status pane displays it.
   *
   * Returns `true` when handled, so a caller can `if (stream.accept(f)) return`
   * and keep its own branches for the frames that carry turn state.
   */
  accept(frame: SseFrame): boolean {
    switch (frame.event) {
      case 'text_delta':
        this.queue.addText(frame.data.delta)
        return true

      case 'thinking_delta':
        this.pushThinking(frame.data.delta)
        return true

      case 'validation_start':
        this.push(frame.data.message)
        return true

      case 'validation_sources': {
        // Deliberately not "…in the knowledge base": the harvest includes the
        // user's own attachments, which are the untrusted half of the very
        // distinction this pane exists to draw.
        //
        // `count` is trusted straight off the wire by the parser, so it is
        // checked here — "Checked undefined sources" would otherwise hold the
        // pane for a full window.
        const n = typeof frame.data.count === 'number' ? frame.data.count : null
        this.push(n === null ? 'Checking the sources' : `Checked ${n} source${n === 1 ? '' : 's'}`)
        return true
      }

      case 'validation_result':
        // Two windows, not one: the verdict and the explanation behind it each
        // get their own, so neither is skimmed past.
        this.push(frame.data.message)
        // `reason` can come back empty — skipped rather than spending a window
        // on a blank line.
        if (frame.data.reason) this.push(frame.data.reason)
        return true

      case 'validation_error':
        this.push(frame.data.message, 'validation-error')
        return true

      default:
        return false
    }
  }

  /** Stream ended cleanly — let the queue finish before settling. */
  finish(onSettled?: () => void): void {
    this.queue.finish(onSettled)
  }

  /** Stream failed or was aborted — drop what is queued. */
  abandon(): void {
    this.queue.abandon()
  }

  private push(text: string, kind: 'validation' | 'validation-error' = 'validation'): void {
    this.queue.addStatus({ kind, text })
  }

  private pushThinking(delta: string): void {
    this.thinkingBuffer += delta
    const heading = [...this.thinkingBuffer.matchAll(HEADING_PATTERN)]
      .at(-1)?.[1]
      ?.trim()
    // No complete heading yet — the caller's own "Thinking…" indicator already
    // covers this window, so there is nothing to enqueue.
    if (!heading || heading === this.lastHeading) return
    this.lastHeading = heading
    this.queue.addStatus({ kind: 'thinking', text: heading })
  }
}
