---
name: Zod optional vs null
description: Zod `.optional()` does not accept `null`; normalize DB nulls before parsing or use `.nullish()`.
---

Zod's `.optional()` allows `T | undefined`, not `T | null`. PostgreSQL columns often return `null` when a value is absent, so parsing a raw Drizzle row with `.optional()` fields can throw `Expected string, received null`.

**Why:** The generated or hand-written Zod schema reflects the request shape, not the database shape. Drizzle returns `null` for nullable columns that have no value, while Zod expects the field to be absent or a string.

**How to apply:** When parsing DB rows, normalize `null` to `undefined` before passing to the Zod schema, or change the schema to `.nullish()`. Keep the API response schema unchanged if clients expect `undefined` rather than `null`.
