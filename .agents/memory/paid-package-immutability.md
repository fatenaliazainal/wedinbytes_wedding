---
name: Paid package immutability
description: The package attached to a paid invitation must remain fixed after payment.
---

Once payment is verified, the invitation's purchased package is immutable for customers. The invitation content and design can remain editable, but package changes must be rejected both in the editor and at the API boundary. A previously purchased package should remain visible as a locked choice even if it is later removed from the active public pricing list.

**Why:** The paid amount and enabled features are determined by the package selected when the order was created; allowing a later package change would detach the invitation from the payment record.

**How to apply:** Treat `isPurchased` plus the persisted package ID as the source of truth. Do not let URL parameters, client state, or direct PATCH requests replace the package for a paid customer invitation.