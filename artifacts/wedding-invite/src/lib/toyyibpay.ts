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

export async function startToyyibPayCheckout(input: {
  invitationId?: number;
  orderId?: number;
}) {
  const response = await fetch(`${BASE}/api/payment/toyyibpay/create-bill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({})) as {
    paymentUrl?: string;
    error?: string;
  };
  if (!response.ok || !data.paymentUrl) {
    throw new Error(data.error || "Unable to start ToyyibPay checkout.");
  }
  window.location.assign(data.paymentUrl);
}
