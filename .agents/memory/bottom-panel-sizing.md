---
name: Bottom panel sizing
description: Content-fitting sizing for invitation detail panels opened from the public bottom navigation
---

Public invitation detail panels should size to their actual content and use only normal bottom padding; the fixed bottom navigation is a separate element and must not require a large reserved spacer inside the panel. Calendar, Location, Contact, and RSVP should share one reusable compact shell.

**Why:** An oversized reserved bottom area made detail panels extend unnecessarily toward the top of the invitation viewport, and separate sizing rules caused Location, Contact, and RSVP to drift from Calendar.

**How to apply:** Keep panel content and navigation behavior unchanged while avoiding large bottom padding used only to make room for the separate bottom nav; reuse the shared 340px × 407px shell, header, icon, title, card, and CTA classes across all four panels while preserving every field, action, and RSVP submit flow.