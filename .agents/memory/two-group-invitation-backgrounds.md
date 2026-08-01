---
name: Two-group invitation backgrounds
description: WeddingCard uses two separate sticky PageBackground elements — one per section — so cover and content screens have distinct images.
---

## Rule
- **Group 1** (cover screen — names, date): sticky `PageBackground` with `cardImageUrl || envelopeImageUrl`
- **Group 2** (content — parents, event details, etc.): sticky `PageBackground` with `envelopeImageUrl || cardImageUrl`
- The single shared `persistentBackgroundUrl` pattern was replaced with per-section backgrounds.

**Why:** The curtain panels (EnvelopeDoors) also show `cardImageUrl` split left/right, so Group 1 background matches the curtains for a seamless reveal. Group 2 uses the `envelopeImageUrl` (inner/envelope design) so the content section feels distinctly different.

**How to apply:** Each section in WeddingCard places its own `<PageBackground imageUrl={...} overlay />` as the first child, using `absolute inset-0 z-0`. The section must be `relative` (already is via sectionBase). Use `object-top` on the image so portrait designs anchor from the top edge.

**Warning:** Do NOT use `sticky top-0 -mb-[100dvh]` inside an `overflow-hidden` parent — sticky is silently disabled by overflow-hidden, causing a white gap at the top. The absolute approach is simpler and reliable.
