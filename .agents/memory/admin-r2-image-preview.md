---
name: Admin R2 image preview
description: How ImageUploadField in AdminPage must handle R2 object keys for its preview img src.
---

# Admin R2 image preview

`ImageUploadField` in `AdminPage.tsx` receives a `value` prop that is a raw R2 object key (e.g. `wed_card_design/WIB98-card.png`). This key cannot be used directly as `<img src>` — it must be routed through the same-origin proxy.

**Fix:**
```ts
const displayUrl = previewUrl || localPreviewUrl || resolveImageUrl(value) || "";
```

- `previewUrl` — already a resolved URL (passed in by caller, e.g. `resolveImageUrl(d.thumbnailImageUrl)`)
- `localPreviewUrl` — a `blob:` URL created from a freshly selected file; must NOT go through `resolveImageUrl` (blob: doesn't match http/https//)
- `value` — raw R2 key; must go through `resolveImageUrl`

**Why:**
`resolveImageUrl` returns the value unchanged for `http://`, `https://`, and `/`-prefixed paths. Raw R2 keys match none of these, so they get wrapped as `/api/r2?key=...`. Blob URLs start with `blob:https://...` — they don't match `https://` as a prefix check, so they would incorrectly get proxied if passed through `resolveImageUrl`. Keep them separate in the OR chain.
