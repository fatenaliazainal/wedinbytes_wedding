---
name: Business payment history
description: Product boundary for Business Account payment visibility
---

Buyer and Business Accounts should expose a read-only Payment History view containing all order statuses tied to invitations they own. Paid rows can download a receipt; pending rows can offer Pay Now when checkout is available. Do not present subscription plans, billing setup, saved payment methods, invoice management, or next-billing controls.

**Why:** Both Buyers and Event Planners need invoice visibility before and after payment; the previous billing page implied a subscription product that is not part of the current workflow.

**How to apply:** Keep payment history scoped by the authenticated role's invitation ownership—`userId` for Buyers and `businessId` for Business Accounts—show the stable table columns even when empty, and keep checkout/receipt behavior separate from subscription management.