---
name: R2 image URL resolution
description: Browser-safe handling for Cloudflare R2 object keys in the wedding invitation app
---

All browser-facing consumers of an R2 object key must use the shared image resolver. When no public R2 domain is configured, the resolver must target the same-origin `/api/r2` proxy; ad hoc concatenation with an empty public-domain value produces invalid root-relative URLs.

**Why:** Admin picker previews and thumbnails can silently break even when the R2 object and proxy are healthy if one consumer builds its URL differently. A fallback handler also prevents a failed secondary image from leaving a broken-image icon.

**How to apply:** Use the shared resolver for card designs, envelope artwork, gallery images, thumbnails, and logo images. Keep DB values as R2 keys and do not replace them with local asset paths.