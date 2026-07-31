import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import {
  businessProfileTable,
  db,
  invitationTable,
  orderTable,
  pricingPackageTable,
  userTable,
} from "@workspace/db";

const router: IRouter = Router();

const BILL_EXPIRY_DAYS = 3;

async function expireStaleOrders(invitationIds: number[]) {
  if (!invitationIds.length) return;
  const cutoff = new Date(Date.now() - BILL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(orderTable)
    .set({ paymentStatus: "EXPIRED", updatedAt: new Date() })
    .where(
      and(
        inArray(orderTable.invitationId, invitationIds),
        eq(orderTable.paymentStatus, "PENDING"),
        lt(orderTable.createdAt, cutoff),
      ),
    );
}

async function expireAllStaleOrders() {
  const cutoff = new Date(Date.now() - BILL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(orderTable)
    .set({ paymentStatus: "EXPIRED", updatedAt: new Date() })
    .where(
      and(
        eq(orderTable.paymentStatus, "PENDING"),
        lt(orderTable.createdAt, cutoff),
      ),
    );
}

// Run a global expiry sweep on startup and then every hour
expireAllStaleOrders().catch(() => {});
setInterval(() => expireAllStaleOrders().catch(() => {}), 60 * 60 * 1000);

function adminGuard(req: any, res: any) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Admin access only" });
    return false;
  }
  return true;
}

function invitationStatus(invitation: typeof invitationTable.$inferSelect | undefined, paidByOrder = false) {
  if (!invitation) return "DISABLED";
  if (invitation.websiteStatus !== "ACTIVE") return invitation.websiteStatus;
  return invitation.isPurchased || paidByOrder ? "ACTIVE" : "PREVIEW";
}

router.get("/buyer/payment-history", async (req, res) => {
  if (req.session?.role !== "buyer" || !req.session.userId) {
    res.status(401).json({ error: "Buyer authentication required" });
    return;
  }

  try {
    const invitations = await db
      .select({
        id: invitationTable.id,
        brideName: invitationTable.brideName,
        groomName: invitationTable.groomName,
        coverBrideName: invitationTable.coverBrideName,
        coverGroomName: invitationTable.coverGroomName,
      })
      .from(invitationTable)
      .where(eq(invitationTable.userId, req.session.userId));

    if (!invitations.length) {
      res.json([]);
      return;
    }

    const invitationIds = invitations.map((invitation) => invitation.id);
    await expireStaleOrders(invitationIds);
    const [orders, packages] = await Promise.all([
      db
        .select()
        .from(orderTable)
        .where(inArray(orderTable.invitationId, invitationIds))
        .orderBy(desc(orderTable.paidAt), desc(orderTable.createdAt)),
      db.select({ id: pricingPackageTable.id, name: pricingPackageTable.name }).from(pricingPackageTable),
    ]);
    const invitationById = new Map(invitations.map((invitation) => [invitation.id, invitation]));
    const packageById = new Map(packages.map((pkg) => [pkg.id, pkg]));

    res.json(orders.map((order) => {
        const invitation = order.invitationId ? invitationById.get(order.invitationId) : undefined;
        const pkg = order.packageId ? packageById.get(order.packageId) : undefined;
        return {
          id: order.id,
          amount: order.amount,
          paymentStatus: order.paymentStatus,
          paymentReference: order.paymentReference,
          paymentGateway: order.paymentGateway,
          gatewayRefNo: order.gatewayRefNo,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
          packageName: pkg?.name ?? null,
          invitation: invitation
             ? {
                 id: invitation.id,
                 brideName: invitation.brideName,
                 groomName: invitation.groomName,
                 coverBrideName: invitation.coverBrideName,
                 coverGroomName: invitation.coverGroomName,
               }
            : null,
        };
      }));
  } catch (err) {
    req.log.error({ err }, "Failed to list buyer payment history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/payment-history", async (req, res) => {
  if (req.session?.role !== "business_account" || !req.session.userId) {
    res.status(401).json({ error: "Business Account authentication required" });
    return;
  }

  try {
    const [profile] = await db
      .select({ id: businessProfileTable.id })
      .from(businessProfileTable)
      .where(eq(businessProfileTable.userId, req.session.userId))
      .limit(1);

    if (!profile) {
      res.json([]);
      return;
    }

    const invitations = await db
      .select({
        id: invitationTable.id,
        brideName: invitationTable.brideName,
        groomName: invitationTable.groomName,
        coverBrideName: invitationTable.coverBrideName,
        coverGroomName: invitationTable.coverGroomName,
      })
      .from(invitationTable)
      .where(eq(invitationTable.businessId, profile.id));

    if (!invitations.length) {
      res.json([]);
      return;
    }

    const invitationIds = invitations.map((invitation) => invitation.id);
    await expireStaleOrders(invitationIds);
    const [orders, packages] = await Promise.all([
      db
        .select()
        .from(orderTable)
        .where(inArray(orderTable.invitationId, invitationIds))
        .orderBy(desc(orderTable.paidAt), desc(orderTable.createdAt)),
      db.select({ id: pricingPackageTable.id, name: pricingPackageTable.name }).from(pricingPackageTable),
    ]);
    const invitationById = new Map(invitations.map((invitation) => [invitation.id, invitation]));
    const packageById = new Map(packages.map((pkg) => [pkg.id, pkg]));

    res.json(orders.map((order) => {
        const invitation = order.invitationId ? invitationById.get(order.invitationId) : undefined;
        const pkg = order.packageId ? packageById.get(order.packageId) : undefined;
        return {
          id: order.id,
          amount: order.amount,
          paymentStatus: order.paymentStatus,
          paymentReference: order.paymentReference,
          paymentGateway: order.paymentGateway,
          gatewayRefNo: order.gatewayRefNo,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
          packageName: pkg?.name ?? null,
          invitation: invitation
             ? {
                 id: invitation.id,
                 brideName: invitation.brideName,
                 groomName: invitation.groomName,
                 coverBrideName: invitation.coverBrideName,
                 coverGroomName: invitation.coverGroomName,
               }
            : null,
        };
      }));
  } catch (err) {
    req.log.error({ err }, "Failed to list business payment history");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function readOrderRows() {
  await expireAllStaleOrders();
  const [orders, users, invitations, packages] = await Promise.all([
    db.select().from(orderTable).orderBy(desc(orderTable.createdAt)),
    db.select().from(userTable),
    db.select().from(invitationTable),
    db.select().from(pricingPackageTable),
  ]);
  const userById = new Map(users.map((row) => [row.id, row]));
  const invitationById = new Map(invitations.map((row) => [row.id, row]));
  const packageById = new Map(packages.map((row) => [row.id, row]));
  const paidInvitationIds = new Set(
    orders
      .filter((order) => order.paymentStatus === "PAID" && order.invitationId !== null)
      .map((order) => order.invitationId as number),
  );
  return orders.map((order) => {
    const user = order.userId ? userById.get(order.userId) : undefined;
    const invitation = order.invitationId ? invitationById.get(order.invitationId) : undefined;
    const pkg = order.packageId ? packageById.get(order.packageId) : undefined;
    return {
      ...order,
      customer: user ? { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } : null,
      package: pkg ? { id: pkg.id, name: pkg.name, price: pkg.price } : null,
      invitation: invitation ? {
        id: invitation.id,
        token: invitation.token,
        brideName: invitation.brideName,
        groomName: invitation.groomName,
        eventDate: invitation.eventDate,
        coverBrideName: invitation.coverBrideName,
        coverGroomName: invitation.coverGroomName,
        venueName: invitation.venueName,
        websiteStatus: invitationStatus(invitation, invitation ? paidInvitationIds.has(invitation.id) : false),
        isPurchased: invitation.isPurchased,
      } : null,
    };
  });
}

router.get("/admin/orders", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const rows = await readOrderRows();
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const paymentStatus = String(req.query.paymentStatus ?? "");
    const invitationStatusFilter = String(req.query.invitationStatus ?? "");
    const filtered = rows.filter((row) => {
      const haystack = [
        row.id,
        row.customer?.name,
        row.customer?.email,
        row.paymentReference,
      ].join(" ").toLowerCase();
      return (!search || haystack.includes(search))
        && (!paymentStatus || row.paymentStatus === paymentStatus)
        && (!invitationStatusFilter || row.invitation?.websiteStatus === invitationStatusFilter);
    });
    res.json(filtered);
  } catch (err) {
    req.log.error({ err }, "Failed to list admin orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/orders/stats", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const rows = await readOrderRows();
    const revenue = rows
      .filter((row) => row.paymentStatus === "PAID")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const packageStats = new Map<string, {
      packageId: number | null;
      packageName: string;
      totalOrders: number;
      successfulOrders: number;
      revenue: number;
    }>();
    for (const row of rows) {
      const packageId = row.package?.id ?? null;
      const packageName = row.package?.name ?? "Unassigned Package";
      const key = packageId === null ? "unassigned" : String(packageId);
      const current = packageStats.get(key) ?? {
        packageId,
        packageName,
        totalOrders: 0,
        successfulOrders: 0,
        revenue: 0,
      };
      current.totalOrders += 1;
      if (row.paymentStatus === "PAID") {
        current.successfulOrders += 1;
        current.revenue += Number(row.amount || 0);
      }
      packageStats.set(key, current);
    }
    const activeWebsites = (await db.select().from(invitationTable))
      .filter((row) => invitationStatus(row) === "ACTIVE").length;
    const monthFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
    });
    const monthLabelFormatter = new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "long",
    });
    const monthKey = (date: Date) => monthFormatter.format(date);
    const monthLabel = (date: Date) => monthLabelFormatter.format(date);
    const now = new Date();
    const orderDates = rows
      .map((row) => new Date(row.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()));
    const currentMonthKey = monthKey(now);
    const firstOrderMonthKey = orderDates
      .map((date) => monthKey(date))
      .sort()[0];
    const monthlyRevenue: Array<{
      month: string;
      label: string;
      totalOrders: number;
      successfulOrders: number;
      revenue: number;
      dailyRevenue: Array<{
        date: string;
        label: string;
        totalOrders: number;
        successfulOrders: number;
        revenue: number;
      }>;
    }> = [];

    if (firstOrderMonthKey) {
      const [firstYear, firstMonth] = firstOrderMonthKey.split("-").map(Number);
      const [currentYear, currentMonth] = currentMonthKey.split("-").map(Number);
      const monthCount = Math.max(
        1,
        (currentYear - firstYear) * 12 + (currentMonth - firstMonth) + 1,
      );

      for (let index = 0; index < monthCount; index += 1) {
        // Use noon UTC so formatting in Asia/Kuala_Lumpur cannot shift the
        // first day into the previous calendar month.
        const monthDate = new Date(Date.UTC(firstYear, firstMonth - 1 + index, 15, 12));
        monthlyRevenue.push({
          month: monthKey(monthDate),
          label: monthLabel(monthDate),
          totalOrders: 0,
          successfulOrders: 0,
          revenue: 0,
          dailyRevenue: [],
        });
      }
    }
    const monthlyByKey = new Map(monthlyRevenue.map((month) => [month.month, month]));
    const dailyByMonth = new Map<string, Map<string, {
      date: string;
      label: string;
      totalOrders: number;
      successfulOrders: number;
      revenue: number;
    }>>();
    const dayFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const dayKey = (date: Date) => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    };
    const ensureDailyRow = (monthKeyValue: string, date: Date) => {
      let days = dailyByMonth.get(monthKeyValue);
      if (!days) {
        days = new Map();
        dailyByMonth.set(monthKeyValue, days);
      }
      const dateKey = dayKey(date);
      let day = days.get(dateKey);
      if (!day) {
        day = {
          date: dateKey,
          label: dayFormatter.format(date),
          totalOrders: 0,
          successfulOrders: 0,
          revenue: 0,
        };
        days.set(dateKey, day);
      }
      return day;
    };
    for (const row of rows) {
      const createdAt = new Date(row.createdAt);
      const createdMonth = monthlyByKey.get(monthKey(createdAt));
      if (createdMonth) {
        createdMonth.totalOrders += 1;
        ensureDailyRow(createdMonth.month, createdAt).totalOrders += 1;
      }

      if (row.paymentStatus === "PAID") {
        const paidAt = row.paidAt ? new Date(row.paidAt) : createdAt;
        const paidMonth = monthlyByKey.get(monthKey(paidAt));
        if (paidMonth) {
          paidMonth.successfulOrders += 1;
          paidMonth.revenue += Number(row.amount || 0);
          const paidDay = ensureDailyRow(paidMonth.month, paidAt);
          paidDay.successfulOrders += 1;
          paidDay.revenue += Number(row.amount || 0);
        }
      }
    }
    for (const month of monthlyRevenue) {
      month.dailyRevenue = Array.from(dailyByMonth.get(month.month)?.values() ?? [])
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    res.json({
      totalOrders: rows.length,
      successfulPayments: rows.filter((row) => row.paymentStatus === "PAID").length,
      pendingPayments: rows.filter((row) => row.paymentStatus === "PENDING").length,
      failedPayments: rows.filter((row) => ["FAILED", "EXPIRED", "REFUNDED"].includes(row.paymentStatus)).length,
      totalRevenue: revenue,
      activeWebsites,
      recentOrders: rows.slice(0, 5),
      packageOrderStats: Array.from(packageStats.values()).sort((a, b) => b.totalOrders - a.totalOrders),
      monthlyRevenue,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load order stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/orders/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }
  const row = (await readOrderRows()).find((order) => order.id === id);
  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(row);
});

router.get("/admin/customers", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const [users, orders, invitations] = await Promise.all([
      db.select().from(userTable).orderBy(desc(userTable.createdAt)),
      db.select().from(orderTable),
      db.select().from(invitationTable),
    ]);
    const paidInvitationIds = new Set(
      orders
        .filter((order) => order.paymentStatus === "PAID" && order.invitationId !== null)
        .map((order) => order.invitationId as number),
    );
    const result = users
      .filter((user) => user.role !== "admin")
      .map((user) => {
      const userOrders = orders.filter((order) => order.userId === user.id);
      const websites = invitations.filter((invitation) => invitation.userId === user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        totalOrders: userOrders.length,
        totalPaid: userOrders.filter((order) => order.paymentStatus === "PAID")
          .reduce((sum, order) => sum + Number(order.amount || 0), 0),
        websites: websites.map((invitation) => ({
          id: invitation.id,
          token: invitation.token,
          websiteStatus: invitationStatus(invitation, paidInvitationIds.has(invitation.id)),
          brideName: invitation.brideName,
          groomName: invitation.groomName,
        })),
      };
      });
    const search = String(req.query.search ?? "").trim().toLowerCase();
    res.json(search ? result.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(search)) : result);
  } catch (err) {
    req.log.error({ err }, "Failed to list admin customers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/users/:id/role", async (req, res) => {
  if (!adminGuard(req, res)) return;
  const id = Number(req.params.id);
  const role = String(req.body?.role ?? "");
  if (!Number.isInteger(id) || !["buyer", "business_account"].includes(role)) {
    res.status(400).json({ error: "Role must be buyer or business_account" });
    return;
  }
  const [target] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, id))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.role === "admin") {
    res.status(403).json({ error: "Admin accounts cannot be changed here" });
    return;
  }
  const [updated] = await db
    .update(userTable)
    .set({ role })
    .where(eq(userTable.id, id))
    .returning({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role });
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(updated);
});

router.patch("/admin/orders/:id", async (req, res) => {
  if (!adminGuard(req, res)) return;
  const id = Number(req.params.id);
  const status = String(req.body?.paymentStatus ?? "");
  if (!Number.isInteger(id) || !["PAID", "EXPIRED"].includes(status)) {
    res.status(400).json({ error: "paymentStatus must be PAID or EXPIRED" });
    return;
  }
  try {
    const [current] = await db.select().from(orderTable).where(eq(orderTable.id, id)).limit(1);
    if (!current) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const now = new Date();
    const [updated] = await db
      .update(orderTable)
      .set({
        paymentStatus: status,
        paidAt: status === "PAID" ? (current.paidAt ?? now) : current.paidAt,
        updatedAt: now,
      })
      .where(eq(orderTable.id, id))
      .returning();
    if (status === "PAID" && current.invitationId) {
      await db
        .update(invitationTable)
        .set({ isPurchased: true })
        .where(eq(invitationTable.id, current.invitationId));
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to patch order status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/invitations/:id/status", async (req, res) => {
  if (!adminGuard(req, res)) return;
  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "");
  if (!Number.isInteger(id) || !["ACTIVE", "DISABLED"].includes(status)) {
    res.status(400).json({ error: "Invalid invitation status" });
    return;
  }
  const [updated] = await db.update(invitationTable)
    .set({ websiteStatus: status })
    .where(eq(invitationTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  res.json({ id: updated.id, websiteStatus: invitationStatus(updated) });
});

export default router;