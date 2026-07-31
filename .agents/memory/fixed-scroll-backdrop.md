---
name: Fixed scroll backdrop
description: Long invitation content needs a viewport-height backdrop; portrait template artwork belongs to the cover, not the full content page.
---

For a long inner-scroll invitation section, render a stable viewport-height backdrop behind the content instead of using `background-size: cover` on the tall content section. Treat portrait card/envelope artwork as cover/opening assets; use the template colour for the long content backdrop unless a dedicated content-background asset exists.

**Why:** `cover` on a tall section scales from the section's total content height, causing the image to appear zoomed. Reusing a second portrait artwork behind the long content also makes the design look duplicated or visually misaligned.

**How to apply:** Preserve the existing single-section content and reveal wrappers; use a viewport-height sticky colour layer behind the content and keep the content above it with an explicit stacking order. Only add an image when it is explicitly designed as a content backdrop.