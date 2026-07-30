---
name: Unified production serving
description: Deployment architecture for keeping the SPA return routes and API callbacks on the same current build
---

For a multi-artifact SPA/API product, the published application must have one explicit production build that builds the frontend before the API and one server entrypoint that serves both `/api/*` and the SPA fallback. Per-artifact production metadata alone can leave the public domain serving stale frontend and API bundles.

**Why:** ToyyPay return pages and callbacks were still 404 in production while the same routes existed in the workspace and local artifact builds, because the public domains were serving older artifact builds.

**How to apply:** Keep the root deployment build/run authoritative, verify the live asset hash and callback route after every publish, and use relative frontend API URLs so return pages and callbacks share the published origin.

**Verification note:** A successful local or preview callback route does not update the published service automatically. ToyyPay can still receive a 404 from the older published build until the latest deployment is published.

**Why:** The Sandbox payment completed and returned successfully, but the live callback endpoint remained 404 while the preview endpoint was already correct.

**How to apply:** After changing production serving or payment routes, publish before testing any external callback; check both the SPA return route and the unauthenticated callback route on the production URL.

The autoscale run command must set `NODE_ENV=production` explicitly; relying on the publisher to inject it can make the API return 404 at `/` because static SPA serving and fallback are production-gated.

**Why:** The application starts successfully without the variable but does not serve the frontend in that mode, causing the publish startup probe to fail after a successful build.

**How to apply:** Keep the production run command in `.replit` as `env NODE_ENV=production node ...`, and verify `/` plus `/api/healthz` before publishing.