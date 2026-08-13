import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Route tables pair a data export (the route array) with the lazy component
  // references it points at, which is exactly the shape this rule flags. They
  // are never a fast-refresh boundary — editing one remounts the router
  // regardless — so the warning has nothing to protect here.
  {
    files: ['**/routes.tsx', '**/router/routes.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // Config files run in Node, not the browser.
  {
    files: ['vite.config.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
)
