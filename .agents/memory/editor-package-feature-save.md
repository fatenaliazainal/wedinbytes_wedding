---
name: Editor package feature save
description: Editor saves must not send gated feature fields when the active package does not include those features.
---

The invitation editor must conditionally include package-gated fields in save payloads. In particular, Standard invitations must not send Money Gift fields, because the API rejects the whole save when that feature is unavailable.

**Why:** A save of unrelated invitation content can fail if the editor serializes hidden or unavailable feature state into the request.

**How to apply:** Build save payloads from the active package feature set; preserve gated fields for packages that support them and for admin/demo editing.