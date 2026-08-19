---
name: Google Drive PDF embedding
description: Reliable delivery pattern for the public How To Use tutorial PDF.
---

Do not embed Google Drive’s `/preview` viewer directly in the website. Serve the known public Google Drive PDF through a cached same-origin API response with `Content-Type: application/pdf`, then embed that local API URL.

**Why:** Google’s HTML preview viewer can fail inside an iframe, leaving a broken or blank panel even when the Drive link itself is public and opens correctly in a new tab.

**How to apply:** Use the fixed-file proxy only for an allow-listed Drive file, cap its size, cache the binary response, and retain the original Drive `/view` link as an “Open in new tab” fallback.