import { useState } from 'react'
import { PropControls } from '@modules/design/ui/components/prop-controls'
import type { ComponentDemo, PropBag } from '@modules/design/ui/data/component-registry'

/** Builds a JSX usage snippet from the current props (drops false flags + empty text). */
function toSnippet(demo: ComponentDemo, props: PropBag): string {
  const attrs = Object.entries(props)
    .filter(([k]) => k !== demo.childrenProp) // rendered as inner text, not an attribute
    .map(([k, v]) => (typeof v === 'boolean' ? (v ? k : null) : v === '' ? null : `${k}="${v}"`))
    .filter(Boolean)
    .join(' ')
  const inner = demo.childrenProp ? String(props[demo.childrenProp] ?? '') : (demo.children ?? '')
  const open = `<${demo.name}${attrs ? ` ${attrs}` : ''}`
  return inner ? `${open}>${inner}</${demo.name}>` : `${open} />`
}

/** One component in the gallery: live preview, prop editors and a copyable snippet. */
export function ComponentCard({ demo }: { demo: ComponentDemo }) {
  const [values, setValues] = useState<PropBag>(demo.defaultProps)
  const update = (prop: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [prop]: value }))

  return (
    <section className="overflow-hidden rounded-2xl border border-divider bg-panel">
      <header className="border-b border-divider px-6 py-4">
        <h2 className="font-display text-xl text-heading">{demo.name}</h2>
        <p className="mt-1 text-sm text-muted">{demo.description}</p>
      </header>

      {/* Live preview */}
      <div className="flex min-h-[120px] items-center justify-center bg-canvas px-6 py-10">
        {demo.render(values)}
      </div>

      {/* Controls + snippet */}
      <div className="space-y-4 px-6 py-5">
        <PropControls controls={demo.controls} values={values} onChange={update} />
        <pre className="overflow-x-auto rounded-lg border border-divider bg-surface px-4 py-3 font-mono text-xs text-body">
          {toSnippet(demo, values)}
        </pre>
      </div>
    </section>
  )
}
