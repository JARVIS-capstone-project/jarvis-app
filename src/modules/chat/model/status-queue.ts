import type { StatusLine } from '@modules/chat/model/types'

/**
 * Throttled display queue for the pre-answer status pane.
 *
 * Two producers feed it: `thinking_delta` (the model reasoning) and the
 * `validation_*` frames (the faithfulness gate checking the draft). Both emit
 * back-to-back — often <100ms apart — so lines are shown one at a time with a
 * **0.8s minimum each**, even when the next arrives faster, so the user can
 * actually read them.
 *
 * ORDERING GUARANTEE: `text_delta` never overtakes queued status. If the queue
 * is still draining when the first `text_delta` arrives, the text is buffered
 * internally and released only after the last line has served its 0.8s window.
 * The user finishes reading what the agent was doing before the answer
 * replaces it.
 *
 * LIFECYCLE: one instance per stream, ending one of two ways.
 *
 * `finish()` on `turn_end` — stop accepting input, but let what is already
 * queued keep its window. The gate's verdict lands one frame before `turn_end`
 * on a checked turn, so a close that dropped the queue would discard the very
 * sentence the user was waiting on. `onSettled` fires once the last line has
 * served its time and the buffered answer has been released, which is when the
 * caller may clear the status line and re-enable the composer.
 *
 * `abandon()` on error or user abort — stop now, keep nothing. The answer is
 * still flushed; a half-finished status commentary is not worth the wait when
 * the turn has already failed.
 */

const MIN_DISPLAY_MS = 800

export interface StatusQueueCallbacks {
  /** Called with the next status line to display. Fires at most once per
   *  0.8s window; the caller writes it to the store as-is. */
  onStatus: (line: StatusLine) => void
  /** Called when text_delta chunks are released — either passed through
   *  (queue empty) or flushed after the queue drains. String is the delta
   *  to append to the assistant message content. */
  onText: (delta: string) => void
}

export class StatusQueue {
  private pending: StatusLine[] = []
  private bufferedText = ''
  /** True from `onStatus` fire until 800ms later. Guards the min-display. */
  private isDisplaying = false
  private timer: ReturnType<typeof setTimeout> | null = null
  /** Closed to new input. The queue keeps draining. */
  private closed = false
  /** Settled — nothing more will be emitted, by either exit. */
  private done = false
  private onSettled?: () => void

  constructor(private readonly cb: StatusQueueCallbacks) {}

  /** Enqueue a status line. Starts the drain loop if idle. */
  addStatus(line: StatusLine): void {
    if (this.closed) return
    this.pending.push(line)
    if (!this.isDisplaying) this.drainNext()
  }

  /** A text_delta arrived. Pass through if queue is idle; otherwise buffer
   *  until drain completes. */
  addText(delta: string): void {
    if (this.done) return
    if (this.isDisplaying || this.pending.length > 0) {
      this.bufferedText += delta
    } else {
      this.cb.onText(delta)
    }
  }

  /**
   * The stream ended cleanly. Take no more input, but let every queued line
   * serve its window before releasing the answer and calling `onSettled`.
   *
   * Settles immediately when the queue is already idle, which is the common
   * case — an ungated turn queues nothing after its last thinking line.
   */
  finish(onSettled?: () => void): void {
    if (this.done) return
    this.closed = true
    this.onSettled = onSettled
    if (!this.isDisplaying && this.pending.length === 0) this.settle()
  }

  /** The stream failed or was aborted. Drop the queue, release whatever text
   *  arrived so the reply is not lost, and settle. Safe to call twice, and
   *  safe to call after `finish()` — an abort mid-drain lands here. */
  abandon(): void {
    if (this.done) return
    this.closed = true
    this.pending = []
    this.settle()
  }

  /** Terminal, once. Clears the timer, releases buffered text, notifies. */
  private settle(): void {
    this.done = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.isDisplaying = false
    if (this.bufferedText) {
      const flush = this.bufferedText
      this.bufferedText = ''
      this.cb.onText(flush)
    }
    const notify = this.onSettled
    this.onSettled = undefined
    notify?.()
  }

  private drainNext = (): void => {
    if (this.done) return
    const next = this.pending.shift()
    if (next === undefined) {
      this.isDisplaying = false
      this.timer = null
      // Closed and drained — this is the last thing that happens.
      if (this.closed) {
        this.settle()
        return
      }
      // Still live: release buffered text and idle until the next line.
      if (this.bufferedText) {
        const flush = this.bufferedText
        this.bufferedText = ''
        this.cb.onText(flush)
      }
      return
    }
    this.isDisplaying = true
    this.cb.onStatus(next)
    this.timer = setTimeout(this.drainNext, MIN_DISPLAY_MS)
  }
}
