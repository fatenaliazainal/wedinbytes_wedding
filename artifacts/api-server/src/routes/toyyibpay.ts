import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
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
  isDuitNowQrActivated,
  isValidToyyibPayCallbackHash,
  isToyyibPayConfigured,
} from "../services/toyyibpay";
import { sendPaymentConfirmationEmail, isEmailConfigured } from "../services/email";
import { logger } from "../lib/logger";
import { publicInvitePath } from "../lib/invite-url";

const router: IRouter = Router();
const BILL_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;

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

async function sendPaymentConfirmationEmailForOrder(order: typeof orderTable.$inferSelect) {
  if (!isEmailConfigured()) return;

  const siteBaseUrl = (
    process.env.TOYYIBPAY_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    "https://wedinstudio.replit.app"
  );

  // Fetch invitation token and buyer/owner info in parallel
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

  // Determine the recipient: buyer user or business account owner
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
    siteBaseUrl,
  });
}

async function verifyAndApplyOrder(order: typeof orderTable.$inferSelect, billCode: string) {
  // Fast path: if the callback already marked this order paid, no need to re-query ToyyibPay.
  if (order.paymentStatus === "PAID") {
    return { status: "PAID", updated: false };
  }
  if (order.paymentStatus === "FAILED") {
    return { status: "FAILED", updated: false };
  }

  // ToyyibPay's getBillTransactions returns billpaymentAmount in the same unit we sent
  // (cents via billAmount), NOT ringgit. So we compare Number(billpaymentAmount) directly
  // with toCents(order.amount) rather than calling amountsMatch on both sides.
  function billAmountMatchesOrder(billpaymentAmount: string | undefined) {
    if (!billpaymentAmount || !order.amount) return false;
    try {
      const billCents = Math.round(Number(billpaymentAmount));
      const orderCents = Math.round(Number(order.amount) * 100);
      return Number.isFinite(billCents) && billCents === orderCents;
    } catch {
      return false;
    }
  }

  // Find matching transaction — first by reference + amount, then by reference alone as
  // a fallback (the external reference is our own unique ID so it's safe to match by it).
  function findTransaction(txns: typeof transactions) {
    return (
      txns.find(
        (item) =>
          item.billExternalReferenceNo === order.paymentReference &&
          billAmountMatchesOrder(item.billpaymentAmount),
      ) ??
      txns.find((item) => item.billExternalReferenceNo === order.paymentReference)
    );
  }

  // Try the passed billCode first.
  let transactions = await getToyyibPayTransactions(billCode);
  let transaction = findTransaction(transactions);

  // If no matching transaction and the order has a different canonical billCode stored
  // (e.g. the buyer paid via an older bill that was later superseded), fall back to it.
  if (!transaction && order.billCode && order.billCode !== billCode) {
    transactions = await getToyyibPayTransactions(order.billCode);
    transaction = findTransaction(transactions);
  }

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

  const wasAlreadyPaid = order.paymentStatus === "PAID";

  if (paymentStatus === "PAID" && order.invitationId) {
    await db
      .update(invitationTable)
      .set({ isPurchased: true })
      .where(eq(invitationTable.id, order.invitationId));

    // Send confirmation email only on the first transition to PAID
    if (!wasAlreadyPaid) {
      sendPaymentConfirmationEmailForOrder(order).catch((err) => {
        logger.error({ err, orderId: order.id }, "Failed to send payment confirmation email");
      });
    }
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
      if (existingOrder.paymentStatus === "EXPIRED" || existingOrder.paymentStatus === "FAILED") {
        res.status(409).json({
          error: "This order has expired or failed. Please retry using your invitation instead.",
          retryWithInvitationId: existingOrder.invitationId,
        });
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

    // The dashboard normally sends an invitationId, not an orderId. Reuse the
    // invitation's latest pending order as well, otherwise every Pay Now click
    // would create another order and another ToyyibPay bill.
    //
    // replacedExpired is set to true whenever this request retires an expired
    // order and issues a fresh one. The frontend uses it to show a clear
    // "your previous payment expired, starting a new one" message.
    let replacedExpired = false;

    if (!existingOrder) {
      const [pendingOrder] = await db
        .select()
        .from(orderTable)
        .where(and(
          eq(orderTable.invitationId, invitation.id),
          eq(orderTable.paymentStatus, "PENDING"),
        ))
        .orderBy(desc(orderTable.createdAt))
        .limit(1);
      existingOrder = pendingOrder;
    }

    const orderAge = existingOrder?.billCodeCreatedAt?.getTime() ?? existingOrder?.createdAt?.getTime() ?? 0;
    if (existingOrder && orderAge > 0 && Date.now() - orderAge >= BILL_EXPIRY_MS) {
      await db
        .update(orderTable)
        .set({ paymentStatus: "EXPIRED", updatedAt: new Date() })
        .where(eq(orderTable.id, existingOrder.id));
      existingOrder = undefined;
      replacedExpired = true;
    }

    // If there is no fresh PENDING order to reuse, check whether there are any
    // EXPIRED orders for this invitation so we can tell the buyer their previous
    // attempt had expired.
    if (!existingOrder && !replacedExpired) {
      const [expiredOrder] = await db
        .select({ id: orderTable.id })
        .from(orderTable)
        .where(and(
          eq(orderTable.invitationId, invitation.id),
          eq(orderTable.paymentStatus, "EXPIRED"),
        ))
        .limit(1);
      if (expiredOrder) replacedExpired = true;
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

    // Reuse an existing open bill if one was issued within the last 3 days
    // (billExpiryDays = 3 in createBill calls). This prevents duplicate bills
    // from piling up when a buyer clicks "Pay Now" multiple times.
    if (
      order.billCode &&
      order.billCodeCreatedAt &&
      Date.now() - order.billCodeCreatedAt.getTime() < BILL_EXPIRY_MS
    ) {
      // Verify the stored bill is still accepting payments on ToyyibPay's side.
      // A bill can be settled (paid/failed) or voided even within the 3-day window,
      // for example due to category suspension or account issues. If the bill is no
      // longer open, fall through and create a fresh one so the buyer is never sent
      // to a dead payment URL.
      let billIsOpen = true;
      try {
        const transactions = await getToyyibPayTransactions(order.billCode);
        const isClosed = transactions.some((t) => {
          const s = String(t.billpaymentStatus ?? t.billStatus ?? "");
          return s === "1" || s === "3";
        });
        if (isClosed) billIsOpen = false;
      } catch {
        // If the bill status cannot be verified (network error, invalid bill code,
        // etc.), treat it as closed and issue a fresh bill to avoid sending the
        // buyer to an unreachable payment page.
        billIsOpen = false;
      }

      if (billIsOpen) {
        const { baseUrl } = (function () {
          const sandbox = process.env.TOYYIBPAY_SANDBOX === "true";
          return { baseUrl: sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com" };
        })();
        const paymentUrl = `${baseUrl}/${encodeURIComponent(order.billCode)}`;
        res.status(200).json({ orderId: order.id, paymentUrl, billCode: order.billCode, reused: true, replacedExpired });
        return;
      }
      // Bill is closed — fall through to issue a fresh bill below.
    }

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
        billName: `Wedinbytes ${pkg.name}`,
        billDescription: `${pkg.name} wedding invitation`,
        amount: pkg.price,
        payerName: payer?.name ?? "Wedinbytes customer",
        payerEmail: payer?.email ?? "",
        payerPhone: invitation.contactPhone?.trim() || businessProfile?.phone?.trim() || undefined,
      });

      // Persist the new billCode so future retries can reuse it.
      await db
        .update(orderTable)
        .set({ billCode: bill.billCode, billCodeCreatedAt: new Date(), updatedAt: new Date() })
        .where(eq(orderTable.id, order.id));

      res.status(201).json({ orderId: order.id, paymentUrl: bill.paymentUrl, billCode: bill.billCode, replacedExpired });
    } catch (error) {
      await db.update(orderTable).set({ paymentStatus: "FAILED", updatedAt: new Date() }).where(eq(orderTable.id, order.id));
      throw error;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to create ToyyPay bill");
    res.status(502).json({ error: err instanceof Error ? err.message : "Unable to create ToyyPay bill." });
  }
});

router.get("/payment/toyyibpay/availability", async (req, res) => {
  if (!["buyer", "business_account"].includes(String(req.session?.role ?? "")) || !req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (!isToyyibPayConfigured()) {
    res.status(503).json({ error: "ToyyibPay is not configured." });
    return;
  }

  try {
    res.json({ fpx: true, duitNowQr: await isDuitNowQrActivated() });
  } catch (err) {
    req.log.error({ err }, "Failed to check ToyyibPay payment availability");
    res.status(502).json({ error: "Unable to check ToyyibPay payment availability." });
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

    // The HMAC hash above already authenticates the status field — ToyyibPay's server
    // signed it with our secret key. Trust it directly instead of re-querying
    // getBillTransactions, which can return empty results right after payment.
    const paymentStatus = status === "1" ? "PAID" : status === "3" ? "FAILED" : "PENDING";

    if (paymentStatus === "PENDING") {
      // Unknown status — fall back to transaction lookup
      const result = await verifyAndApplyOrder(order, billCode);
      res.status(result.status === "PAID" || result.status === "FAILED" ? 200 : 202).json(result);
      return;
    }

    const wasAlreadyPaid = order.paymentStatus === "PAID";
    await db.update(orderTable).set({
      paymentStatus,
      paymentGateway: "toyyibpay",
      gatewayRefNo: refno.trim() || order.gatewayRefNo,
      paidAt: paymentStatus === "PAID" ? (order.paidAt ?? new Date()) : order.paidAt,
      billCode: billCode || order.billCode,
      updatedAt: new Date(),
    }).where(eq(orderTable.id, order.id));

    if (paymentStatus === "PAID" && order.invitationId) {
      await db.update(invitationTable).set({ isPurchased: true }).where(eq(invitationTable.id, order.invitationId));
      if (!wasAlreadyPaid) {
        sendPaymentConfirmationEmailForOrder(order).catch((err) => {
          logger.error({ err, orderId: order.id }, "Failed to send payment confirmation email after callback");
        });
      }
    }

    res.status(200).json({ status: paymentStatus, updated: true });
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
  // No session required — the orderReference + billCode pair is unguessable and
  // sufficient to identify the transaction. The actual payment activation happens
  // via the server-to-server callback; this endpoint just returns the current status
  // so the return page can show the buyer a clear result even when the session
  // cookie is absent after the cross-site redirect from ToyyibPay.
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
    res.json(await verifyAndApplyOrder(order, billCode));
  } catch (err) {
    req.log.error({ err }, "Failed to verify ToyyPay return status");
    res.status(502).json({ error: "Unable to verify ToyyPay return status." });
  }
});

export default router;
