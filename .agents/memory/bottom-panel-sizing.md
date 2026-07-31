---
name: Bottom panel sizing
description: Content-fitting sizing for invitation detail panels opened from the public bottom navigation
---

Public invitation detail panels should size to their actual content and use only normal bottom padding; the fixed bottom navigation is a separate element and must not require a large reserved spacer inside the panel. Calendar should use compact icon, gap, content-card, and CTA spacing comparable to Contacts.

**Why:** An oversized reserved bottom area made Calendar, Location, and similar panels extend unnecessarily toward the top of the invitation viewport, while Calendar's own generous spacing made it visibly taller than Contacts.

**How to apply:** Keep panel content and navigation behavior unchanged while avoiding large bottom padding used only to make room for the separate bottom nav; when compacting Calendar, preserve every date/time field and the Save to Calendar action.