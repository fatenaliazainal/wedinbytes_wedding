---
name: OpenAPI/spec mismatch
description: When the API returns fields not declared in the OpenAPI spec, the orval-generated React/zod types drift from the actual runtime shape.
---

The frontend (wedding-invite) uses many invitation fields (e.g. contacts, rsvp settings, short names, design overrides) that the API returns but the OpenAPI spec does not declare. orval generates the React client and zod schemas from the spec, so undeclared fields are missing from the generated TypeScript types.

**Why:** Without a matching spec, `tsc` reports errors as soon as the code references those fields, and the generated hooks have the wrong signatures (e.g. `/rsvp/count` was missing the optional `invitationToken` query parameter).

**How to apply:** When you add a new API field or endpoint parameter, update `lib/api-spec/openapi.yaml` first, then run `pnpm -F @workspace/api-spec codegen`. If a field is intentionally dynamic, cast the response to `Record<string, unknown>` only as a last resort and document why the spec is not the source of truth.