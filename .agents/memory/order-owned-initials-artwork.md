---
name: Order-owned initials artwork
description: Optional uploaded initials artwork belongs to the linked order and must not be stored on shared card designs.
---

The initials artwork upload is optional and is stored in R2 under an order-specific prefix, with the R2 key recorded on that order. The invitation response may expose the latest linked order's artwork only for rendering.

**Why:** Buyers can reuse the same design across multiple invitations/orders, so storing the asset on `card_design` or as a global template override would leak one buyer's artwork into another card.

**How to apply:** Require an existing owned invitation and linked order before accepting the upload; use a transparent-background note in the UI, and render no seal/initial artwork when the optional upload is absent.