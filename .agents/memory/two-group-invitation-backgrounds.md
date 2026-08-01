---
name: Two-group invitation backgrounds
description: WeddingCard uses two separate sticky PageBackground elements — one per section — so cover and content screens have distinct images.
---

## Rule
- **Group 1** (cover screen — names, date): sticky `PageBackground` with `cardImageUrl || envelopeImageUrl`
- **Group 2** (content — parents, event details, etc.): sticky `PageBackground` with `envelopeImageUrl || cardImageUrl`
- The single shared `persistentBackgroundUrl` pattern was replaced with per-section backgrounds.

**Why:** The curtain panels (EnvelopeDoors) also show `cardImageUrl` split left/right, so Group 1 background matches the curtains for a seamless reveal. Group 2 uses the `envelopeImageUrl` (inner/envelope design) so the content section feels distinctly different.

**How to apply:** Each section in WeddingCard places its own `<PageBackground imageUrl={...} overlay />` as the first child, using `sticky top-0 z-0 -mb-[100dvh] h-[100dvh]`. The `-mb-[100dvh]` makes the background take zero layout space so content flows naturally on top.
