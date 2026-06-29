// Color catalog data — mirrors the Tailwind tokens in src/styles/globals.css.
// Each swatch `name` IS the token (use as bg-<name> / text-<name> / border-<name>).
// `token` shows the resolved value for the mode; values swap between light & dark.

export type Swatch = {
  name: string
  token: string
  value: string
  usage: string
}

export type Section = { title: string; cols: 3 | 4; swatches: Swatch[] }

export const lightSections: Section[] = [
  {
    title: 'Surfaces',
    cols: 4,
    swatches: [
      { name: 'canvas', token: '#FAF6F2', value: '#faf6f2', usage: 'App background — outermost layer' },
      { name: 'surface', token: '#EDE5DC', value: '#ede5dc', usage: 'Sidebar, input bar, card surfaces' },
      { name: 'panel', token: '#FFFFFF', value: '#ffffff', usage: 'Chat panel — brightest surface' },
      { name: 'elevated', token: '#FFFFFF', value: '#ffffff', usage: 'Elevated cards, badges, popovers' },
    ],
  },
  {
    title: 'Text',
    cols: 4,
    swatches: [
      { name: 'heading', token: '#1C1410', value: '#1c1410', usage: 'Primary headings, logo text' },
      { name: 'body', token: '#4A3728', value: '#4a3728', usage: 'Body text, nav labels, sub-headings' },
      { name: 'brown', token: '#785032', value: '#785032', usage: 'Base brown — source of alpha lines' },
      { name: 'muted', token: '#A08B7D', value: '#a08b7d', usage: 'Section labels, placeholders, muted icons' },
      { name: 'subtle', token: '#A08B7D', value: '#a08b7d', usage: 'Very muted text, inactive states' },
    ],
  },
  {
    title: 'Lines & states',
    cols: 4,
    swatches: [
      { name: 'divider-strong', token: 'rgba(120,80,50,0.25)', value: 'rgba(120,80,50,0.25)', usage: 'Dashed folder borders, strong dividers' },
      { name: 'divider', token: 'rgba(120,80,50,0.15)', value: 'rgba(120,80,50,0.15)', usage: 'Hairline dividers between sections' },
      { name: 'divider-faint', token: 'rgba(120,80,50,0.08)', value: 'rgba(120,80,50,0.08)', usage: 'Faintest hairline' },
      { name: 'hover', token: 'rgba(120,80,50,0.08)', value: 'rgba(120,80,50,0.08)', usage: 'Idle button bg, subtle hover' },
    ],
  },
  {
    title: 'Brand',
    cols: 3,
    swatches: [
      { name: 'brand', token: '#FE6128', value: '#fe6128', usage: 'Primary CTA, active nav button, send' },
      { name: 'brand-hover', token: '#FE6128', value: '#fe6128', usage: 'Hover state (lighter on dark)' },
      { name: 'brand-active', token: '#FE6128', value: '#fe6128', usage: 'Active button fill' },
    ],
  },
  {
    title: 'Brand glow',
    cols: 3,
    swatches: [
      { name: 'brand-shadow', token: 'rgba(254,97,40,0.35)', value: 'rgba(254,97,40,0.35)', usage: 'Send button drop-shadow' },
      { name: 'brand-glow-strong', token: 'rgba(254,97,40,0.18)', value: 'rgba(254,97,40,0.18)', usage: 'Ambient bottom glow on panel' },
      { name: 'brand-glow-soft', token: 'rgba(254,97,40,0.10)', value: 'rgba(254,97,40,0.10)', usage: 'Ambient top glow on panel' },
    ],
  },
]

export const darkSections: Section[] = [
  {
    title: 'Surfaces',
    cols: 4,
    swatches: [
      { name: 'canvas', token: '#0F0C0A', value: '#0f0c0a', usage: 'App background — outermost layer' },
      { name: 'surface', token: '#1C1510', value: '#1c1510', usage: 'Sidebar, input bar, card surfaces' },
      { name: 'panel', token: '#241C16', value: '#241c16', usage: 'Chat panel, folders, popovers' },
      { name: 'elevated', token: '#2E2319', value: '#2e2319', usage: 'Elevated cards, badges, popovers' },
    ],
  },
  {
    title: 'Text',
    cols: 4,
    swatches: [
      { name: 'heading', token: '#FAF6F2', value: '#faf6f2', usage: 'Primary headings, logo text' },
      { name: 'body', token: '#EDE5DC', value: '#ede5dc', usage: 'Body text, nav labels' },
      { name: 'brown', token: '#785032', value: '#785032', usage: 'Base brown — source of alpha lines' },
      { name: 'muted', token: '#C9B8A8', value: '#c9b8a8', usage: 'Section headers, placeholders, muted icons' },
      { name: 'subtle', token: '#A08B7D', value: '#a08b7d', usage: 'Very muted text, inactive states' },
    ],
  },
  {
    title: 'Lines & states',
    cols: 4,
    swatches: [
      { name: 'divider-strong', token: 'rgba(245,237,228,0.12)', value: 'rgba(245,237,228,0.12)', usage: 'Strong dividers, section borders' },
      { name: 'divider', token: 'rgba(245,237,228,0.12)', value: 'rgba(245,237,228,0.12)', usage: 'Hairline dividers between sections' },
      { name: 'divider-faint', token: 'rgba(245,237,228,0.04)', value: 'rgba(245,237,228,0.04)', usage: 'Brown lines tinted warm' },
      { name: 'hover', token: 'rgba(245,237,228,0.07)', value: 'rgba(245,237,228,0.07)', usage: 'Subtle hover backgrounds' },
    ],
  },
  {
    title: 'Brand',
    cols: 3,
    swatches: [
      { name: 'brand', token: '#FE6128', value: '#fe6128', usage: 'Primary CTA, active nav button, send' },
      { name: 'brand-hover', token: '#FF8A5C', value: '#ff8a5c', usage: 'Hover state lighter orange' },
      { name: 'brand-active', token: 'rgba(254,97,40,0.30)', value: 'rgba(254,97,40,0.30)', usage: 'Active button bg on dark' },
    ],
  },
  {
    title: 'Brand glow',
    cols: 3,
    swatches: [
      { name: 'brand-shadow', token: 'rgba(254,97,40,0.30)', value: 'rgba(254,97,40,0.30)', usage: 'Send button drop-shadow' },
      { name: 'brand-glow-strong', token: 'rgba(254,97,40,0.15)', value: 'rgba(254,97,40,0.15)', usage: 'Ambient panel gradients' },
      { name: 'brand-glow-soft', token: 'rgba(254,97,40,0.08)', value: 'rgba(254,97,40,0.08)', usage: 'Very subtle orange-tinted surface' },
    ],
  },
]

export const LIGHT = {
  bg: '#faf6f2',
  panel: '#ffffff',
  heading: '#1c1410',
  body: '#785032',
  muted: '#a08b7d',
  accent: '#fe6128',
  divider: 'rgba(120,80,50,0.15)',
  border: 'rgba(120,80,50,0.12)',
  tableHeadBg: '#ede5dc',
}

export const DARK = {
  bg: '#0f0c0a',
  panel: '#1c1510',
  heading: '#faf6f2',
  body: '#c9b8a8',
  muted: '#a08b7d',
  accent: '#fe6128',
  divider: 'rgba(245,237,228,0.07)',
  border: 'rgba(245,237,228,0.07)',
  tableHeadBg: '#241c16',
}

export type Theme = typeof LIGHT

export const inter = { fontFamily: "'Inter', sans-serif" }
export const interSemi = { fontFamily: "'Inter', sans-serif", fontWeight: 600 }
export const instrument = { fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700 }
export const menlo = { fontFamily: "'Menlo', monospace" }

export const heroBlocksLight = ['#faf6f2', '#ede5dc', '#ffffff', '#1c1410', '#4a3728', '#785032', '#a08b7d', '#fe6128']
export const heroBlocksDark = ['#0f0c0a', '#1c1510', '#241c16', '#2e2319', '#a08b7d', '#c9b8a8', '#ede5dc', '#faf6f2', '#fe6128']
