---
name: Drizzle push interactivity
description: drizzle-kit push can prompt when adding constraints with existing data; workflow commands must be non-interactive.
---

`drizzle-kit push` can enter an interactive prompt when it needs to add a unique constraint or another destructive change to a table that already contains rows. In a workflow this causes the server to hang until it times out because there is no stdin attached.

**Why:** The push detects a constraint that could fail on existing data and asks whether to truncate the table or attempt the change without truncating. A workflow cannot answer this prompt, so the port never opens and the workflow restart fails.

**How to apply:** Make the `push-force` script non-interactive by piping the desired answer (e.g. `printf 'No\\n' | drizzle-kit push --force ...`). Prefer migrations over push for production to avoid surprise prompts.
