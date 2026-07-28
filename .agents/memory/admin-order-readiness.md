---
name: Admin order readiness
description: Back Office order management is prepared before payment integration exists.
---

Order and payment records should be additive and remain empty until a real payment flow creates them; invitation website status should derive from purchase state plus an explicit admin disable/reactivate status.

**Why:** The editor and customer flow already work, while payment integration is intentionally deferred. Fake orders or a second customer/invitation model would make later integration unsafe.

**How to apply:** Connect future payment callbacks to the existing order table, user, package, and invitation relationships; preserve the admin-only read and website status controls.