---
name: Managed artifact workflows
description: Managed artifact preview workflows own their generated port and should not be duplicated by a second frontend launcher.
---

Managed artifact workflows must keep the artifact-assigned port and preview mapping from `.replit`; adding or retaining a second launcher for the same frontend can make the artifact fail with an address-in-use error.

**Why:** The Wedding Invitation artifact already had a generated workflow on its assigned port, while a separate `Start application` workflow launched the same Vite server and caused a duplicate frontend process.

**How to apply:** When an artifact workflow fails, compare its generated port and process with other workflows first. Consolidate to the managed artifact workflow instead of changing the app to chase the duplicate process.