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

Business Account profile UI should expose one editable custom business link, while the database field remains an internal slug used by the public profile route.

**Why:** Business owners want to choose a recognisable public address; showing a generated UUID-like value is confusing, but the public route still needs a stable unique path.

**How to apply:** Label the field “Business link”, accept a custom name or pasted `/business/...` URL, normalize it to a safe unique slug on the server, and never expose the word “slug” in the UI.

Required customer contact number belongs near the top of the business order form, immediately after the couple names, rather than buried among venue and invitation details.

**Why:** Customers could mistake the form as missing contact information when the required field was only visible much further down the page.

**How to apply:** Normalize configured package forms so `contactPhone` is always present, required, labeled “Contact number”, and positioned after the first two couple-name fields.