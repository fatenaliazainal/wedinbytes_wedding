---
name: Fixed scroll backdrop
description: Long invitation content needs a separate viewport-height sticky image layer so its backdrop does not scale with content height.
---

For a long inner-scroll invitation section, render the background as a viewport-height sticky layer behind the content instead of using `background-size: cover` on the tall content section.

**Why:** `cover` on a tall section scales from the section's total content height, causing the image to appear zoomed; a sticky viewport layer keeps its visual scale stable while reveal content scrolls over it.

**How to apply:** Preserve the existing single-section content and reveal wrappers; change only the background layer and keep the content above it with an explicit stacking order.