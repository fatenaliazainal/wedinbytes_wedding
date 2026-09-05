---
name: Package-change feature validation
description: Feature-gated invitation saves must account for a package change in the same request.
---

When a Buyer changes package and saves invitation data together, validate gated fields against the requested package ID when one is present; otherwise use the persisted package ID.

**Why:** The editor submits the new package and feature fields in one PATCH. Checking only the old database package rejects valid upgrades, such as Standard to Premium, with a misleading Premium-feature error.

**How to apply:** Resolve one effective package from the request before validating feature-gated fields, then persist the package change in the same update. Keep Business order-form package locks separate.

For an unpaid Buyer invitation, downgrading from a package with Dress Code to one without it must permanently clear all current and legacy Dress Code values on that invitation. Paid invitations and Business order-form invitations remain package-locked and must not be changed by this cleanup.

**Why:** The owner explicitly chose permanent cleanup on downgrade so stale Premium content cannot reappear later through legacy fallback fields.

**How to apply:** Perform the cleanup atomically with the allowed package change and scope it only to the invitation being downgraded; never bulk-update existing orders.