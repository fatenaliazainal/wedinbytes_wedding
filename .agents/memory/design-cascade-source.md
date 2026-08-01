---
name: Design cascade source
description: Which template source drives styling for demo vs real buyer invitations.
---

# Design cascade source

Both the Live Demo and real buyer/business invitations use the **active card design** as their base template source. Buyer editor saves overwrite individual fields on top.

Priority order (highest first):
1. `?designCode=` URL param (catalogue preview click)
2. `activeDesign?.designCode` (active card design set by admin)
3. `inv.designCode` (fallback when no design is activated — avoids blank page)
4. `"FL001"` hardcoded last resort

**Why:**
Previously, real invitations used `inv.designCode` to find the template, while the demo used `activeDesign`. This meant admin changes to the active card design showed in the demo but not in real invitations. Unifying both to active design ensures all invitations reflect admin styling choices automatically.

**How to apply:**
- `InvitationPage.tsx`: `designCode = overrideDesignCode ?? activeDesign?.designCode ?? inv.designCode ?? "FL001"`
- `EditorPage.tsx`: `resolvedCode = urlDesignCode ?? gd.designCode ?? d.designCode ?? "FL001"` (same for demo and buyer modes)
- `invitationOwnsStyle` flag (true for non-demo) still controls whether buyer's saved non-null values override the template — that part is unchanged.

**Dependency:**
This cascade only works correctly in production when `/api/design/active` returns a design. If no design is activated, it silently falls back to `inv.designCode` (graceful). Task #46 tracks auto-activating the first design at startup.
