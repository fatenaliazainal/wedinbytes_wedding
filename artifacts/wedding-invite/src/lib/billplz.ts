const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type PaymentMethodConfig = {
  toyyibpayEnabled: boolean;
  billplzEnabled: boolean;
};

export async function getPaymentMethodConfig(): Promise<PaymentMethodConfig> {
  const response = await fetch(`${BASE}/api/payment/config`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as PaymentMethodConfig & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Unable to load payment configuration.");
  }
  return {
    toyyibpayEnabled: data.toyyibpayEnabled ?? true,
    billplzEnabled: data.billplzEnabled ?? false,
  };
}

export type BillplzCheckoutResult = {
  replacedExpired: boolean;
  paymentUrl: string;
};

export async function startBillplzCheckout(
  input: { invitationId?: number; orderId?: number },
  _depth = 0,
): Promise<BillplzCheckoutResult> {
  const response = await fetch(`${BASE}/api/payment/billplz/create-bill`, {
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

  if (response.status === 409 && data.retryWithInvitationId && _depth === 0) {
    return startBillplzCheckout({ invitationId: data.retryWithInvitationId }, 1);
  }

  if (!response.ok || !data.paymentUrl) {
    throw new Error(data.error || "Unable to start Billplz checkout.");
  }

  const replacedExpired = data.replacedExpired ?? _depth > 0;
  return { replacedExpired, paymentUrl: data.paymentUrl };
}
