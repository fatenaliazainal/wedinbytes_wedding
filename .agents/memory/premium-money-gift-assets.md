---
name: Premium money gift assets
description: Durable ownership and access rules for the invitation money-gift section
---

The money-gift section is gated by the exact `Money Gift` pricing feature on the invitation's package. Its QR artwork belongs to the invitation, not to a shared card design or business profile, and is stored under an invitation-scoped `gift-qr` prefix.

**Why:** Gift details and QR codes are customer-specific payment information; sharing them through catalogue assets or allowing non-Premium API writes could expose the wrong account or bypass package entitlements.

**How to apply:** Keep public Gift UI conditional on the invitation's display toggle, validate the package feature on every Gift mutation/upload, cap QR arrays at two, and resolve stored R2 keys through the same-origin `/api/r2` proxy.