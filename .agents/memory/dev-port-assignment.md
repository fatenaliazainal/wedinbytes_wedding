---
name: Dev port assignment
description: Vite runs on port 8080, API server on port 24366 in dev. This is intentional and must not be reversed.
---

## Rule
- **Vite (wedding-invite dev server)**: port **8080**
- **API server**: port **24366**

This is the opposite of what you might expect. It was changed deliberately.

## Why
Replit's artifact proxy routes requests based on `localPort` in each `artifact.toml`. The old routing (before any workspace restart) had `/api/*` and `/invite/*` both pointing to the old API server port (8080). Moving Vite to port 8080 means:
- `/invite/*` requests from the old cached routing hit Vite directly — no proxy chain needed
- The `@vitejs/plugin-react preamble` error and CSP cache issues that plagued a proxy-chain approach are eliminated

## How to apply
- `artifacts/api-server/.replit-artifact/artifact.toml`: `localPort = 24366`, production `PORT = "24366"`
- `artifacts/wedding-invite/.replit-artifact/artifact.toml`: `localPort = 8080`, `[services.env] PORT = "8080"`
- `artifacts/wedding-invite/vite.config.ts`: `/api` proxy target = `http://localhost:24366`
- API server `app.ts` dev catch-all: proxies non-API requests to Vite at port 8080 (for `/*` routing case)

## Production impact
Production API server now runs on port 24366 (updated in `[services.production.run.env]`). Health check at `/api/healthz` routes correctly via `paths = ["/api"]` → port 24366.
