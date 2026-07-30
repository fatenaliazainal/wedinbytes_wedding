---
name: Planner response boundaries
description: Durable API boundary between public planner pages and planner summaries embedded in invitations
---

Public planner profile responses and planner summaries embedded in invitation responses must remain separate contracts. Public profiles may expose safe presentation fields such as verification state and assigned-event count; invitation summaries should expose only the branding/contact fields needed by the card. Neither response may expose planner user IDs, profile IDs, active-state flags, ownership data, or other internal metadata.

**Why:** The frontend needs different data shapes for a public planner page versus the wedding card, and reusing the full profile shape caused generated client types to require fields that invitation summaries do not provide. More importantly, embedding internal identifiers in public invitation data would weaken the privacy boundary.

**How to apply:** When adding planner fields, update the appropriate OpenAPI schema and server projection only. Regenerate clients after schema changes, and verify both `/api/planner/:slug` and `/api/invitation/:token` independently.