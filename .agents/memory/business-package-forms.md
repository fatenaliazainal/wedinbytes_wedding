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

Customer form share URLs use a URL-safe segment derived from the displayed Business name, not the separately editable Business link.

**Why:** The share link should identify the business customers recognise, while the editable business link remains a separate public-profile setting.

**How to apply:** Normalize the current `businessName` for the `/business/{name}/customer-form/{token}` path when generating share links.

Required customer contact number belongs near the top of the business order form, immediately after the couple names, rather than buried among venue and invitation details.

**Why:** Customers could mistake the form as missing contact information when the required field was only visible much further down the page.

**How to apply:** Normalize configured package forms so `contactPhone` is always present, required, labeled “Contact number”, and positioned after the first two couple-name fields.

Public customer forms should collect the primary contact number and the repeatable “Contact persons” section; the Doa field is intentionally excluded, while legacy invitation data remains supported.

**Why:** The customer needs to provide contact details for the invitation, while Doa is not part of the requested customer-facing content.

**How to apply:** Keep `contactPhone` and `contacts` in normalized Business package form fields, filter `doaText`, and do not remove either contact field from invitation schemas or existing stored records.

Standard registration creates a Buyer account without exposing an account-type selector; Business Account roles remain managed through the existing administrative flow.

**Why:** New customers should not be asked to choose an internal account workflow during ordinary signup.

**How to apply:** Keep the signup request on the default Buyer role and preserve backend/admin support for Business Account users.

Package form visibility is gated by the package's persisted feature list: only packages with the `Photo Gallery` feature receive the gallery field and upload capability.

**Why:** Older stored form configurations may still contain gallery fields, while feature availability must remain consistent for Standard and Premium packages.

**How to apply:** Normalize package forms with the package feature list, reject gallery uploads server-side when the feature is absent, and add the gallery field when an enabled package lacks it.

Business customer order forms do not collect Event Type or Dress Code fields, and parents' details use native multiline textareas.

**Why:** These values are managed elsewhere in the invitation workflow, while native textareas provide reliable controlled input for customer-submitted parents' details across legacy package configurations.

**How to apply:** Filter `eventType`, `dresscode`, and `dresscodeTheme` by both field key and invitation mapping during normalization; normalize groom/bride parents to `textarea` and keep the customer form state controlled.

Both Standard and Premium customer order forms include an optional song/music URL that maps directly to the invitation's existing audio field.

**Why:** Customers need to provide the invitation soundtrack during the order flow, while the existing invitation playback already supports YouTube and audio URLs.

**How to apply:** Add `musicUrl` to the shared default form configuration so normalization backfills it into legacy package configurations and the existing customer-to-invitation mapping carries it through.