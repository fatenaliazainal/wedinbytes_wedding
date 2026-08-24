---
name: R2 image viewing
description: Durable browser delivery rule for uploaded R2 images.
---

R2 object keys used by the invitation app should be rendered through the same-origin API image proxy by default. A configured public R2 domain can be unavailable, private, stale, or blocked by bucket CORS even when the object upload succeeded.

**Why:** A newly uploaded card design was present in R2 and downloadable by the API, but browser rendering failed when the frontend selected the public-domain path.

**How to apply:** Keep local `/...` paths and absolute URLs unchanged for legacy/external assets; resolve bare R2 keys to `/api/r2?key=...`, and verify the proxy returns the image before debugging upload/database persistence.

For decorative design assets, also provide a bundled local fallback and handle image-load errors in the shared image component. A missing R2 object should degrade to the fallback rather than leave a broken preview.

Every new R2 asset family must be explicitly permitted by the same-origin proxy's key-prefix validation. A successful upload alone does not prove browser/email delivery: confirm a proxy request for that prefix reaches storage (rather than failing validation) before treating an asset feature as complete.
