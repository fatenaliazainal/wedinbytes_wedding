---
name: Event time overrides
description: The visible invitation time defaults to start/end time but supports durable custom wording.
---

“Time (Text)” in the shared Buyer, Business Account, and Admin editor defaults to a readable range generated from Start Time and End Time, but a user-typed value is a deliberate override and must remain unchanged when those pickers change.

**Why:** Couples need wording that a numeric range cannot express (for example, ceremony timing, arrival guidance, or a named session), while still benefiting from automatic defaults for ordinary invitations.

**How to apply:** Preserve the custom value through the normal invitation save and reload flow. Treat a saved value that differs from the generated range — including a value saved before start/end fields existed — as custom. Only resume auto-updates when the displayed value matches the generated range again.