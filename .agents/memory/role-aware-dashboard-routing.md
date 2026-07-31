---
name: Role-aware dashboard routing
description: Dashboard and editor navigation must preserve the authenticated account role.
---

Every shared header, editor exit action, and direct dashboard route must resolve the destination from the authenticated role: Buyer to the buyer dashboard, Business Account to the business dashboard, and Admin to the admin area. The generic editor route must also select the editor mode from the session role.

**Why:** Shared public navigation previously hard-coded the buyer dashboard, so a Business Account could be sent to the wrong dashboard after opening the catalog or editor.

**How to apply:** Use the centralized role-to-dashboard resolver for user icons, drawer dashboard actions, editor back/home actions, access guards, and non-admin redirects. Keep dedicated business editor routes role-protected.