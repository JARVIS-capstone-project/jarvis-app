import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@shared/lib/cn'

type MarkdownProps = HTMLAttributes<HTMLDivElement> & {
  /** Raw markdown content. */
  content: string
}

/**
 * The BE's citation scheme (`private_kb/citations.py`, `CITE_SCHEME`). The
 * agent rewrites `[<id>]` markers in an answer into `[label](cite:<id>)`, so
 * the reader sees a document name while the id stays machine-addressable.
 *
 * These are references, not destinations — see the `a` override.
 */
const CITE_SCHEME = 'cite:'

/**
 * Let `cite:` reach the `a` override intact; everything else keeps
 * react-markdown's own sanitiser.
 *
 * Without this the feature is silently inert. `defaultUrlTransform` allows only
 * `http(s)`, `irc(s)`, `mailto` and `xmpp`, and rewrites anything else to the
 * empty string — so `cite:` arrives as `href=""`, the override's check fails,
 * and the citation renders as a live anchor whose empty href resolves to the
 * *current page*. Clicking one would open a second copy of the app.
 *
 * Passing the scheme through is safe because it never reaches the DOM: the
 * override drops `href` and renders a `<span>`. That branch is now the only
 * thing keeping it off — do not remove one without the other. `javascript:`
 * and friends are still blanked here, and the BE only ever emits `cite:` for
 * ids that resolve against the turn's own retrieved sources.
 */
function urlTransform(url: string): string {
  return url.startsWith(CITE_SCHEME) ? url : defaultUrlTransform(url)
}

/**
 * Token-styled markdown renderer. Uses `react-markdown` with `remark-gfm`
 * for GitHub-flavoured extras (tables, task lists, autolinks, strikethrough).
 *
 * Safety: `react-markdown` does NOT render raw HTML by default — LLM output
 * containing `<script>` tags or `onerror=` handlers is treated as text.
 * Anything the agent-system streams is XSS-safe here.
 *
 * Every element is mapped to semantic tokens (`text-heading`, `bg-canvas`,
 * `border-divider`, `text-brand`) so light/dark themes work automatically.
 * Consumers pass `className` to override or add surrounding spacing.
 */
export function Markdown({ content, className, ...props }: MarkdownProps) {
  return (
    <div
      className={cn(
        'text-sm text-inherit [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={urlTransform}
        components={{
          h1: (p) => (
            <h1 {...stripNode(p)} className={cn('mb-3 mt-5 text-lg font-semibold text-heading', p.className)} />
          ),
          h2: (p) => (
            <h2 {...stripNode(p)} className={cn('mb-2 mt-4 text-base font-semibold text-heading', p.className)} />
          ),
          h3: (p) => (
            <h3 {...stripNode(p)} className={cn('mb-2 mt-3 text-sm font-semibold text-heading', p.className)} />
          ),
          p: (p) => (
            <p {...stripNode(p)} className={cn('my-2 leading-relaxed', p.className)} />
          ),
          ul: (p) => (
            <ul {...stripNode(p)} className={cn('my-2 list-disc space-y-1 pl-5', p.className)} />
          ),
          ol: (p) => (
            <ol {...stripNode(p)} className={cn('my-2 list-decimal space-y-1 pl-5', p.className)} />
          ),
          li: (p) => (
            <li {...stripNode(p)} className={cn('leading-relaxed', p.className)} />
          ),
          a: (p) => {
            // A citation names a document, not a place to go: KB sources have
            // no user-facing URL at all, and an attachment is already reachable
            // from the tile on the user's own message. So it is rendered with
            // weight and colour but no link affordance — no underline, no
            // pointer, not in the tab order.
            //
            // Dropping `href` is what keeps a model-authored `cite:` target
            // off the DOM — `urlTransform` above deliberately waves the scheme
            // past react-markdown's sanitiser so this branch can see it.
            if (p.href?.startsWith(CITE_SCHEME)) {
              const { href: _href, ...rest } = stripNode(p)
              void _href
              return (
                <span
                  {...rest}
                  className={cn('font-medium text-brand', p.className)}
                />
              )
            }
            return (
              <a
                {...stripNode(p)}
                className={cn(
                  'text-brand underline decoration-brand/40 transition-colors hover:text-brand-hover hover:decoration-brand-hover',
                  p.className,
                )}
                target="_blank"
                rel="noreferrer noopener"
              />
            )
          },
          strong: (p) => (
            <strong {...stripNode(p)} className={cn('font-semibold text-heading', p.className)} />
          ),
          em: (p) => <em {...stripNode(p)} className={cn('italic', p.className)} />,
          blockquote: (p) => (
            <blockquote
              {...stripNode(p)}
              className={cn(
                'my-3 border-l-4 border-divider bg-canvas/40 px-3 py-1 italic text-body',
                p.className,
              )}
            />
          ),
          hr: (p) => <hr {...stripNode(p)} className={cn('my-4 border-divider', p.className)} />,
          code: renderCode,
          pre: (p) => (
            <pre
              {...stripNode(p)}
              className={cn(
                'my-3 overflow-x-auto rounded-lg border border-divider bg-canvas p-3 text-xs text-heading',
                p.className,
              )}
            />
          ),
          table: (p) => (
            <div className="my-3 overflow-x-auto">
              <table {...stripNode(p)} className={cn('w-full border-collapse text-xs', p.className)} />
            </div>
          ),
          thead: (p) => <thead {...stripNode(p)} className={cn('bg-surface', p.className)} />,
          th: (p) => (
            <th
              {...stripNode(p)}
              className={cn(
                'border border-divider px-2 py-1 text-left font-semibold text-heading',
                p.className,
              )}
            />
          ),
          td: (p) => (
            <td
              {...stripNode(p)}
              className={cn('border border-divider px-2 py-1 align-top', p.className)}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * react-markdown passes an internal `node` prop to every component; the DOM
 * doesn't want it. Strip it centrally so element renderers can `{...spread}`
 * without React logging "Unknown DOM prop" warnings.
 */
function stripNode<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const { node, ...rest } = props
  // Read `node` at least once so the compiler + lint see the destructure as intentional.
  void node
  return rest
}

/**
 * Custom `code` handler — inline vs fenced-block. In react-markdown v9+ the
 * `inline` boolean is gone; the discriminator is the parent (`<pre>`) or
 * the presence of a `language-*` className added by remark for fenced blocks.
 */
function renderCode({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'code'> & { node?: unknown }) {
  const { node, ...rest } = props
  void node
  const isFenced =
    Boolean(className?.startsWith('language-')) ||
    (typeof children === 'string' && children.includes('\n'))

  if (isFenced) {
    return (
      <code className={cn('font-mono', className)} {...rest}>
        {children}
      </code>
    )
  }
  return (
    <code
      className={cn(
        'rounded bg-canvas px-1 py-0.5 font-mono text-[0.85em] text-heading',
        className,
      )}
      {...rest}
    >
      {children}
    </code>
  )
}
