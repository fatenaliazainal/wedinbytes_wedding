---
name: Paid invitation edit lock
description: Customer editing lifecycle after a paid invitation's event date.
---

Once a paid invitation's event date has passed, Buyer and Business Account users must be read-only. Admin access remains available for support and administration.

**Why:** Reusing an old paid invitation for a later event would let customers avoid purchasing a new invitation.

**How to apply:** Enforce the lock at the invitation PATCH and every invitation-owned upload endpoint, then mirror it in the editor UI. Keep event-date locking separate from the three-month public expiration rule.