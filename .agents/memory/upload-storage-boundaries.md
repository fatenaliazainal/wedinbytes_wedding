---
name: Upload storage boundaries
description: Durable rules for image upload storage, authorization, and cleanup.
---

Uploaded design, gallery, and logo files must use R2 object keys rather than deployment-local filesystem paths. Admin-only catalog operations and buyer invitation uploads/updates must enforce authorization server-side. When a database update replaces or removes an R2-backed image, cleanup should be attempted without making storage credentials visible to the browser.

**Why:** Deployment-local files do not reliably persist, and accepting an invitation token from the client without checking ownership permits cross-account uploads or edits.

**How to apply:** Keep browser image resolution on public R2 domains or the same-origin proxy; validate allowed object prefixes in the proxy and preserve cleanup when records or image references are deleted.