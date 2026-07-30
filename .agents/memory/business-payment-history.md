---
name: Business payment history
description: Product boundary for Business Account payment visibility
---

Buyer and Business Accounts should expose a read-only Payment History view containing completed payments tied to invitations they own. Do not present subscription plans, billing setup, saved payment methods, invoice management, or next-billing controls.

**Why:** Both Buyers and Event Planners need to see payment records after a payment exists; the previous billing page implied a subscription product that is not part of the current workflow.

**How to apply:** Keep payment history scoped by the authenticated role's invitation ownership—`userId` for Buyers and `businessId` for Business Accounts—and show a simple empty state until a completed payment is recorded.