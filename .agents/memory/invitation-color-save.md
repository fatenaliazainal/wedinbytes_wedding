---
name: Invitation color save rule
description: Why invitation colors must always be persisted as actual values, never null, during editor saves.
---

# Invitation color save rule

Always save the exact resolved color value from the editor to the invitation row. Never send `null` for colors that happen to match the current template.

**Why:**
An earlier "null-cascade" optimisation sent `null` for colors that matched `inheritedColors` (the active design template), intending to let future template changes cascade automatically. This caused a hard-to-diagnose bug: the editor (dev) resolved colors from the active card design template; the public invitation page (production, no active design) fell back to the `inv.designCode` template — a *different* design with different colors. Because the saved values were `null`, the public page showed that fallback template's colors instead of what the editor showed.

**How to apply:**
In `EditorPage.tsx`, the save payload for color fields must always be `design.colorXxx || null` (actual value or null if empty), never the conditional `designCodeChanged || value !== inheritedColor ? value : null` form. The `inheritedColors` state is retained for the color-picker UI (showing inherited vs overridden indicators) but must not gate whether values are persisted.
