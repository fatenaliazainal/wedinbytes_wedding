---
name: Business payment history
description: Product boundary for Business Account payment visibility
---

Business Accounts should expose a read-only Payment History view containing completed payments tied to their business-owned invitations. Do not present subscription plans, billing setup, saved payment methods, invoice management, or next-billing controls.

**Why:** The Event Planner product only needs users to see payment records after a payment exists; the previous billing page implied a subscription product that is not part of the current workflow.

**How to apply:** Keep payment history scoped by the authenticated Business Account's invitation ownership and show a simple empty state until a completed payment is recorded.