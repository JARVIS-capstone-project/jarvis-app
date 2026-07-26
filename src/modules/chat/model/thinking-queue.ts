/**
 * Throttled display queue for `thinking_delta` SSE frames.
 *
 * BE emits reasoning steps back-to-back (often <100ms apart). We display
 * them one at a time with a **0.8s minimum per delta** — even if the next
 * one arrives faster — so the user can actually read them.
 *
 * ORDERING GUARANTEE: `text_delta` never overtakes queued thinking. If the
 * queue is still draining when the first `text_delta` arrives, the text is
 * buffered internally and released only after the last thinking has served
 * its 0.8s window. This matches the UX rule "drain queue at 0.8s each, then
 * text" — the user finishes reading the reasoning before the answer replaces
 * it.
 *
 * LIFECYCLE: one instance per stream. Call `dispose()` on `turn_end` /
 * error / abort to flush any buffered text and clear the pending timer.
 */

const MIN_DISPLAY_MS = 800

export interface ThinkingQueueCallbacks {
  /** Called with the next thinking_delta to display. Fires at most once per
   *  0.8s window; the caller writes it to the store as-is. */
  onThinking: (text: string) => void
  /** Called when text_delta chunks are released — either passed through
   *  (queue empty) or flushed after the queue drains. String is the delta
   *  to append to the assistant message content. */
  onText: (delta: string) => void
}

export class ThinkingQueue {
  private pending: string[] = []
  private bufferedText = ''
  /** True from `onThinking` fire until 800ms later. Guards the min-display. */
  private isDisplaying = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  constructor(private readonly cb: ThinkingQueueCallbacks) {}

  /** Enqueue a thinking_delta. Starts the drain loop if idle. */
  addThinking(text: string): void {
    if (this.disposed) return
    this.pending.push(text)
    if (!this.isDisplaying) this.drainNext()
  }

  /** A text_delta arrived. Pass through if queue is idle; otherwise buffer
   *  until drain completes. */
  addText(delta: string): void {
    if (this.disposed) return
    if (this.isDisplaying || this.pending.length > 0) {
      this.bufferedText += delta
    } else {
      this.cb.onText(delta)
    }
  }

  /** Stop the timer, flush any buffered text (so the reply isn't lost on
   *  abort mid-drain). Safe to call multiple times. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.bufferedText) {
      this.cb.onText(this.bufferedText)
      this.bufferedText = ''
    }
  }

  private drainNext = (): void => {
    if (this.disposed) return
    const next = this.pending.shift()
    if (next === undefined) {
      // Queue empty — drain is complete. Release any buffered text now.
      this.isDisplaying = false
      this.timer = null
      if (this.bufferedText) {
        const flush = this.bufferedText
        this.bufferedText = ''
        this.cb.onText(flush)
      }
      return
    }
    this.isDisplaying = true
    this.cb.onThinking(next)
    this.timer = setTimeout(this.drainNext, MIN_DISPLAY_MS)
  }
}
