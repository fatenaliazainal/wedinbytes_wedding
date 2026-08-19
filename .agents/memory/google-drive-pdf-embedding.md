---
name: Public PDF embedding
description: Reliable delivery pattern for the public How To Use guide (PDF → pre-rendered page images).
---

Do not embed PDFs in an `<iframe>` on the public website at all — neither Google Drive's `/preview` viewer nor a same-origin PDF file. Pre-render the approved PDF to one JPEG per page (pdftoppm, ~1100px wide, quality ~78) into a versioned static folder and display the pages as plain `<img>` tags. Keep the original PDF as a static asset only for an "Open PDF" download link.

**Why:** Google's HTML preview viewer can fail inside an iframe. A same-origin PDF iframe is also fragile: production CSP `frame-src` must include `'self'`, iOS Safari renders only the first page or nothing, and users reported a grey blocked panel even after the file was local. Plain images have no viewer, no CSP frame dependency, and lazy-load per page.

**How to apply:** Regenerate the images and bump the folder version (v1 → v2) whenever the guide changes; versioned paths get one-year immutable cache headers in production. Eager-load the first couple of pages, lazy-load the rest, and set width/height to avoid layout shift.
