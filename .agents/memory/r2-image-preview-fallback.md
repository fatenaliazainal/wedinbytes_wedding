---
name: R2 image preview fallback
description: R2 object-key previews must use the shared resolver and same-origin proxy fallback.
---

R2 object keys may fail when loaded through the configured public domain because of domain, cache, or CORS conditions. All admin image previews should use the shared resolver and retry through the same-origin `/api/r2` proxy before showing a broken image.

**Why:** Direct R2 URLs were stored correctly but still rendered as broken images in several Admin preview states.

**How to apply:** Use the shared image URL resolver for saved object keys and attach the R2 proxy fallback to every `<img>` that displays a stored R2 image. Keep local blob URLs unchanged for newly selected files.