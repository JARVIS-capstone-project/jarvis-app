import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET ?? 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    // Resolve @/*, @app/*, @modules/*, @shared/* from tsconfig (native in Vite 8+).
    resolve: { tsconfigPaths: true },
    server: {
      port: 5173,
      // Dev proxy: forwards every /api/* call to the backend and logs it,
      // so you can inspect each request/response in the terminal. The BE
      // controllers are mounted at /api/* (see @RequestMapping in the Spring
      // AuthController), so the path is forwarded verbatim — no rewrite.
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
      },
    },
  }
})
