import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Configure the pdfjs worker once at module load. Vite's `?url` suffix
// bundles the worker file and returns its final URL — required before
// any getDocument() call.
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

export type PdfThumbnailStatus = 'loading' | 'ready' | 'error'

interface UsePdfThumbnailResult {
  /** Attach to the <canvas> that will hold the rendered first-page raster. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  status: PdfThumbnailStatus
}

/**
 * Renders a PDF's first page into a canvas at 2x the intended display width
 * (retina-friendly), then flips `status` to 'ready'. Cancels safely on unmount
 * or when the file changes — a still-decoding PDF won't setState into a
 * removed component.
 *
 * `displayWidth` controls the canvas pixel buffer target; the CSS box on the
 * canvas itself is set by the caller.
 */
export function usePdfThumbnail(file: File, displayWidth = 120): UsePdfThumbnailResult {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<PdfThumbnailStatus>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // ArrayBuffer avoids an internal blob-URL fetch on pdfjs's side.
        const buffer = await file.arrayBuffer()
        if (cancelled) return
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        if (cancelled) return
        const base = page.getViewport({ scale: 1 })
        // 2× target pixel width for retina crispness.
        const viewport = page.getViewport({ scale: (displayWidth * 2) / base.width })
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file, displayWidth])

  return { canvasRef, status }
}
