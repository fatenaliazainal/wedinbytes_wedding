---
name: Paid package immutability
description: The package attached to a paid invitation must remain fixed after payment.
---

Invitations generated from a Business Account customer order and all paid invitations must keep their assigned package. Customers may continue editing invitation content and design, but package changes require support. A previously assigned package should remain visible as a locked choice even if it is later removed from the active public pricing list.

**Why:** An Event Planner's order form and a verified paid order are the sources of truth for the package promised to the customer. Allowing a package change after payment could desynchronise the purchased features and amount.

**How to apply:** Treat the persisted Business customer-order link or verified `PAID` order plus package ID as the source of truth for the lock. Enforce it in both the editor and PATCH API, and provide the configured WhatsApp support link when customers request a change. Use the paid-order fallback when `isPurchased` is stale.