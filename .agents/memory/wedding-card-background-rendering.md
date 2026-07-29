---
name: Wedding card background rendering
description: Keep invitation backgrounds consistent across the cover and long details page.
---

The cover background uses a viewport-sized absolute image with `object-fit: cover`. A long details section must not use `background-size: cover` on the whole content height, because cover recalculates scale from that height and makes the image appear zoomed after scrolling. Keep the details background in a viewport-height sticky renderer using the same image approach as the cover.

**Why:** A long Page 2 section caused CSS `background-size: cover` to scale against its content height, unlike the fixed-height Page 1 viewport.

**How to apply:** When changing WeddingCard backgrounds, compare the actual image renderer and scroll-container geometry; preserve a viewport-height renderer and avoid page-height background sizing.