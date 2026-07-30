---
name: Business package forms
description: Durable decisions and boundaries for configuration-driven Business Account customer and invitation creation.
---

Persisted pricing-package form configuration is the single source of truth for the Business Account customer workflow. The selected active package determines visible fields, defaults, hidden values, validation rules, and invitation mappings; the server must validate and sanitize this configuration-driven payload rather than relying on frontend checks.

**Why:** Business packages will evolve independently of the frontend, and hardcoded package-name branches would make new or edited packages silently produce incomplete customer records.

**How to apply:** Keep Buyer creation/editor behavior separate. The Event Planner may either create a persisted package-specific share link for customer-first collection or open a blank Business Editor and fill the invitation directly. Customer-link submissions save only the cleaned customer record; mapped business-owned invitations are created only after the owner explicitly requests it. Keep the legacy authenticated client endpoint functional for existing records.

**Why:** Customer details must be collected by the customer before an Event Planner creates an invitation; generating invitations during link creation or public submission creates premature and potentially incomplete records.

Gallery images uploaded from a public customer form are temporary customer-owned assets scoped to that form-share token. Only keys from that token's upload prefix may be copied into the eventual business invitation.

**Why:** The invitation does not exist when the customer submits the form, so the existing owner-protected invitation upload endpoint cannot be used; token-scoped prefixes preserve the customer-first workflow without accepting arbitrary storage keys.

**How to apply:** Upload through the public form-share gallery route, persist the returned keys in cleaned customer data, filter them again during submission, and attach them when the Business Account creates the invitation.

Business Account profile UI should expose a friendly generated business link, not the internal slug field; keep the slug server-managed for public profile compatibility.

**Why:** Slugs are implementation details and exposing them creates unnecessary user confusion while still requiring a stable public URL.

**How to apply:** Allow edits only to the business name and type in the profile UI/API; derive and display the public link from the server-returned profile slug.