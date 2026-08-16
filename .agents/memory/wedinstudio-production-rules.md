---
name: Wedinstudio Production Change Safety Rules
description: Mandatory workflow and constraints for all changes to the live Wedinstudio production application.
---

# Wedinstudio — Production Change Safety Rules

Source: uploaded by fatenaliaza (owner), applies to ALL sessions permanently.

## Core Rules

1. NEVER modify unrelated features.
2. NEVER refactor code unless explicitly requested.
3. NEVER rewrite or restructure working code just because it can be improved.
4. NEVER change UI, UX, styling, layout, wording, or behaviour unless explicitly requested.
5. NEVER change database schema, data structure, API contracts, routes, authentication, permissions, or business logic unless explicitly requested.
6. NEVER rename existing functions, variables, components, routes, database fields, or API fields unless explicitly requested.
7. NEVER remove existing functionality unless explicitly requested.
8. Prefer the SMALLEST POSSIBLE CHANGE that solves the requested problem.
9. Preserve all existing behaviour outside the requested scope.
10. Do not "clean up" nearby code while fixing an issue.
11. Do not fix additional issues discovered during the task unless explicitly approved.
12. If another issue is discovered, report it separately and DO NOT modify it.
13. If the requested change may affect another feature, STOP and explain the risk before making the change.
14. Do not assume a similar-looking component should also be changed.
15. Always inspect existing code and understand the current flow before editing.

## Required Workflow (every task)

### STEP 1 — INVESTIGATE
- Identify the exact issue, root cause, files involved, dependencies, regression risks.
- DO NOT MODIFY CODE during this step.

### STEP 2 — PROPOSE
- State: root cause, files to modify, exact changes, what will NOT change, regression risks.
- Wait for approval if the change has meaningful risk or affects multiple systems.

### STEP 3 — IMPLEMENT
- Make only the approved changes. Keep the patch as small as possible.

### STEP 4 — VERIFY
- Run build/typecheck/tests. Verify fix. Check related functionality. Review final diff.
- Report: files changed, what changed, what was NOT changed, verification performed, remaining risks.

## Change Scope Rule

"Fix X" = Fix X only. NOT "Improve X", "Refactor X", "Modernize X", "Clean up X".

## Discovered Issues

DO NOT FIX discovered issues. Report using format:

> DISCOVERED ISSUE:
> - Description:
> - File:
> - Possible impact:
> - Recommended follow-up:

## Critical Production Systems (extra caution required)

Authentication, Authorization, Admin panel, Business panel, Customer panel, Design editor,
Customer website rendering, RSVP, Music/audio, Envelope/opening interaction, Payment, Orders,
Customer data, Database, File storage, Publishing/deployment, Existing production designs.

## Final Rule

When uncertain: DO NOT GUESS. Stop and explain what is uncertain, what could be affected,
and what information or approval is needed.

A smaller safe fix is always preferred over a larger clever fix.
The goal is not to make the code "better". The goal is to make the requested change safely
while preserving existing production behaviour.
