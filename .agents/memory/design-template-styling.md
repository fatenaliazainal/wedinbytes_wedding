---
name: Card design template styling
description: Admin Card Design styling must flow into editor previews and public invitations without changing invitation content.
---

Card Design owns the default visual system for an invitation: palette, couple-name/body fonts, font sizes, and related typography. The editor should inherit these values from the selected design and only persist per-invitation overrides when the customer changes them.

**Why:** Admin needs to create a reusable visual style once, while buyers must still be able to personalise content without losing the catalogue design or copying styling into every invitation.

**How to apply:** Keep template styling fields in the CardDesign API contract, use them as fallbacks in editor and public invitation rendering, and preserve the existing separation between template assets/styling and invitation content.

The admin Live Demo invitation is sample content only; its saved per-invitation style fields must never override the currently selected Card Design template.

**Why:** The demo record can contain legacy copied fonts or colours, which made a successfully saved catalogue design appear unchanged in the editor and public preview.

**How to apply:** Resolve Live Demo typography, colours, opening style, and layout from the selected catalogue design after every load; invalidate both the design list and active-design queries after Card Design saves or activation.

Catalogue previews should use shared sample invitation content only as demo data; every Card Design must retain its own artwork and visual styling. Blank or legacy placeholder demo fields should fall back to readable sample names and event details.

**Why:** The catalogue needs consistent content for comparing designs, but a shared “default design” would make distinct card artwork and styling appear interchangeable.

**How to apply:** Keep demo content separate from Card Design records, patch only blank/placeholder demo fields, and render the sample content over each selected design’s artwork.

New Buyer and Business Account cards should copy all editable invitation content from Live Demo at creation time, while Card Design supplies styling/artwork/music independently. Gallery images, initials uploads, and Money Gift QR files remain invitation-owned and are never copied as defaults.

**Why:** Customers need a complete, readable starting invitation without making uploaded assets or catalogue styling leak between records.

**How to apply:** Hydrate the new-card editor from the demo content response, persist the full content payload after the initial record is created, and keep per-card uploads plus template visual fields outside the demo-content copy.

Public sample invitations use Alia and Nasser, and all user-facing branding uses Wedinstudio.

**Why:** The sample couple and brand are part of the product presentation and must not expose old placeholder or legacy brand names.

**How to apply:** Update demo seeds and visual fallbacks together; preserve old invitation tokens, storage bucket names, and compatibility identifiers only when they are not user-facing.