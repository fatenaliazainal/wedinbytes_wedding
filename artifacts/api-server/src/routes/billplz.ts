import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  businessProfileTable,
  db,
  invitationTable,
  orderTable,
  paymentMethodConfigTable,
  pricingPackageTable,
  userTable,
} from "@workspace/db";
import {
  createBillplzBill,
  getBillplzBill,
  getBillplzCallbackUrl,
  getBillplzReturnUrl,
  isBillplzConfigured,
  isValidBillplzSignature,
  parseBillplzCallbackParams,
} from "../services/billplz";
import { sendPaymentConfirmationEmail, isEmailConfigured } from "../services/email";
import { logger } from "../lib/logger";
import { publicInvitePath } from "../lib/invite-url";

const router: IRouter = Router();
const BILL_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;

// ─── helpers shared with toyyibpay route ────────────────────────────────────

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

function siteBaseUrl() {
  return (
    process.env.BILLPLZ_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    process.env.TOYYIBPAY_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    "https://wedinstudio.replit.app"
  );
}

async function sendConfirmationEmail(order: typeof orderTable.$inferSelect) {
  if (!isEmailConfigured()) return;

  const [invitationRow, packageRow] = await Promise.all([
    order.invitationId
      ? db
          .select({
            token: invitationTable.token,
            userId: invitationTable.userId,
            businessId: invitationTable.businessId,
            eventDate: invitationTable.eventDate,
            coverGroomName: invitationTable.coverGroomName,
            coverBrideName: invitationTable.coverBrideName,
            groomShortName: invitationTable.groomShortName,
            brideShortName: invitationTable.brideShortName,
            groomName: invitationTable.groomName,
            brideName: invitationTable.brideName,
            groomInitial: invitationTable.groomInitial,
            brideInitial: invitationTable.brideInitial,
          })
          .from(invitationTable)
          .where(eq(invitationTable.id, order.invitationId))
          .limit(1)
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
    order.packageId
      ? db
          .select({ name: pricingPackageTable.name })
          .from(pricingPackageTable)
          .where(eq(pricingPackageTable.id, order.packageId))
          .limit(1)
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
  ]);

  if (!invitationRow?.token) return;

  let recipientUserId: number | null | undefined = order.userId;
  if (!recipientUserId && invitationRow.businessId) {
    const [bp] = await db
      .select({ userId: businessProfileTable.userId })
      .from(businessProfileTable)
      .where(eq(businessProfileTable.id, invitationRow.businessId))
      .limit(1);
    recipientUserId = bp?.userId;
  }
  if (!recipientUserId) return;

  const [user] = await db
    .select({ email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, recipientUserId))
    .limit(1);
  if (!user?.email) return;

  const invitationPath = publicInvitePath(invitationRow);
  await sendPaymentConfirmationEmail({
    recipientEmail: user.email,
    recipientName: user.name,
    paymentReference: order.paymentReference ?? "",
    amount: order.amount,
    packageName: packageRow?.name ?? "Wedding Invitation",
    invitationPath,
    siteBaseUrl: siteBaseUrl(),
  });
}

async function applyBillplzPayment(
  order: typeof orderTable.$inferSelect,
  billId: string,
  paid: boolean,
  paidAmount?: number,
) {
  if (order.paymentStatus === "PAID") return { status: "PAID", updated: false };
  if (order.paymentStatus === "FAILED") return { status: "FAILED", updated: false };

  const paymentStatus = paid ? "PAID" : "FAILED";
  const wasAlreadyPaid = order.paymentStatus === "PAID";

  await db.update(orderTable).set({
    paymentStatus,
    paymentGateway: "billplz",
    billCode: billId || order.billCode,
    gatewayRefNo: billId || order.gatewayRefNo,
    paidAt: paymentStatus === "PAID" ? (order.paidAt ?? new Date()) : order.paidAt,
    updatedAt: new Date(),
  }).where(eq(orderTable.id, order.id));

  if (paymentStatus === "PAID" && order.invitationId) {
    const [inv] = await db.select().from(invitationTable).where(eq(invitationTable.id, order.invitationId)).limit(1);
    const slugSnapshot = inv && !inv.lockedSlug
      ? (() => {
          const slugify = (s: string) =>
            s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const g = slugify(inv.coverGroomName || inv.groomName || "");
          const b = slugify(inv.coverBrideName || inv.brideName || "");
          return g && b ? `${g}-${b}` : null;
        })()
      : null;

    await db
      .update(invitationTable)
      .set({ isPurchased: true, ...(slugSnapshot ? { lockedSlug: slugSnapshot } : {}) })
      .where(eq(invitationTable.id, order.invitationId));

    if (!wasAlreadyPaid) {
      sendConfirmationEmail(order).catch((err) => {
        logger.error({ err, orderId: order.id }, "Failed to send payment confirmation email (Billplz)");
      });
    }
  }

  return { status: paymentStatus, updated: true };
}

async function verifyBillplzAndApply(order: typeof orderTable.$inferSelect, billId: string) {
  if (order.paymentStatus === "PAID") return { status: "PAID", updated: false };
  if (order.paymentStatus === "FAILED") return { status: "FAILED", updated: false };

  let bill;
  try {
    bill = await getBillplzBill(billId);
  } catch {
    return { status: order.paymentStatus ?? "PENDING", updated: false };
  }

  if (bill.state === "paid" || bill.paid === true) {
    return applyBillplzPayment(order, billId, true, bill.paid_amount);
  }
  if (bill.state === "deleted") {
    return applyBillplzPayment(order, billId, false);
  }
  return { status: "PENDING", updated: false };
}

// ─── Payment method config ────────────────────────────────────────────────────

async function getOrCreatePaymentConfig() {
  const [existing] = await db.select().from(paymentMethodConfigTable).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(paymentMethodConfigTable)
    .values({ toyyibpayEnabled: true, billplzEnabled: false })
    .returning();
  return created!;
}

router.get("/payment/config", async (req, res) => {
  // Public endpoint — frontend reads this to know which gateways to show
  try {
    const config = await getOrCreatePaymentConfig();
    res.json({
      toyyibpayEnabled: config.toyyibpayEnabled,
      billplzEnabled: config.billplzEnabled,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load payment method config");
    // Fail open: ToyyibPay on, Billplz off
    res.json({ toyyibpayEnabled: true, billplzEnabled: false });
  }
});

router.patch("/payment/config", async (req, res) => {
  if (req.session?.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }
  const { toyyibpayEnabled, billplzEnabled } = req.body ?? {};
  if (typeof toyyibpayEnabled !== "boolean" && typeof billplzEnabled !== "boolean") {
    res.status(400).json({ error: "Provide toyyibpayEnabled and/or billplzEnabled booleans." });
    return;
  }
  try {
    const config = await getOrCreatePaymentConfig();
    const [updated] = await db
      .update(paymentMethodConfigTable)
      .set({
        ...(typeof toyyibpayEnabled === "boolean" ? { toyyibpayEnabled } : {}),
        ...(typeof billplzEnabled === "boolean" ? { billplzEnabled } : {}),
      })
      .where(eq(paymentMethodConfigTable.id, config.id))
      .returning();
    res.json({
      toyyibpayEnabled: updated!.toyyibpayEnabled,
      billplzEnabled: updated!.billplzEnabled,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update payment method config");
    res.status(500).json({ error: "Failed to update payment method config." });
  }
});

// ─── Billplz create-bill ─────────────────────────────────────────────────────

router.post("/payment/billplz/create-bill", async (req, res) => {
  if (!["buyer", "business_account"].includes(String(req.session?.role ?? "")) || !req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (!isBillplzConfigured()) {
    res.status(503).json({ error: "Billplz is not configured." });
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
      if (!existingOrder) { res.status(404).json({ error: "Order not found." }); return; }
      if (existingOrder.paymentStatus === "PAID") {
        res.status(409).json({ error: "This order has already been paid for." }); return;
      }
      if (existingOrder.paymentStatus === "EXPIRED" || existingOrder.paymentStatus === "FAILED") {
        if (!existingOrder.invitationId) {
          res.status(409).json({ error: "This order has expired and cannot be retried automatically." }); return;
        }
        res.status(409).json({
          error: "This order has expired or failed. Please retry using your invitation instead.",
          retryWithInvitationId: existingOrder.invitationId,
        });
        return;
      }
    }

    const resolvedInvitationId = existingOrder?.invitationId ?? invitationId;
    const [invitation] = await db.select().from(invitationTable).where(eq(invitationTable.id, resolvedInvitationId)).limit(1);
    const businessId = req.session.role === "business_account" ? await getBusinessId(req.session.userId) : undefined;

    if (!invitation || !roleOwnsInvitation(req, invitation, businessId)) {
      res.status(404).json({ error: "Invitation not found." }); return;
    }
    if (invitation.isPurchased) { res.status(409).json({ error: "This invitation has already been paid for." }); return; }
    if (!invitation.packageId) { res.status(400).json({ error: "This invitation does not have a pricing package." }); return; }

    const [pkg] = await db.select().from(pricingPackageTable).where(eq(pricingPackageTable.id, invitation.packageId)).limit(1);
    if (!pkg) { res.status(400).json({ error: "Pricing package not found." }); return; }

    let replacedExpired = false;

    if (!existingOrder) {
      const [pendingOrder] = await db
        .select().from(orderTable)
        .where(and(eq(orderTable.invitationId, invitation.id), eq(orderTable.paymentStatus, "PENDING")))
        .orderBy(desc(orderTable.createdAt)).limit(1);
      existingOrder = pendingOrder;
    }

    const orderAge = existingOrder?.billCodeCreatedAt?.getTime() ?? existingOrder?.createdAt?.getTime() ?? 0;
    if (existingOrder && orderAge > 0 && Date.now() - orderAge >= BILL_EXPIRY_MS) {
      await db.update(orderTable).set({ paymentStatus: "EXPIRED", updatedAt: new Date() }).where(eq(orderTable.id, existingOrder.id));
      existingOrder = undefined;
      replacedExpired = true;
    }

    if (!existingOrder && !replacedExpired) {
      const [expiredOrder] = await db
        .select({ id: orderTable.id }).from(orderTable)
        .where(and(eq(orderTable.invitationId, invitation.id), eq(orderTable.paymentStatus, "EXPIRED"))).limit(1);
      if (expiredOrder) replacedExpired = true;
    }

    const externalReference = existingOrder?.paymentReference ||
      `WIB-${invitation.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // If there is an existing PENDING order with a fresh Billplz bill, reuse its payment URL
    if (
      existingOrder?.billCode &&
      existingOrder.paymentGateway === "billplz" &&
      existingOrder.billCodeCreatedAt &&
      Date.now() - existingOrder.billCodeCreatedAt.getTime() < BILL_EXPIRY_MS
    ) {
      let billIsOpen = true;
      try {
        const bill = await getBillplzBill(existingOrder.billCode);
        if (bill.state === "paid" || bill.state === "deleted") billIsOpen = false;
      } catch {
        res.status(503).json({ error: "Unable to verify your existing payment session. Please wait a moment and try again." });
        return;
      }
      if (billIsOpen) {
        res.status(200).json({ orderId: existingOrder.id, paymentUrl: `https://www.billplz${process.env.BILLPLZ_SANDBOX === "true" && process.env.NODE_ENV !== "production" ? "-sandbox" : ""}.com/bills/${existingOrder.billCode}`, billId: existingOrder.billCode, reused: true, replacedExpired });
        return;
      }
    }

    const order = existingOrder ?? (await db
      .insert(orderTable)
      .values({
        userId: req.session.userId,
        invitationId: invitation.id,
        packageId: pkg.id,
        paymentStatus: "PENDING",
        paymentReference: externalReference,
        paymentGateway: "billplz",
        amount: pkg.price,
      })
      .returning())[0];
    if (!order) throw new Error("Failed to create order.");

    try {
      const [payer] = await db
        .select({ name: userTable.name, email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, req.session.userId))
        .limit(1);

      const bill = await createBillplzBill({
        externalReference,
        description: `${pkg.name} wedding invitation`,
        amount: pkg.price,
        payerName: payer?.name ?? "Wedinstudio Customer",
        payerEmail: payer?.email ?? "",
      });

      await db.update(orderTable).set({
        billCode: bill.billId,
        billCodeCreatedAt: new Date(),
        amount: pkg.price,
        paymentGateway: "billplz",
        updatedAt: new Date(),
      }).where(eq(orderTable.id, order.id));

      res.status(201).json({ orderId: order.id, paymentUrl: bill.paymentUrl, billId: bill.billId, replacedExpired });
    } catch (error) {
      await db.update(orderTable).set({ paymentStatus: "FAILED", updatedAt: new Date() }).where(eq(orderTable.id, order.id));
      throw error;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to create Billplz bill");
    res.status(502).json({ error: err instanceof Error ? err.message : "Unable to create Billplz bill." });
  }
});

// ─── Billplz server-to-server callback ───────────────────────────────────────

router.post("/payment/billplz/callback", async (req, res) => {
  // Billplz sends form-encoded body. Express.urlencoded() must be active.
  const raw = { ...req.body } as Record<string, unknown>;
  const params = parseBillplzCallbackParams(raw);

  if (!isValidBillplzSignature(params)) {
    // Log full params (redacted signature) to help diagnose key mismatches
    const debugParams = { ...params };
    if (debugParams["billplz[x_signature]"]) {
      debugParams["billplz[x_signature]"] = debugParams["billplz[x_signature]"].slice(0, 8) + "…";
    }
    req.log.warn({ debugParams, rawBodyKeys: Object.keys(req.body ?? {}) }, "Billplz callback: invalid X-Signature — check BILLPLZ_X_SIGNATURE_KEY matches the key shown in your Billplz dashboard");
    res.status(400).json({ error: "Invalid Billplz callback signature." });
    return;
  }

  const billId = params["billplz[id]"] ?? "";
  const paidStr = params["billplz[paid]"] ?? "false";
  const orderReference = params["billplz[reference_1]"] ?? "";
  const state = params["billplz[state]"] ?? "";

  if (!billId || !orderReference) {
    res.status(400).json({ error: "Missing required Billplz callback fields." });
    return;
  }

  try {
    const [order] = await db.select().from(orderTable).where(eq(orderTable.paymentReference, orderReference)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found." }); return; }

    const paid = paidStr === "true" || state === "paid";
    const result = await applyBillplzPayment(order, billId, paid);
    res.status(200).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to process Billplz callback");
    res.status(502).json({ error: "Unable to process Billplz callback." });
  }
});

// ─── Billplz status (authenticated, by orderId — mirrors ToyyibPay status endpoint) ───

router.get("/payment/billplz/status", async (req, res) => {
  if (!["buyer", "business_account"].includes(String(req.session?.role ?? "")) || !req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const orderId = Number(req.query.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: "Valid orderId is required." });
    return;
  }
  try {
    const order = await findOwnedOrder(req, orderId);
    if (!order) { res.status(404).json({ error: "Order not found." }); return; }
    if (!order.billCode) {
      res.json({ status: order.paymentStatus ?? "PENDING", updated: false });
      return;
    }
    const result = await verifyBillplzAndApply(order, order.billCode);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to verify Billplz order status");
    res.status(502).json({ error: "Unable to verify Billplz order status." });
  }
});

// ─── Billplz return-status (sessionless, for return page polling) ─────────────

router.get("/payment/billplz/return-status", async (req, res) => {
  const orderReference = String(req.query.orderReference ?? "").trim();
  const billId = String(req.query.billId ?? "").trim();
  if (!orderReference || !billId) {
    res.status(400).json({ error: "orderReference and billId are required." });
    return;
  }

  try {
    const [order] = await db.select().from(orderTable).where(eq(orderTable.paymentReference, orderReference)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found." }); return; }
    res.json(await verifyBillplzAndApply(order, billId));
  } catch (err) {
    req.log.error({ err }, "Failed to verify Billplz return status");
    res.status(502).json({ error: "Unable to verify Billplz return status." });
  }
});

export default router;
