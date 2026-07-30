---
name: Business package forms
description: Durable decisions and boundaries for configuration-driven Business Account customer and invitation creation.
---

Persisted pricing-package form configuration is the single source of truth for the Business Account customer workflow. The selected active package determines visible fields, defaults, hidden values, validation rules, and invitation mappings; the server must validate and sanitize this configuration-driven payload rather than relying on frontend checks.

**Why:** Business packages will evolve independently of the frontend, and hardcoded package-name branches would make new or edited packages silently produce incomplete customer records.

**How to apply:** Keep Buyer creation/editor behavior separate. The Event Planner first creates a persisted package-specific share link; a public customer submission saves only the cleaned customer record. Create and link the mapped business-owned invitation only after the owner explicitly requests it, then return its token for the existing Business Editor route. Keep the legacy authenticated client endpoint functional for existing records.

**Why:** Customer details must be collected by the customer before an Event Planner creates an invitation; generating invitations during link creation or public submission creates premature and potentially incomplete records.

Gallery images uploaded from a public customer form are temporary customer-owned assets scoped to that form-share token. Only keys from that token's upload prefix may be copied into the eventual business invitation.

**Why:** The invitation does not exist when the customer submits the form, so the existing owner-protected invitation upload endpoint cannot be used; token-scoped prefixes preserve the customer-first workflow without accepting arbitrary storage keys.

**How to apply:** Upload through the public form-share gallery route, persist the returned keys in cleaned customer data, filter them again during submission, and attach them when the Business Account creates the invitation.