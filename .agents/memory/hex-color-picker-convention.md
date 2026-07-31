---
name: HEX color picker convention
description: All user-facing colour pickers use six-digit HEX values while legacy theme storage remains compatible.
---

User-facing colour controls must show and accept six-digit HEX values such as `#6C5F41`, never RGB or HSL text. Legacy HSL theme values may still be converted internally at the CSS/API boundary.

**Why:** The requested picker experience is the browser HEX format, while existing theme tokens use space-separated HSL values and must not be broken.

**How to apply:** Reuse the shared HEX color input for every new or existing picker; convert HEX to the legacy HSL representation only when writing theme tokens.