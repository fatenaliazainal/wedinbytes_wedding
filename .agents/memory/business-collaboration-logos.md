---
name: Business collaboration logos
description: Storage and display rule for public Business Account collaboration logos.
---

Business Account collaboration logos are uploaded as transparent PNGs and displayed publicly through the app's same-origin R2 image proxy. Any new storage prefix used for these logos must be added to the proxy allow-list at the same time.

**Why:** A valid logo upload initially succeeded but browser display failed because the new `business-logos/` prefix was not included in the existing proxy allow-list.

**How to apply:** When adding or changing public business media, keep the upload prefix, public response field, frontend URL resolver, and R2 proxy allow-list in sync; verify the proxy returns the image, not only that the upload returns success.

The homepage collaboration strip is logo-only: businesses with a logo appear in a two-at-a-time auto-advancing carousel, and each logo links directly to the business's single configured homepage link.

**Why:** The homepage should showcase the network while sending visitors directly to one destination chosen by the business instead of an intermediate profile page or ambiguous social-link priority.

**How to apply:** Filter out businesses without `logoUrl`, use the configured website field as the single homepage link, normalize bare domains with `https://`, and leave tiles without a link non-clickable. Legacy social columns remain for data compatibility but are not used by the homepage.

Public customer form headers also show the business logo when one has been uploaded; forms without a logo keep the normal header without an empty placeholder.

**Why:** Customers should immediately recognize which business sent the form, while businesses that have not uploaded branding should not get unnecessary blank space.

**How to apply:** Include the safe public `logoUrl` in the form-share response and render it through the same-origin R2 resolver only when present.

External collaborator feeds expose only the Business Account display name, a browser-ready absolute logo URL, and the single configured business website link. Cross-origin browser access is restricted to the dedicated feed and approved consumer domains.

**Why:** External brand sites need reusable collaborator data without receiving full public profiles or gaining CORS access to unrelated APIs.

**How to apply:** Keep the feed public and read-only, include active profiles with logos, normalize website links to HTTP(S), and scope CORS by endpoint rather than globally.