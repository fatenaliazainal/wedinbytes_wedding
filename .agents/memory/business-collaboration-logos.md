---
name: Business collaboration logos
description: Storage and display rule for public Business Account collaboration logos.
---

Business Account collaboration logos are uploaded as transparent PNGs and displayed publicly through the app's same-origin R2 image proxy. Any new storage prefix used for these logos must be added to the proxy allow-list at the same time.

**Why:** A valid logo upload initially succeeded but browser display failed because the new `business-logos/` prefix was not included in the existing proxy allow-list.

**How to apply:** When adding or changing public business media, keep the upload prefix, public response field, frontend URL resolver, and R2 proxy allow-list in sync; verify the proxy returns the image, not only that the upload returns success.