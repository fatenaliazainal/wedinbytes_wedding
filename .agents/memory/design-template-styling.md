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