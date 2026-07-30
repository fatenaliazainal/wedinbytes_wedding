---
name: DB schema declarations
description: TypeScript composite builds can keep API routes on stale generated database declarations after a Drizzle schema change.
---

After changing a Drizzle table, verify the actual development database columns and rebuild the database package declarations before typechecking or rebuilding dependent API packages. A merged schema can be ahead of the database when push is blocked by an unrelated legacy constraint prompt.

**Why:** The API workspace references the database package as a composite TypeScript project, so its inferred table types can remain stale even when the source schema is already updated.

**How to apply:** Rebuild the DB/API project references and clear stale build metadata when a newly added column is reported as missing by API typecheck; for a safe additive development-only column, apply the equivalent non-destructive DDL after confirming the missing column.