---
name: Wishes carousel
description: Public invitation Wishes section interaction and presentation contract.
---

The public Wishes section is a single-card horizontal carousel with Embla swipe/drag, desktop arrows, clickable pagination dots, and six-second auto-advance.

**Why:** Guests need a compact, premium guestbook that works across touch and mouse devices without changing RSVP data or backend behavior.

**How to apply:** Preserve initials, sender, timestamp, line breaks, and Read More/Show Less inside each card; pause auto-advance while hovering or dragging/touching, resume after interaction, and keep the carousel responsive with no horizontal overflow.

The current visual direction is a compact floating glass card: centered message content, sender and timestamp below, no avatar/initials, natural content height, and generous whitespace around the card; the section does not show a wish-count row.

**Why:** The Wishes section should feel like a small premium glass element rather than a large content box or social comment feed.

**How to apply:** Keep this visual treatment confined to the Wishes section; use responsive fixed widths of 300/280/260px with auto height, omit the count label above the carousel, and never alter carousel state, controls, timing, or the wishes data contract.