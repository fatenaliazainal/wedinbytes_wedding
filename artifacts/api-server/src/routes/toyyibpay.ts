import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  businessProfileTable,
  db,
  invitationTable,
  orderTable,
  pricingPackageTable,
  userTable,
} from "@workspace/db";
import {
  amountsMatch,
  createToyyibPayBill,
  getToyyibPayTransactions,
  isValidToyyibPayCallbackHash,
  isToyyibPayConfigured,
} from "../services/toyyibpay";

const router: IRouter = Router();

function roleOwnsInvitation(
  req: any,
  invitation: typeof invitationTable.$inferSelect,
  businessId?: number,
) {
  if (req.session?.role === "buyer") return invitation.userId === req.session.userId;
  if (req.session?.role === "business_account") return invitation.businessId === businessId;
  return false;
}

async function getBusinessId(userId: number) {
  const [profile] = await db
    .select({ id: businessProfileTable.id })
    .from(businessProfileTable)
    .where(eq(businessProfileTable.userId, userId))
    .limit(1);
  return profile?.id;
}

async function findOwnedOrder(req: any, orderId: number) {
  if (req.session?.role === "buyer") {
    const [order] = await db
      .select()
      .from(orderTable)
      .innerJoin(invitationTable, eq(orderTable.invitationId, invitationTable.id))
      .where(and(eq(orderTable.id, orderId), eq(invitationTable.userId, req.session.userId)))
      .limit(1);
    return order?.order;
  }
  if (req.session?.role === "business_account") {
    const businessId = await getBusinessId(req.session.userId);
    if (!businessId) return undefined;
    const [order] = await db
      .select()
      .from(orderTable)
      .innerJoin(invitationTable, eq(orderTable.invitationId, invitationTable.id))
      .where(and(eq(orderTable.id, orderId), eq(invitationTable.businessId, businessId)))
      .limit(1);
    return order?.order;
  }
  return undefined;
}

async function verifyAndApplyOrder(order: typeof orderTable.$inferSelect, billCode: string) {
  const transactions = await getToyyibPayTransactions(billCode);
  const transaction = transactions.find((item) =>
    item.billExternalReferenceNo === order.paymentReference &&
    amountsMatch(item.billpaymentAmount, order.amount),
  );
  if (!transaction) {
    return { status: "PENDING", updated: false };
  }

  const transactionStatus = String(transaction.billpaymentStatus ?? transaction.billStatus ?? "");
  const paymentStatus = transactionStatus === "1"
    ? "PAID"
    : transactionStatus === "3"
      ? "FAILED"
      : "PENDING";

  const gatewayRefNo = String(transaction.billpaymentInvoiceNo ?? "").trim() || null;

  const [updated] = await db
    .update(orderTable)
    .set({
      paymentStatus,
      paymentGateway: "toyyibpay",
      gatewayRefNo: gatewayRefNo ?? order.gatewayRefNo,
      paidAt: paymentStatus === "PAID" ? (order.paidAt ?? new Date()) : order.paidAt,
      updatedAt: new Date(),
    })
    .where(eq(orderTable.id, order.id))
    .returning();

  if (paymentStatus === "PAID" && order.invitationId) {
    await db
      .update(invitationTable)
      .set({ isPurchased: true })
      .where(eq(invitationTable.id, order.invitationId));
  }

  return { status: paymentStatus, updated: Boolean(updated) };
}

router.post("/payment/toyyibpay/create-bill", async (req, res) => {
  if (!["buyer", "business_account"].includes(String(req.session?.role ?? "")) || !req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (!isToyyibPayConfigured()) {
    res.status(503).json({ error: "ToyyibPay is not configured." });
    return;
  }

  const invitationId = Number(req.body?.invitationId);
  const requestedOrderId = req.body?.orderId === undefined ? null : Number(req.body.orderId);
  if (!Number.isInteger(invitationId) && !Number.isInteger(requestedOrderId)) {
    res.status(400).json({ error: "A valid invitationId or orderId is required." });
    return;
  }

  try {
    let existingOrder: typeof orderTable.$inferSelect | undefined;
    if (Number.isInteger(requestedOrderId)) {
      existingOrder = await findOwnedOrder(req, requestedOrderId as number);
      if (!existingOrder) {
        res.status(404).json({ error: "Order not found." });
        return;
      }
      if (existingOrder.paymentStatus === "PAID") {
        res.status(409).json({ error: "This order has already been paid for." });
        return;
      }
    }

    const resolvedInvitationId = existingOrder?.invitationId ?? invitationId;
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, resolvedInvitationId))
      .limit(1);
    const businessId = req.session.role === "business_account"
      ? await getBusinessId(req.session.userId)
      : undefined;

    if (!invitation || !roleOwnsInvitation(req, invitation, businessId)) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }
    if (invitation.isPurchased) {
      res.status(409).json({ error: "This invitation has already been paid for." });
      return;
    }
    if (!invitation.packageId) {
      res.status(400).json({ error: "This invitation does not have a pricing package." });
      return;
    }

    const [pkg] = await db
      .select()
      .from(pricingPackageTable)
      .where(eq(pricingPackageTable.id, invitation.packageId))
      .limit(1);
    if (!pkg) {
      res.status(400).json({ error: "Pricing package not found." });
      return;
    }

    const externalReference = existingOrder?.paymentReference ||
      `WIB-${invitation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const order = existingOrder ?? (await db
      .insert(orderTable)
      .values({
        userId: req.session.userId,
        invitationId: invitation.id,
        packageId: pkg.id,
        paymentStatus: "PENDING",
        paymentReference: externalReference,
        paymentGateway: "toyyibpay",
        amount: pkg.price,
      })
      .returning())[0];
    if (!order) throw new Error("Failed to create order.");

    try {
      const [payer] = await db
        .select({
          name: userTable.name,
          email: userTable.email,
        })
        .from(userTable)
        .where(eq(userTable.id, req.session.userId))
        .limit(1);
      const [businessProfile] = req.session.role === "business_account"
        ? await db
          .select({ phone: businessProfileTable.phone })
          .from(businessProfileTable)
          .where(eq(businessProfileTable.userId, req.session.userId))
          .limit(1)
        : [];

      const bill = await createToyyibPayBill({
        externalReference,
        billName: `WedInBytes ${pkg.name}`,
        billDescription: `${pkg.name} wedding invitation`,
        amount: pkg.price,
        payerName: payer?.name ?? "WedInBytes customer",
        payerEmail: payer?.email ?? "",
        payerPhone: invitation.contactPhone?.trim() || businessProfile?.phone?.trim() || undefined,
      });
      res.status(201).json({ orderId: order.id, paymentUrl: bill.paymentUrl, billCode: bill.billCode });
    } catch (error) {
      await db.update(orderTable).set({ paymentStatus: "FAILED", updatedAt: new Date() }).where(eq(orderTable.id, order.id));
      throw error;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to create ToyyPay bill");
    res.status(502).json({ error: err instanceof Error ? err.message : "Unable to create ToyyPay bill." });
  }
});

router.post("/payment/toyyibpay/callback", async (req, res) => {
  const status = String(req.body?.status ?? "");
  const orderId = String(req.body?.order_id ?? "");
  const refno = String(req.body?.refno ?? "");
  const receivedHash = String(req.body?.hash ?? "");
  const billCode = String(req.body?.billcode ?? "");

  if (!status || !orderId || !refno || !receivedHash || !billCode || !isValidToyyibPayCallbackHash({ status, orderId, refno, receivedHash })) {
    res.status(400).json({ error: "Invalid ToyyibPay callback." });
    return;
  }
  if (!isToyyibPayConfigured()) {
    res.status(503).json({ error: "ToyyibPay is not configured." });
    return;
  }

  try {
    const [order] = await db.select().from(orderTable).where(eq(orderTable.paymentReference, orderId)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const result = await verifyAndApplyOrder(order, billCode);
    res.status(result.status === "PAID" || result.status === "FAILED" ? 200 : 202).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to process ToyyPay callback");
    res.status(502).json({ error: "Unable to verify ToyyPay callback." });
  }
});

router.get("/payment/toyyibpay/status", async (req, res) => {
  if (!["buyer", "business_account"].includes(String(req.session?.role ?? "")) || !req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const orderId = Number(req.query.orderId);
  const billCode = String(req.query.billCode ?? "").trim();
  if (!Number.isInteger(orderId) || !billCode) {
    res.status(400).json({ error: "orderId and billCode are required." });
    return;
  }

  try {
    const order = await findOwnedOrder(req, orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    if (order.paymentStatus === "PAID") {
      res.json({ status: "PAID" });
      return;
    }
    res.json(await verifyAndApplyOrder(order, billCode));
  } catch (err) {
    req.log.error({ err }, "Failed to verify ToyyPay payment status");
    res.status(502).json({ error: "Unable to verify ToyyPay payment status." });
  }
});

router.get("/payment/toyyibpay/return-status", async (req, res) => {
  if (!["buyer", "business_account"].includes(String(req.session?.role ?? "")) || !req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const orderReference = String(req.query.orderReference ?? "").trim();
  const billCode = String(req.query.billCode ?? "").trim();
  if (!orderReference || !billCode) {
    res.status(400).json({ error: "orderReference and billCode are required." });
    return;
  }

  try {
    const [order] = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.paymentReference, orderReference))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const ownedOrder = await findOwnedOrder(req, order.id);
    if (!ownedOrder) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    res.json(await verifyAndApplyOrder(ownedOrder, billCode));
  } catch (err) {
    req.log.error({ err }, "Failed to verify ToyyPay return status");
    res.status(502).json({ error: "Unable to verify ToyyPay return status." });
  }
});

export default router;
