---
name: Admin revenue reporting
description: Rules for admin order and monthly revenue reporting
---

Admin revenue reports count only orders with payment status `PAID`. Revenue and successful-order counts are grouped by the payment timestamp in the `Asia/Kuala_Lumpur` calendar; if a paid order has no payment timestamp, its order creation timestamp is the fallback. Total order volume is grouped by order creation month and includes every order status. The monthly list begins at the first order month and continues through the current month, rather than showing empty months before the business started.

**Why:** Payment date represents when revenue was realized, while creation date represents demand and pending/failed order volume. Mixing the two would make monthly business metrics misleading; leading empty months also make a new business appear active before its first order.

**How to apply:** Preserve separate fields for total orders, successful orders, and revenue in admin reports. Use Malaysia timezone for month boundaries and keep the report read-only.