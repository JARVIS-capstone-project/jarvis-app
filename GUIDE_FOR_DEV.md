# Jarvis App — Frontend

Modular **Vite + React + TypeScript + Tailwind** single-page app, run with **Bun**.

This is a developer guide. It focuses on **how the codebase is organized** and **how the Vite dev proxy works**, so you can start contributing quickly.

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool / dev server | Vite |
| UI | React + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router (routes co-located per module) |
| Package manager / runtime | Bun |
| Lint | ESLint (flat config) |

## Quick start

```bash
bun install
cp .env.example .env        # set VITE_API_TARGET to your backend
bun run dev                 # → http://localhost:5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server + API proxy, hot reload |
| `bun run build` | Type-check, then build to `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | Type-check only (app + config) |
| `bun run lint` | ESLint |
| `bun run lint:fix` | ESLint with autofix |

---

## Architecture

### Three layers

The app is split into three layers. Inner layers never know about outer ones:

```
app/      composition root — wires providers, layout, routing. No features.
modules/  feature code — each feature is self-contained.
shared/   cross-cutting code reused by any module (UI kit, http client, utils).
```

Allowed import direction:

```
app  ──►  modules  ──►  shared
          (modules never import another module's internals —
           only its public index.ts barrel)
```

### Directory layout

```
src/
├── app/                              # Composition root (no business features)
│   ├── providers/app-providers.tsx   #   app-wide providers (Router, …)
│   ├── layout/app-layout.tsx         #   shell: nav + <Outlet/>
│   ├── router/
│   │   ├── routes.tsx                #   composes every module's routes
│   │   └── app-router.tsx            #   renders them
│   └── app.tsx
│
├── modules/                          # ← Feature modules
│   └── example/
│       ├── ui/                       #   ← UI workflow: presentational React only
│       │   ├── pages/                #       route-level screens
│       │   └── components/           #       smaller pieces
│       ├── logic/                    #   ← Code workflow: NO JSX
│       │   ├── api/                  #       server calls (via shared http client)
│       │   ├── hooks/                #       state + data hooks
│       │   └── models/               #       types
│       ├── routes.tsx                #   this module's RouteObject[]
│       └── index.ts                  #   public surface — import the module from here
│
├── shared/                           # Cross-module, reusable
│   ├── ui/                           #   design-system primitives (Button, …)
│   ├── api/http-client.ts            #   typed fetch wrapper → /api
│   ├── config/env.ts                 #   typed env access
│   └── lib/                          #   helpers (cn, …)
│
├── styles/globals.css                # Tailwind entry
└── main.tsx                          # bootstrap
```

### The core rule: UI is separated from logic

Inside every module, presentation and logic live in **separate folders**:

- **`ui/`** — React components. They render markup and call hooks. *No `fetch`, no business rules.*
- **`logic/`** — `api/`, `hooks/`, `models/`. Plain TypeScript + React hooks. *No JSX.*

The UI consumes logic through a hook and stays "dumb". From [src/modules/example/](src/modules/example/):

```
logic/api/example-api.ts     httpClient.get<Example[]>('/examples')   ← server call
logic/hooks/use-examples.ts  owns loading / error / data + reload     ← state
ui/pages/example-page.tsx    const { data, loading, error } = useExamples()   ← just renders
```

**Why:** you can change the API or state handling without touching components, test logic without rendering a DOM, and later swap the data layer (e.g. add React Query) in one place.

### Path aliases

Import by alias, never deep relative paths (`../../../shared/...`):

| Alias | Resolves to |
| --- | --- |
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@modules/*` | `src/modules/*` |
| `@shared/*` | `src/shared/*` |

```ts
import { Button } from '@shared/ui/button'
import { useExamples } from '@modules/example/logic/hooks/use-examples'
```

Defined once in [tsconfig.json](tsconfig.json); Vite resolves them natively.

### Module public surface

A module exposes only what's in its `index.ts`. Import **from the barrel**, never reach into internals:

```ts
import { exampleRoutes } from '@modules/example'          // ✅ good
import { exampleRoutes } from '@modules/example/routes'   // ❌ avoid
```

---

## How a request flows

```
component ─► useExamples() ─► example-api ─► httpClient.get('/examples')
                                                │  builds path  /api/examples
                                                ▼
                                     Vite dev server (:5173)
                                       proxy rule '/api' ─► backend
                                                ▼
                                     backend (:8080) /examples
```

The [http client](src/shared/api/http-client.ts) prefixes every call with `VITE_API_BASE_URL` (default `/api`), so all API traffic flows through the proxy.

---

## The Vite dev proxy

### Why it exists

In dev the app is served from `http://localhost:5173`, but your backend runs elsewhere (e.g. `http://localhost:8080`). A direct browser call to `:8080` is **cross-origin** → blocked by CORS, and would hardcode the backend URL into the frontend.

The proxy lets your code call a **relative** `/api/...` path (same origin as the dev server). Vite forwards it **server-side** to the real backend — no CORS, no hardcoded URLs.

### How it's configured

[vite.config.ts](vite.config.ts):

```ts
server: {
  proxy: {
    '/api': {
      target: apiTarget,                        // VITE_API_TARGET ?? http://localhost:8080
      changeOrigin: true,                       // rewrite Host header to the target
      rewrite: (p) => p.replace(/^\/api/, ''),  // /api/examples → /examples
      configure: (proxy) => { /* logs each request / response / error */ },
    },
  },
}
```

Every proxied call is logged to your terminal:

```
[proxy] → GET /api/examples  ⟶  http://localhost:8080
[proxy] ← 200 /api/examples
```

### Using it day to day

You never call the proxy directly — just use relative paths via `httpClient` (already wired). Watch the `[proxy]` lines to inspect API traffic while you work.

### Point at a different backend

Edit `.env` — no code change:

```bash
VITE_API_TARGET=https://staging.api.example.com
```

### Proxy more paths (websockets, a second service)

```ts
proxy: {
  '/api':  { target: apiTarget, changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') },
  '/ws':   { target: 'ws://localhost:8080', ws: true },             // websockets
  '/auth': { target: 'http://localhost:9000', changeOrigin: true }, // another service
}
```

### Dev vs prod ⚠️

The proxy exists **only in `vite dev`** — it is *not* in the production bundle. In production, **nginx does the same job**: it serves `dist/` and reverse-proxies `/api` to the backend (see [docker/nginx/default.conf.template](docker/nginx/default.conf.template)). Same model, different server.

---

## Adding a new feature module

Example — adding an `orders` feature. Build **logic first, UI on top**:

1. `src/modules/orders/logic/models/order.ts` — the `Order` type.
2. `src/modules/orders/logic/api/order-api.ts` — `httpClient.get<Order[]>('/orders')`.
3. `src/modules/orders/logic/hooks/use-orders.ts` — loading/error/data hook.
4. `src/modules/orders/ui/pages/orders-page.tsx` — screen that calls the hook.
5. `src/modules/orders/routes.tsx`:
   ```tsx
   export const orderRoutes: RouteObject[] = [{ path: 'orders', element: <OrdersPage /> }]
   ```
6. `src/modules/orders/index.ts` — `export { orderRoutes } from '@modules/orders/routes'`.
7. Register it in [src/app/router/routes.tsx](src/app/router/routes.tsx):
   ```ts
   import { orderRoutes } from '@modules/orders'
   // children: [...homeRoutes, ...exampleRoutes, ...orderRoutes]
   ```

Use [src/modules/example/](src/modules/example/) as the reference implementation.

---

## Environment variables

| Variable | Read by | Purpose |
| --- | --- | --- |
| `VITE_API_TARGET` | dev server (proxy) + nginx | backend the proxy forwards to |
| `VITE_API_BASE_URL` | client code | path prefix for API calls (`/api`) |

⚠️ **Any `VITE_`-prefixed variable is compiled into the public bundle** — never put secrets (DB / API passwords, tokens) in them. Real secrets live on the **backend**; the frontend reaches them through `/api/...`. Template: [.env.example](.env.example).

---

## Build & deploy

`bun run build` produces static files in `dist/`. The repo ships a multi-stage [Dockerfile](Dockerfile) (Bun build → nginx) plus GitHub Actions CI/CD. Run the container locally with [docker-compose.yml](docker-compose.yml): `docker compose up --build`.
