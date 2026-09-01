import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev proxy targets are constants — VITE_PLATFORM_BASE_URL / VITE_AGENT_BASE_URL
// on the FE side stay relative (`/api`, `/agent`) so browser calls are same-origin
// and Vite forwards them here. If a dev needs a non-default port, edit these two lines.
const PLATFORM_DEV_TARGET = 'http://localhost:8080'
const AGENT_DEV_TARGET = 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig(() => {
  const apiTarget = PLATFORM_DEV_TARGET
  const agentTarget = AGENT_DEV_TARGET

  return {
    plugins: [react(), tailwindcss()],
    // Resolve @/*, @app/*, @modules/*, @shared/* from tsconfig (native in Vite 8+).
    resolve: { tsconfigPaths: true },
    build: {
      // Raised from the 500 kB default, which measures every chunk the same
      // way and so cannot tell an eager bundle from a deferred one. Two
      // chunks sit above it on purpose: the entry (~314 kB gzipped, ordinary
      // for React + markdown + pdf.js) and `reactor-model` (three.js, split
      // out and only fetched by the landing hero). Kept well under the sum of
      // the two so a genuinely runaway chunk still trips the warning.
      chunkSizeWarningLimit: 1200,
    },
    server: {
      port: 5173,
      // Dev proxies:
      //   /api/*   → platform-system (Java, 8080) — auth, KB, workspace
      //   /health  → platform-system (Java, 8080) — root-path liveness probe;
      //             platform serves /health at ROOT (not /api/health), so
      //             this is a dedicated one-path proxy. In prod the same-
      //             origin GCP LB routes /health to platform too.
      //   /agent/* → agent-system    (Python, 8000) — sessions, triage, SSE
      // Agent-system mounts routers at `/sessions` (no `/agent` prefix), so
      // `rewrite` strips the prefix before forwarding.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log(`[proxy] → ${req.method} ${req.url}  ⟶  ${apiTarget}`)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[proxy] ← ${proxyRes.statusCode} ${req.url}`)
            })
            proxy.on('error', (err, req) => {
              console.log(`[proxy] ✗ ${req.url}: ${err.message}`)
            })
          },
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/agent': {
          target: agentTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/agent/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log(`[agent-proxy] → ${req.method} ${req.url}  ⟶  ${agentTarget}`)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[agent-proxy] ← ${proxyRes.statusCode} ${req.url}`)
            })
            proxy.on('error', (err, req) => {
              console.log(`[agent-proxy] ✗ ${req.url}: ${err.message}`)
            })
          },
        },
      },
    },
  }
})
