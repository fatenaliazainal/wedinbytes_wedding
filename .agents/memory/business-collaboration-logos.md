---
name: Business collaboration logos
description: Storage and display rule for public Business Account collaboration logos.
---

Business Account collaboration logos are uploaded as transparent PNGs and displayed publicly through the app's same-origin R2 image proxy. Any new storage prefix used for these logos must be added to the proxy allow-list at the same time.

**Why:** A valid logo upload initially succeeded but browser display failed because the new `business-logos/` prefix was not included in the existing proxy allow-list.

**How to apply:** When adding or changing public business media, keep the upload prefix, public response field, frontend URL resolver, and R2 proxy allow-list in sync; verify the proxy returns the image, not only that the upload returns success.

The homepage collaboration strip is logo-only: businesses with a logo appear in a two-at-a-time auto-advancing carousel, and each logo links directly to the first configured external social or website URL.

**Why:** The homepage should showcase the network while sending visitors directly to the business's own social presence instead of an intermediate profile page.

**How to apply:** Filter out businesses without `logoUrl`, prefer Instagram then Facebook, TikTok, and website, normalize bare domains with `https://`, and leave tiles without an external URL non-clickable.

Public customer form headers also show the business logo when one has been uploaded; forms without a logo keep the normal header without an empty placeholder.

**Why:** Customers should immediately recognize which business sent the form, while businesses that have not uploaded branding should not get unnecessary blank space.

**How to apply:** Include the safe public `logoUrl` in the form-share response and render it through the same-origin R2 resolver only when present.