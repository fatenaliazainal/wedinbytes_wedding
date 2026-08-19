---
name: Rich-text editor line breaks
description: Reliable multiline behavior for invitation text fields across content-editable browsers.
---

For invitation rich-text inputs, handle Enter explicitly by inserting a line-break element and syncing the resulting HTML to state; do not depend solely on the browser's content-editable default behavior.

**Why:** Native content-editable Enter behavior differs across browser and mobile keyboard contexts, and may not visibly create or persist the expected new line.

**How to apply:** Keep the explicit multiline Enter path in the shared rich-text editor so parent-name and invitation text fields store a concrete line break that the public sanitizer can render consistently.
