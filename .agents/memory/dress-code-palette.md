---
name: Dress code palette
description: Dress-code themes and colour palettes shared by invitation editor and public invitation presentation.
---

Dress Code is additive: retain the legacy free-text `dresscode` value for existing invitations, while the newer theme and palette values remain optional. A palette contains at most four six-digit hex colours and is displayed as circular swatches in the guest-facing invitation. In the published invitation, Dress Code is its own section immediately before RSVP, with Theme followed by Display colors.

**Why:** Existing invitations must continue rendering without migration-time content rewriting, while the requested visual palette needs a strict, predictable shape for editor, API, and public display.

**How to apply:** Use the new theme as the preferred label with legacy `dresscode` as fallback; validate and truncate palette values server-side and keep Business Account order forms compatible with the optional theme field. Keep Theme and palette editing together in a dedicated editor tab rather than Date & Location.