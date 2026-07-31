---
name: Invitation expiration
description: The public invitation lifecycle rule and its calendar-date boundary.
---

Public invitations expire after three calendar months from the stored event date. The invitation remains available on the expiration date itself and expires only when the current calendar date is later.

**Why:** Invitation URLs and their RSVP-related public endpoints should stop exposing old event data after the hosting-retention window, while preview templates remain usable.

**How to apply:** Enforce expiration server-side before returning public invitation data or public RSVP data. Keep the demo/template invitation available for catalogue and editor previews, and have the public client redirect to the homepage on lookup failure.