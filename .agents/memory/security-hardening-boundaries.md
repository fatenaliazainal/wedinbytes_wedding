---
name: Security hardening boundaries
description: Durable access-control and privacy rules established for the wedding invitation API.
---

Public invitation data must never include the invitation owner, lock PIN hash, or full RSVP rows. Public pages may read aggregate RSVP counts and a deliberately limited wishes feed containing only non-empty guest names, messages, and timestamps. Full RSVP rows require the invitation owner or an admin session.

**Why:** Invitation tokens are intentionally shareable with guests, so token possession alone cannot authorize buyer data access or mutation.

**How to apply:** Keep ownership checks in server routes, not only in frontend visibility. Apply the same rule to PATCH/lock/upload/list endpoints and preserve the public count/wishes endpoints as separate reduced responses.

Authentication success must regenerate the session ID. Login, registration, admin login, PIN unlock, RSVP submission, and review submission are rate-limited. Uploaded images must be signature- and dimension-validated before R2 storage.

**Why:** The audit identified session fixation, brute-force, and decompression-bomb risks that are independent of frontend behavior.

**How to apply:** Reuse the shared security helpers and image validator for new routes instead of adding route-local checks with weaker limits.