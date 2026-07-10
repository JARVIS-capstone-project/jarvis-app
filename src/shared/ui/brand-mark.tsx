import { cn } from '@shared/lib/cn'

/**
 * The J.A.R.V.I.S mark — the SVG stroke logo from `/public/branding/logo`.
 * A visual stamp; pair with a wordmark (`<span>J.A.R.V.I.S</span>`) or a
 * heading for a full lockup.
 *
 * Sized by height + intrinsic aspect (215:197 ≈ square). Override via
 * `className` (e.g. `h-6`, `h-12`). Colors are baked into the SVG — the
 * brand orange reads well on both light and dark canvases, so no runtime
 * tinting is needed.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/branding/logo/jarvis.svg"
      alt="J.A.R.V.I.S"
      width={215}
      height={197}
      className={cn('h-8 w-auto shrink-0', className)}
    />
  )
}
