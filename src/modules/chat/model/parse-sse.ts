import type { SseFrame } from '@modules/chat/api/agent-types'

/**
 * Buffered SSE frame parser. Feed it decoded string chunks from the response
 * reader; it yields fully-formed `SseFrame` objects as they complete.
 *
 * Wire format (per WHATWG EventSource spec):
 *
 *   event: token\n
 *   data: {"delta":"hello"}\n
 *   \n
 *
 * Frames are separated by a BLANK LINE. `event:` sets the type; `data:` is
 * JSON (single-line for our agent). Everything else (`id:`, `retry:`,
 * comment lines starting with `:`) is ignored.
 *
 * Chunk boundaries are handled — a partial line stays in the internal
 * buffer until the next `\n` arrives, so this is safe over any TCP framing.
 *
 * Malformed JSON in `data:` silently drops that ONE frame — never throws.
 * The stream itself must survive a bad payload (a stray malformed event
 * shouldn't kill the whole conversation).
 */
export class SseParser {
  private buffer = ''
  private currentEvent = ''
  private currentData = ''

  /**
   * Feed one decoded chunk; returns every complete frame in it (usually 0–N).
   * Array allocation is negligible — SSE chunks are tiny (< 1 KB) and each
   * turn produces low-hundreds of frames total.
   */
  feed(chunk: string): SseFrame[] {
    const frames: SseFrame[] = []
    this.buffer += chunk
    let lineEnd: number
    while ((lineEnd = this.buffer.indexOf('\n')) !== -1) {
      const rawLine = this.buffer.slice(0, lineEnd)
      // Strip a trailing \r for CRLF-normalised servers.
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
      this.buffer = this.buffer.slice(lineEnd + 1)

      if (line === '') {
        // Blank line = frame terminator. Emit if we accumulated anything.
        if (this.currentEvent !== '' && this.currentData !== '') {
          const frame = this.tryEmit(this.currentEvent, this.currentData)
          if (frame) frames.push(frame)
        }
        this.currentEvent = ''
        this.currentData = ''
        continue
      }

      // Comment line — ignore per spec.
      if (line.startsWith(':')) continue

      if (line.startsWith('event:')) {
        this.currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        // Per spec, multiple `data:` lines concat with '\n'. Our agent emits
        // single-line data — but honour the spec for safety.
        if (this.currentData !== '') this.currentData += '\n'
        this.currentData += line.slice(5).trim()
      }
      // id:, retry:, unknown fields — ignored.
    }
    return frames
  }

  private tryEmit(event: string, data: string): SseFrame | null {
    try {
      return { event, data: JSON.parse(data) } as SseFrame
    } catch {
      // Malformed JSON — drop this frame silently.
      return null
    }
  }
}
