import { createHash, timingSafeEqual } from "node:crypto";

const SANDBOX_BASE_URL = "https://dev.toyyibpay.com";
const LIVE_BASE_URL = "https://toyyibpay.com";

export type ToyyibPayTransaction = {
  billExternalReferenceNo?: string;
  billpaymentStatus?: string;
  billpaymentAmount?: string;
  billpaymentInvoiceNo?: string;
  billPaymentDate?: string;
  billStatus?: string;
  [key: string]: unknown;
};

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
    throw new Error(`ToyyibPay request failed with status ${response.status}.`);
  }
  return data;
}

export function isToyyibPayConfigured() {
  return Boolean(process.env.TOYYIBPAY_USER_SECRET_KEY?.trim() && process.env.TOYYIBPAY_CATEGORY_CODE?.trim());
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
}) {
  const { userSecretKey, categoryCode, baseUrl } = getConfig();
  const response = await postForm("createBill", {
    userSecretKey,
    categoryCode,
    billName: cleanBillText(input.billName, 30),
    billDescription: cleanBillText(input.billDescription, 100),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(toCents(input.amount)),
    billReturnUrl: getToyyibPayReturnUrl(),
    billCallbackUrl: getToyyibPayCallbackUrl(),
    billExternalReferenceNo: input.externalReference,
    billTo: cleanBillText(input.payerName, 100),
    billEmail: input.payerEmail,
    billPaymentChannel: "2",
    billExpiryDays: "3",
  });

  const bill = Array.isArray(response) ? response[0] as Record<string, unknown> | undefined : undefined;
  const billCode = String(bill?.BillCode ?? bill?.billCode ?? "");
  if (!billCode) {
    throw new Error("ToyyibPay did not return a bill code.");
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
