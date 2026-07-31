---
name: Paid package immutability
description: The package attached to a paid invitation must remain fixed after payment.
---

Invitations generated from a Business Account customer order must keep the package selected on that order. Buyer invitations may still change package selection from the editor, including after payment, while their invitation content and design remain editable. A previously assigned Business order package should remain visible as a locked choice even if it is later removed from the active public pricing list.

**Why:** An Event Planner's order form is the source of truth for the package promised to that customer. Buyer-created invitations use the normal self-service editor flow and must not inherit the Business order-form restriction.

**How to apply:** Treat the persisted Business customer-order link plus package ID as the source of truth for the lock. Enforce that rule in both the editor and PATCH API; do not use `isPurchased` alone to lock a Buyer package.