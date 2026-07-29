---
name: Admin-managed design persistence
description: Protects saved Card Design catalogue edits from startup seed routines.
---

Startup seeding must treat Card Design rows as admin-managed data: create defaults only when the catalogue is empty, then preserve all existing image URLs, colors, typography, music, activation state, and other edits.

**Why:** A startup “repair” step that restored legacy image paths overwrote the latest design saved in Admin whenever the API restarted.

**How to apply:** Keep default seed values for first-run provisioning only. Any intentional catalogue migration must be an explicit, separately reviewed operation rather than part of normal API startup.