---
name: Business response boundaries
description: Durable API boundary between public Business Account pages and business summaries embedded in invitations
---

Public Business Account profiles and business summaries embedded in invitation responses are separate contracts. Public profiles may expose safe presentation fields such as verification state and invitation count; invitation summaries should expose only the branding/contact fields needed by the card. Neither response may expose business user IDs, profile IDs, active-state flags, ownership data, PIN hashes, or other internal metadata.

**Why:** Business Accounts own invitations directly, so the invitation response must communicate branding without turning the public invitation into an ownership or account-discovery endpoint.

**How to apply:** When adding Business Account fields, update the appropriate OpenAPI schema and server projection only. Regenerate clients after schema changes, and verify both `/api/business/:slug` and `/api/invitation/:token` independently.