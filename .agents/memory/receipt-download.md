---
name: Receipt downloads
description: Browser-generated payment receipt format and compatibility boundary.
---

Buyer payment receipts are generated as valid single-page PDFs in the browser, not plain-text files.

**Why:** Customers expect a printable/downloadable receipt that opens consistently on phones and desktops without requiring a server-side file or extra PDF dependency.

**How to apply:** Keep the receipt data sourced from the existing payment-history response, preserve the invoice/package/payment fields, and use a `.pdf` filename with `application/pdf` content.