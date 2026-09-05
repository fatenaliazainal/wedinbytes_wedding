---
name: Admin order readiness
description: Back Office order management is prepared before payment integration exists.
---

Order and payment records should be additive and remain empty until a real payment flow creates them; invitation website status should derive from purchase state plus an explicit admin disable/reactivate status.

**Why:** The editor and customer flow already work, while payment integration is intentionally deferred. Fake orders or a second customer/invitation model would make later integration unsafe.

**How to apply:** Connect future payment callbacks to the existing order table, user, package, and invitation relationships; preserve the admin-only read and website status controls.

The Admin PENDING website view includes every Buyer-owned invitation that has not been paid: drafts with no order and invitations whose latest payment attempt is pending, failed, or expired. Exclude a website if either its invitation purchase flag is set or any linked order is PAID.

**Why:** The owner uses PENDING as an operational list of all unfinished Buyer websites, while paid customers must never be contacted as unpaid even when legacy payment flags disagree.

**How to apply:** Keep the view read-only, one row per invitation, and derive paid exclusion from both invitation and order records without changing either.