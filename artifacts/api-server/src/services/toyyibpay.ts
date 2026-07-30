import { createHash, timingSafeEqual } from "node:crypto";

const SANDBOX_BASE_URL = "https://dev.toyyibpay.com";
const LIVE_BASE_URL = "https://toyyibpay.com";

export type ToyyibPayTransaction = {
  billExternalReferenceNo?: string;
  billpaymentStatus?: string;
  billpaymentAmount?: string;
  billpaymentInvoiceNo?: string;
  billpaymentChannel?: string;
  billPaymentDate?: string;
  billStatus?: string;
  [key: string]: unknown;
};

type DuitNowQrStatusResponse = {
  status?: string;
  duitnowqr_activated?: boolean;
  message?: string;
};

let duitNowQrStatusCache: { activated: boolean; checkedAt: number } | undefined;
const DUITNOW_QR_STATUS_CACHE_MS = 5 * 60 * 1000;

function getConfig() {
  const userSecretKey = process.env.TOYYIBPAY_USER_SECRET_KEY?.trim();
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE?.trim();
  if (!userSecretKey || !categoryCode) {
    throw new Error("ToyyibPay is not configured. Add the user secret key and category code.");
  }

  return {
    userSecretKey,
    categoryCode,
    baseUrl: process.env.TOYYIBPAY_SANDBOX === "true" ? SANDBOX_BASE_URL : LIVE_BASE_URL,
  };
}

function publicBaseUrl() {
  return (
    process.env.TOYYIBPAY_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    "https://wedinstudio.replit.app"
  );
}

function cleanBillText(value: string, maxLength: number) {
  return value.replace(/[^a-zA-Z0-9 _]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength) || "WedInBytes";
}

function toCents(amount: string | number) {
  const parsed = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Payment amount must be greater than zero.");
  return Math.round(parsed * 100);
}

async function postForm(path: string, values: Record<string, string>) {
  const { baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}/index.php/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
  });
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`ToyyibPay returned an invalid response for ${path}.`);
  }
  if (!response.ok) {
    throw new Error(`ToyyibPay request failed with status ${response.status}: ${getToyyibPayResponseMessage(data)}`);
  }
  return data;
}

function getToyyibPayResponseMessage(data: unknown): string {
  if (typeof data === "string") return data.slice(0, 240);
  if (Array.isArray(data)) return data.length ? getToyyibPayResponseMessage(data[0]) : "empty response";
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["message", "error", "errorMessage", "reason", "status"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim().slice(0, 240);
      if (typeof value === "number") return String(value);
    }
    const visibleKeys = Object.keys(record).slice(0, 8);
    return visibleKeys.length ? `response fields: ${visibleKeys.join(", ")}` : "empty response";
  }
  return "empty response";
}

export function isToyyibPayConfigured() {
  return Boolean(process.env.TOYYIBPAY_USER_SECRET_KEY?.trim() && process.env.TOYYIBPAY_CATEGORY_CODE?.trim());
}

export async function isDuitNowQrActivated() {
  const now = Date.now();
  if (duitNowQrStatusCache && now - duitNowQrStatusCache.checkedAt < DUITNOW_QR_STATUS_CACHE_MS) {
    return duitNowQrStatusCache.activated;
  }

  const { userSecretKey } = getConfig();
  const data = await postForm("checkDuitNowQRStatus", { userSecretKey }) as DuitNowQrStatusResponse;
  if (data.status !== "success") {
    throw new Error(`Unable to check DuitNow QR status: ${data.message || "ToyyibPay returned an error."}`);
  }

  const activated = data.duitnowqr_activated === true;
  duitNowQrStatusCache = { activated, checkedAt: now };
  return activated;
}

export function getToyyibPayCallbackUrl() {
  return `${publicBaseUrl()}/api/payment/toyyibpay/callback`;
}

export function getToyyibPayReturnUrl() {
  return `${publicBaseUrl()}/payment/toyyibpay/return`;
}

export async function createToyyibPayBill(input: {
  externalReference: string;
  billName: string;
  billDescription: string;
  amount: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
}) {
  const { userSecretKey, categoryCode, baseUrl } = getConfig();
  let duitNowQrActivated = false;
  try {
    duitNowQrActivated = await isDuitNowQrActivated();
  } catch {
    // DuitNow QR is an optional channel; keep the established FPX checkout available
    // if ToyyibPay's capability check is temporarily unavailable.
  }
  const response = await postForm("createBill", {
    userSecretKey,
    categoryCode,
    billName: cleanBillText(input.billName, 30),
    billDescription: cleanBillText(input.billDescription, 100),
    billPriceSetting: "1",
    billPayorInfo: input.payerPhone?.trim() ? "1" : "0",
    billAmount: String(toCents(input.amount)),
    billReturnUrl: getToyyibPayReturnUrl(),
    billCallbackUrl: getToyyibPayCallbackUrl(),
    billExternalReferenceNo: input.externalReference,
    billTo: cleanBillText(input.payerName, 100),
    billEmail: input.payerEmail,
    billPhone: input.payerPhone?.trim() || "",
    billPaymentChannel: "0",
    billExpiryDays: "3",
    ...(duitNowQrActivated
      ? { enableDuitNowQR: "1", chargeDuitNowQR: "0" }
      : {}),
  });

  const bill = Array.isArray(response) ? response[0] as Record<string, unknown> | undefined : undefined;
  const billCode = String(bill?.BillCode ?? bill?.billCode ?? "");
  if (!billCode) {
    throw new Error(`ToyyibPay createBill failed: ${getToyyibPayResponseMessage(response)}`);
  }

  return {
    billCode,
    paymentUrl: `${baseUrl}/${encodeURIComponent(billCode)}`,
  };
}

export async function getToyyibPayTransactions(billCode: string) {
  const response = await postForm("getBillTransactions", {
    billCode,
  });
  if (!Array.isArray(response)) return [] as ToyyibPayTransaction[];
  return response.filter((item): item is ToyyibPayTransaction => Boolean(item && typeof item === "object"));
}

export function isValidToyyibPayCallbackHash(input: {
  status: string;
  orderId: string;
  refno: string;
  receivedHash: string;
}) {
  const secret = process.env.TOYYIBPAY_USER_SECRET_KEY?.trim();
  if (!secret) return false;
  const expected = createHash("md5")
    .update(`${secret}${input.status}${input.orderId}${input.refno}ok`)
    .digest("hex");
  const received = Buffer.from(input.receivedHash, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export function amountsMatch(left: string | number | undefined, right: string | number | undefined) {
  if (left === undefined || right === undefined) return false;
  try {
    return toCents(String(left)) === toCents(String(right));
  } catch {
    return false;
  }
}
