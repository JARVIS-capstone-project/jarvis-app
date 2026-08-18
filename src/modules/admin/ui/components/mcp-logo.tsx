import type { McpCatalogId } from '@modules/admin/api/mcp-connections-mock'

/**
 * Provider marks for the MCP catalog, served from `public/mcp/`.
 *
 * Rendered as `<img>` rather than inlined into the JSX, and that is not just
 * convenience: the Jira mark defines its gradients as `<linearGradient id=…>`.
 * Inlined, two Jira rows on one page would put duplicate ids in the document
 * and both `fill="url(#…)"` references would resolve to the first — a fill
 * that breaks only when a second instance appears. Each `<img>` is its own
 * SVG document, so the ids stay scoped.
 *
 * `alt=""` because the provider name is already spelled out beside every use;
 * announcing "Jira logo, Jira" is noise for a screen reader.
 */
const SRC: Record<McpCatalogId, string> = {
  jira: '/mcp/jira.svg',
  slack: '/mcp/slack.svg',
}

export function McpLogo({
  catalogId,
  className = 'size-5',
}: {
  catalogId: McpCatalogId
  className?: string
}) {
  return <img src={SRC[catalogId]} alt="" aria-hidden="true" className={className} />
}
