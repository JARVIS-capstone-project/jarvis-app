import { Plug } from 'lucide-react'
import { cn } from '@shared/lib/cn'

/**
 * Provider mark for an MCP catalog entry, served from `public/mcp/`.
 *
 * Rendered as `<img>` rather than inlined into the JSX, and that is not just
 * convenience: the Jira mark defines its gradients as `<linearGradient id=…>`.
 * Inlined, two Jira rows on one page would put duplicate ids in the document
 * and both `fill="url(#…)"` references would resolve to the first — a fill
 * that breaks only when a second instance appears. Each `<img>` is its own
 * SVG document, so the ids stay scoped.
 *
 * `catalogId` is a plain string, not a union: the platform catalog already
 * carries eight entries and a user can add a custom server under any id, so
 * anything unmapped has to render *something*. Unknown ids fall back to a
 * neutral plug rather than a broken image.
 *
 * `alt=""` because every use spells the provider name out beside the mark;
 * announcing "Jira logo, Jira" is noise for a screen reader.
 */
const SRC: Record<string, string> = {
  jira: '/mcp/jira.svg',
  slack: '/mcp/slack.svg',
  notion: '/mcp/notion.svg',
}

export function McpLogo({
  catalogId,
  className = 'size-5',
}: {
  catalogId: string | null | undefined
  className?: string
}) {
  const src = catalogId ? SRC[catalogId] : undefined
  if (!src) {
    return <Plug className={cn('text-muted', className)} aria-hidden="true" />
  }
  return <img src={src} alt="" aria-hidden="true" className={className} />
}
