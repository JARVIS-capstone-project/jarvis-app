# jarvis-app

Frontend for **J.A.R.V.I.S** — Just Actionable Real-Time Visibility Intelligent System, an agentic incident-triage assistant built with HCLTech.

**Stack**: React 19 · TypeScript · Vite · Tailwind · Zustand · React Router
**Runtime**: Bun
**Hosting**: Vercel — production at [jarvis-app-five-weld.vercel.app](https://jarvis-app-five-weld.vercel.app)

## Local development

```bash
bun install
bun run dev
```

App runs at http://localhost:5173.

The Vite dev server proxies `/api/*` → platform (`localhost:8080`) and `/agent/*` → agent-system (`localhost:8000`). Override via `VITE_API_TARGET` / `VITE_AGENT_TARGET` in `.env`.

## Production configuration

- `/api/*` is proxied server-side by Vercel to the platform backend (see [vercel.json](vercel.json))
- `/agent/*` calls the agent-system directly via absolute URL — set `VITE_AGENT_BASE_URL` in Vercel env (no `/agent` suffix, no trailing slash)
- SSE streams (`/agent/*/stream`) bypass Vercel entirely to avoid edge-proxy timeout risk

See [/deploy-fe-vercel-sse.md](../deploy-fe-vercel-sse.md) and [/vercel.md](../vercel.md) in the monorepo root for the split-origin deploy design.
