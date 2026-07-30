---
name: Business package forms
description: Durable decisions and boundaries for configuration-driven Business Account customer and invitation creation.
---

Persisted pricing-package form configuration is the single source of truth for the Business Account customer workflow. The selected active package determines visible fields, defaults, hidden values, validation rules, and invitation mappings; the server must validate and sanitize this configuration-driven payload rather than relying on frontend checks.

**Why:** Business packages will evolve independently of the frontend, and hardcoded package-name branches would make new or edited packages silently produce incomplete customer records.

**How to apply:** Keep Buyer creation/editor behavior separate. The Event Planner first creates a persisted package-specific share link; a public customer submission saves only the cleaned customer record. Create and link the mapped business-owned invitation only after the owner explicitly requests it, then return its token for the existing Business Editor route. Keep the legacy authenticated client endpoint functional for existing records.

**Why:** Customer details must be collected by the customer before an Event Planner creates an invitation; generating invitations during link creation or public submission creates premature and potentially incomplete records.