---
name: Business package forms
description: Durable decisions and boundaries for configuration-driven Business Account customer and invitation creation.
---

Persisted pricing-package form configuration is the single source of truth for the Business Account customer workflow. The selected active package determines visible fields, defaults, hidden values, validation rules, and invitation mappings; the server must validate and sanitize this configuration-driven payload rather than relying on frontend checks.

**Why:** Business packages will evolve independently of the frontend, and hardcoded package-name branches would make new or edited packages silently produce incomplete customer records.

**How to apply:** Keep Buyer creation/editor behavior separate. When a Business Account creates a customer, save the selected package and raw cleaned customer data, create the mapped business-owned invitation in the same transaction, link the invitation back to the client, and return its token for the existing Business Editor route.