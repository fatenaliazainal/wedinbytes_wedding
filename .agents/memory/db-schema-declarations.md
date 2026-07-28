---
name: DB schema declarations
description: TypeScript composite builds can keep API routes on stale generated database declarations after a Drizzle schema change.
---

After changing a Drizzle table, rebuild the database package declarations before typechecking or rebuilding dependent API packages.

**Why:** The API workspace references the database package as a composite TypeScript project, so its inferred table types can remain stale even when the source schema is already updated.

**How to apply:** Rebuild the DB/API project references and clear stale build metadata when a newly added column is reported as missing by API typecheck.