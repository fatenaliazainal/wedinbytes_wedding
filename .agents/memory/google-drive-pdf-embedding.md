---
name: Public PDF embedding
description: Reliable delivery pattern for the public How To Use PDF.
---

Do not embed Google Drive’s `/preview` viewer directly in the website. For a fixed public guide, ship the approved PDF as a same-origin static asset and embed that file directly. Production CSP must allow same-origin frames with `frame-src 'self'`.

**Why:** Google’s HTML preview viewer can fail inside an iframe, leaving a broken or blank panel even when the Drive link itself is public and opens correctly in a new tab. Production can also block a valid same-origin PDF iframe if CSP's `frame-src` omits `'self'`. A static asset has no third-party viewer or per-visit server fetch, and browsers/CDNs can cache it.

**How to apply:** Keep the file small and version it by filename when its content changes. Point both the embedded viewer and “Open in new tab” fallback at the same static URL, and keep `frame-src 'self'` while that embed is supported.