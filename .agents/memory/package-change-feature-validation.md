---
name: Package-change feature validation
description: Feature-gated invitation saves must account for a package change in the same request.
---

When a Buyer changes package and saves invitation data together, validate gated fields against the requested package ID when one is present; otherwise use the persisted package ID.

**Why:** The editor submits the new package and feature fields in one PATCH. Checking only the old database package rejects valid upgrades, such as Standard to Premium, with a misleading Premium-feature error.

**How to apply:** Resolve one effective package from the request before validating feature-gated fields, then persist the package change in the same update. Keep Business order-form package locks separate.