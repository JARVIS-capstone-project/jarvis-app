import { useTheme } from '@app/providers/theme-context'
import { ColorPalette } from '@modules/design/ui/components/color-palette'

/**
 * Public `design/color` page — a full-bleed palette catalog for devs to browse
 * and copy theme values. Follows the global theme so the toggle stays in sync
 * with every other page and persists across navigation.
 */
export function ColorPalettePage() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="fixed right-6 top-6 z-10 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors"
        style={{
          background: isDark ? '#2e2319' : '#ffffff',
          color: isDark ? '#faf6f2' : '#1c1410',
          border: `1px solid ${isDark ? 'rgba(245,237,228,0.12)' : 'rgba(120,80,50,0.15)'}`,
        }}
      >
        {isDark ? '☀ Light' : '☾ Dark'}
      </button>
      <ColorPalette mode={theme} />
    </div>
  )
}
