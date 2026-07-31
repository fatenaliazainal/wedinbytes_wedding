---
name: Bottom panel sizing
description: Content-fitting sizing for invitation detail panels opened from the public bottom navigation
---

Public invitation detail panels should size to their actual content and use only normal bottom padding; the fixed bottom navigation is a separate element and must not require a large reserved spacer inside the panel.

**Why:** An oversized reserved bottom area made Calendar, Location, and similar panels extend unnecessarily toward the top of the invitation viewport.

**How to apply:** Keep panel content and navigation behavior unchanged while avoiding large bottom padding used only to make room for the separate bottom nav.