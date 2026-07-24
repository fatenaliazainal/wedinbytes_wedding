---
name: Allowed fields need DB columns
description: When adding fields to an API allow-list, verify the database column exists before the feature can work.
---

When expanding an API `ALLOWED_FIELDS` list, the generated OpenAPI spec and client types often already include the new fields (e.g. from a design/template schema), but the `invitation` table schema may not yet have the corresponding columns. If the DB column is missing, the PATCH endpoint builds an empty `update` object and returns a 500 due to invalid SQL (`update ... set where`).

**Why:** The API route maps `ALLOWED_FIELDS` to the request body and passes the result to Drizzle. Drizzle only emits columns that exist in its runtime schema, so unknown fields silently drop out and the update becomes empty.

**How to apply:** After adding a field to `ALLOWED_FIELDS`, always run the DB migration/push and rebuild the API server before testing. Also add the column to the source Drizzle schema if it is not already there.
