---
name: Admin-managed design persistence
description: Protects saved Card Design catalogue edits from startup seed routines.
---

Startup seeding must treat Card Design rows as admin-managed data: create defaults only when the catalogue is empty, then preserve all existing image URLs, colors, typography, music, activation state, and other edits.

**Why:** A startup “repair” step that restored legacy image paths overwrote the latest design saved in Admin whenever the API restarted.

**How to apply:** Keep default seed values for first-run provisioning only. Any intentional catalogue migration must be an explicit, separately reviewed operation rather than part of normal API startup.

When an admin edits a design without touching an asset field, omit that field from the PATCH payload; only send an empty value when the admin explicitly removes the asset.

**Why:** Upload fields can temporarily hold an empty string while a new file is being selected; sending that value during an unrelated edit silently deletes the saved catalogue asset reference.

**How to apply:** Track whether each optional asset changed in the form and preserve the stored value when it did not.