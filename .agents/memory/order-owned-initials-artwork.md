---
name: Buyer-owned initials artwork
description: Optional initials artwork belongs to the buyer invitation and must not be stored on shared card designs.
---

The initials artwork upload is optional and is stored in R2 under an invitation-specific prefix, with the R2 key recorded on that invitation. Buyers can upload before creating an order; the upload is limited to a transparent PNG under 2 MB.

**Why:** Buyers need to customize artwork while editing, before checkout/order creation. Storing it on the invitation keeps it isolated from shared card designs while allowing it to survive reloads.

**How to apply:** Require an existing owned invitation but not an order; accept only PNG files with an alpha channel and a 2 MB limit, then render the invitation's key through the same-origin R2 proxy.