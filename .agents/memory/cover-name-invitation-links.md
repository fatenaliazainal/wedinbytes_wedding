---
name: Cover-name invitation links
description: Public invitation URLs use the customer-facing Cover Groom Name and Cover Bride Name consistently across account types and email.
---

New public invitation URLs must use `Cover Groom Name` followed by `Cover Bride Name`; short names, full names, and initials are never generation fallbacks. Existing named links may remain readable as lookup aliases.

**Why:** The URL is a guest-facing part of the invitation and should match the names shown on the cover, not expose the couple's full database names or an unrelated short-name field.

**How to apply:** Keep frontend link builders, server generation, Buyer and Business Account dashboard responses, Admin links, and payment emails aligned. Keep the previous named slug only as a server lookup alias so existing shared links remain usable.