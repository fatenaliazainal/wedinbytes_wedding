---
name: Unified production serving
description: Deployment architecture for keeping the SPA return routes and API callbacks on the same current build
---

For a multi-artifact SPA/API product, the published application must have one explicit production build that builds the frontend before the API and one server entrypoint that serves both `/api/*` and the SPA fallback. Per-artifact production metadata alone can leave the public domain serving stale frontend and API bundles.

**Why:** ToyyPay return pages and callbacks were still 404 in production while the same routes existed in the workspace and local artifact builds, because the public domains were serving older artifact builds.

**How to apply:** Keep the root deployment build/run authoritative, verify the live asset hash and callback route after every publish, and use relative frontend API URLs so return pages and callbacks share the published origin.