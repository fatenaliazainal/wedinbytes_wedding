---
name: Paid package immutability
description: The package attached to a paid invitation must remain fixed after payment.
---

Once payment is verified, the invitation's purchased package is immutable for customers. Invitations generated from a Business Account customer order must also keep the package selected on the order. Invitation content and design can remain editable, but package changes must be rejected both in the editor and at the API boundary. A previously assigned package should remain visible as a locked choice even if it is later removed from the active public pricing list.

**Why:** The paid amount and enabled features are determined by the package selected when the order was created; allowing a later package change would detach the invitation from the payment record or from the customer's requested package.

**How to apply:** Treat `isPurchased` plus the persisted package ID, and the customer-order invitation link plus its persisted package ID, as the source of truth. Do not let URL parameters, client state, or direct PATCH requests replace the package.