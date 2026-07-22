import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@shared/lib/cn'

type MarkdownProps = HTMLAttributes<HTMLDivElement> & {
  /** Raw markdown content. */
  content: string
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
          a: (p) => (
            <a
              {...stripNode(p)}
              className={cn(
                'text-brand underline decoration-brand/40 transition-colors hover:text-brand-hover hover:decoration-brand-hover',
                p.className,
              )}
              target="_blank"
              rel="noreferrer noopener"
            />
          ),
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
 * Custom `code` handler — inline vs fenced-block. In react-markdown v9 the
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
