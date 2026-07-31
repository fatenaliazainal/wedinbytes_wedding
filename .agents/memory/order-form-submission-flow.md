---
name: Order form submission flow
description: Business dashboard presents submitted forms as order-form submissions that lead directly to invitation creation.
---

The Business Account UI should treat a submitted customer form as an order form submission, not as a separate customer-management object. The visible flow is: Order Form Submitted → Invitation Created or Invitation Not Created → Create/Edit Invitation.

**Why:** The business user wants a simple order-to-invitation workflow and does not need a separate customer entity presented in the dashboard.

**How to apply:** Use Order Form / Order Form Submission labels in dashboard UI. Existing client API records, database relationships, and legacy customer-form URLs may remain behind the scenes for compatibility.