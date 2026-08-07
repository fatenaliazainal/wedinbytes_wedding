const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type ToyyibPayAvailability = {
  fpx: boolean;
  duitNowQr: boolean;
};

export async function getToyyibPayAvailability() {
  const response = await fetch(`${BASE}/api/payment/toyyibpay/availability`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as ToyyibPayAvailability & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Unable to check payment methods.");
  }
  return data;
}

export type ToyyibPayCheckoutResult = {
  /** True when the API created a fresh bill because the buyer's previous order had expired. */
  replacedExpired: boolean;
  /** The ToyyibPay payment URL to redirect the buyer to. */
  paymentUrl: string;
};

/**
 * Initiates a ToyyibPay checkout by creating (or reusing) a bill.
 *
 * Pass `invitationId` to let the server look up or create an order for that
 * invitation.  Pass `orderId` when resuming a specific PENDING order from the
 * payment history list.
 *
 * If the order identified by `orderId` has since expired, the API returns a 409
 * with `retryWithInvitationId`.  This function handles that transparently by
 * retrying with the invitation ID so the buyer always lands on the payment page.
 */
export async function startToyyibPayCheckout(
  input: { invitationId?: number; orderId?: number },
  _depth = 0,
): Promise<ToyyibPayCheckoutResult> {
  const response = await fetch(`${BASE}/api/payment/toyyibpay/create-bill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({})) as {
    paymentUrl?: string;
    error?: string;
    retryWithInvitationId?: number;
    replacedExpired?: boolean;
  };

  // When the order passed via orderId was EXPIRED/FAILED the API signals the
  // client to retry using the invitation instead of the stale order.  We handle
  // this transparently (one level deep) so the buyer is never shown a raw error.
  if (response.status === 409 && data.retryWithInvitationId && _depth === 0) {
    return startToyyibPayCheckout({ invitationId: data.retryWithInvitationId }, 1);
  }

  if (!response.ok || !data.paymentUrl) {
    throw new Error(data.error || "Unable to start ToyyibPay checkout.");
  }

  const replacedExpired = data.replacedExpired ?? _depth > 0;
  // Return the URL rather than navigating here so callers can show notices
  // (e.g. "previous session expired") before the page transitions.
  return { replacedExpired, paymentUrl: data.paymentUrl };
}
