import type { Swatch, Theme } from '@modules/design/ui/data/color-tokens'
import { inter, interSemi, menlo } from '@modules/design/ui/data/color-tokens'

type Props = { tokens: Swatch[]; t: Theme }

const slug = (name: string) => name.toLowerCase().replace(/ /g, '-').replace(/\//g, '')

/** Flat reference table listing every swatch with its token name and usage. */
export function TokensTable({ tokens, t }: Props) {
  return (
    <div
      className="overflow-hidden"
      style={{ border: `1px solid ${t.border}`, borderRadius: 16, background: t.panel }}
    >
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: t.tableHeadBg }}>
            {['Swatch', 'Token', 'Value', 'Usage'].map((h) => (
              <th
                key={h}
                style={{
                  ...interSemi,
                  color: t.muted,
                  fontSize: 11,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  padding: '12px 16px',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((s, i) => (
            <tr key={s.name + i} style={{ borderTop: `1px solid ${t.divider}` }}>
              <td style={{ padding: '10px 16px' }}>
                <div
                  style={{
                    width: 40,
                    height: 20,
                    borderRadius: 6,
                    background: s.value,
                    border: `1px solid ${t.border}`,
                  }}
                />
              </td>
              <td style={{ ...menlo, color: t.heading, fontSize: 12, padding: '10px 16px' }}>
                {slug(s.name)}
              </td>
              <td style={{ ...menlo, color: t.muted, fontSize: 12, padding: '10px 16px' }}>
                {s.token}
              </td>
              <td style={{ ...inter, color: t.body, fontSize: 12, padding: '10px 16px' }}>
                {s.usage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
