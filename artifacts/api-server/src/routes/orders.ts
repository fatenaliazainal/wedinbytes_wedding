import { Router, type IRouter } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import {
  businessProfileTable,
  db,
  invitationTable,
  orderTable,
  pricingPackageTable,
  userTable,
} from "@workspace/db";

const router: IRouter = Router();

function adminGuard(req: any, res: any) {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Admin access only" });
    return false;
  }
  return true;
}

function invitationStatus(invitation: typeof invitationTable.$inferSelect | undefined) {
  if (!invitation) return "DISABLED";
  if (invitation.websiteStatus !== "ACTIVE") return invitation.websiteStatus;
  return invitation.isPurchased ? "ACTIVE" : "PREVIEW";
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
      })
      .from(invitationTable)
      .where(eq(invitationTable.userId, req.session.userId));

    if (!invitations.length) {
      res.json([]);
      return;
    }

    const invitationIds = invitations.map((invitation) => invitation.id);
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

    res.json(orders
      .filter((order) => order.paymentStatus === "PAID")
      .map((order) => {
        const invitation = order.invitationId ? invitationById.get(order.invitationId) : undefined;
        const pkg = order.packageId ? packageById.get(order.packageId) : undefined;
        return {
          id: order.id,
          amount: order.amount,
          paymentStatus: order.paymentStatus,
          paymentReference: order.paymentReference,
          paymentGateway: order.paymentGateway,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
          packageName: pkg?.name ?? null,
          invitation: invitation
            ? { brideName: invitation.brideName, groomName: invitation.groomName }
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
      })
      .from(invitationTable)
      .where(eq(invitationTable.businessId, profile.id));

    if (!invitations.length) {
      res.json([]);
      return;
    }

    const invitationIds = invitations.map((invitation) => invitation.id);
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

    res.json(orders
      .filter((order) => order.paymentStatus === "PAID")
      .map((order) => {
        const invitation = order.invitationId ? invitationById.get(order.invitationId) : undefined;
        const pkg = order.packageId ? packageById.get(order.packageId) : undefined;
        return {
          id: order.id,
          amount: order.amount,
          paymentStatus: order.paymentStatus,
          paymentReference: order.paymentReference,
          paymentGateway: order.paymentGateway,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
          packageName: pkg?.name ?? null,
          invitation: invitation
            ? { brideName: invitation.brideName, groomName: invitation.groomName }
            : null,
        };
      }));
  } catch (err) {
    req.log.error({ err }, "Failed to list business payment history");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function readOrderRows() {
  const [orders, users, invitations, packages] = await Promise.all([
    db.select().from(orderTable).orderBy(desc(orderTable.createdAt)),
    db.select().from(userTable),
    db.select().from(invitationTable),
    db.select().from(pricingPackageTable),
  ]);
  const userById = new Map(users.map((row) => [row.id, row]));
  const invitationById = new Map(invitations.map((row) => [row.id, row]));
  const packageById = new Map(packages.map((row) => [row.id, row]));
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
        venueName: invitation.venueName,
        websiteStatus: invitationStatus(invitation),
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
    const activeWebsites = (await db.select().from(invitationTable))
      .filter((row) => invitationStatus(row) === "ACTIVE").length;
    res.json({
      totalOrders: rows.length,
      successfulPayments: rows.filter((row) => row.paymentStatus === "PAID").length,
      pendingPayments: rows.filter((row) => row.paymentStatus === "PENDING").length,
      failedPayments: rows.filter((row) => ["FAILED", "EXPIRED", "REFUNDED"].includes(row.paymentStatus)).length,
      totalRevenue: revenue,
      activeWebsites,
      recentOrders: rows.slice(0, 5),
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
          websiteStatus: invitationStatus(invitation),
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