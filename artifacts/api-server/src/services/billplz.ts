import { createHmac, timingSafeEqual } from "node:crypto";

const SANDBOX_BASE_URL = "https://www.billplz-sandbox.com/api/v3";
const LIVE_BASE_URL = "https://www.billplz.com/api/v3";

export type BillplzBill = {
  id: string;
  collection_id: string;
  paid: boolean;
  state: "due" | "paid" | "deleted";
  amount: number;
  paid_amount: number;
  due_at: string;
  email: string;
  name: string;
  url: string;
  reference_1?: string;
  reference_1_label?: string;
  [key: string]: unknown;
};

function getConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  const apiKey = (
    isProduction
      ? process.env.BILLPLZ_LIVE_API_KEY ?? process.env.BILLPLZ_API_KEY
      : process.env.BILLPLZ_API_KEY
  )?.trim();

  const xSignatureKey = (
    isProduction
      ? process.env.BILLPLZ_LIVE_X_SIGNATURE_KEY ?? process.env.BILLPLZ_X_SIGNATURE_KEY
      : process.env.BILLPLZ_X_SIGNATURE_KEY
  )?.trim();

  const collectionId = (
    isProduction
      ? process.env.BILLPLZ_LIVE_COLLECTION_ID ?? process.env.BILLPLZ_COLLECTION_ID
      : process.env.BILLPLZ_COLLECTION_ID
  )?.trim();

  if (!apiKey || !xSignatureKey || !collectionId) {
    throw new Error("Billplz is not configured. Add BILLPLZ_API_KEY, BILLPLZ_X_SIGNATURE_KEY, and BILLPLZ_COLLECTION_ID.");
  }

  // BILLPLZ_SANDBOX is only respected outside production to prevent accidental sandbox
  // usage in a production deployment.
  const useSandbox = !isProduction && process.env.BILLPLZ_SANDBOX === "true";

  return {
    apiKey,
    xSignatureKey,
    collectionId,
    baseUrl: useSandbox ? SANDBOX_BASE_URL : LIVE_BASE_URL,
  };
}

export function isBillplzConfigured() {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const key = process.env.BILLPLZ_LIVE_API_KEY?.trim() ?? process.env.BILLPLZ_API_KEY?.trim();
    const sig = process.env.BILLPLZ_LIVE_X_SIGNATURE_KEY?.trim() ?? process.env.BILLPLZ_X_SIGNATURE_KEY?.trim();
    const col = process.env.BILLPLZ_LIVE_COLLECTION_ID?.trim() ?? process.env.BILLPLZ_COLLECTION_ID?.trim();
    return Boolean(key && sig && col);
  }
  return Boolean(
    process.env.BILLPLZ_API_KEY?.trim() &&
    process.env.BILLPLZ_X_SIGNATURE_KEY?.trim() &&
    process.env.BILLPLZ_COLLECTION_ID?.trim(),
  );
}

function publicBaseUrl() {
  if (process.env.NODE_ENV !== "production" && process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`.replace(/\/+$/, "");
  }
  return (
    process.env.BILLPLZ_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    process.env.TOYYIBPAY_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
    "https://wedinstudio.replit.app"
  );
}

function authHeader(apiKey: string) {
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

async function apiRequest(method: "GET" | "POST", path: string, body?: Record<string, string>) {
  const { apiKey, baseUrl } = getConfig();
  const url = `${baseUrl}${path}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: authHeader(apiKey),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body ? { body: new URLSearchParams(body).toString() } : {}),
  };

  const response = await fetch(url, options);
  const text = await response.text();

  if (method === "POST" && path === "/bills") {
    const env = process.env.NODE_ENV ?? "unknown";
    console.error(`[billplz] createBill raw response (env=${env}, status=${response.status}): ${text.slice(0, 300)}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Billplz returned an invalid response for ${path}: ${text.slice(0, 120)}`);
  }

  if (!response.ok) {
    const errorMsg = getBillplzErrorMessage(data);
    throw new Error(`Billplz request failed with status ${response.status}: ${errorMsg}`);
  }

  return data;
}

function getBillplzErrorMessage(data: unknown): string {
  if (typeof data === "string") return data.slice(0, 240);
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const errors = rec["error"];
    if (errors && typeof errors === "object") {
      const msgs = Object.values(errors as Record<string, unknown>)
        .flat()
        .filter((v): v is string => typeof v === "string");
      if (msgs.length) return msgs.join("; ").slice(0, 240);
    }
    for (const key of ["message", "error", "status"]) {
      const v = rec[key];
      if (typeof v === "string") return v.slice(0, 240);
    }
  }
  return "unknown error";
}

export function getBillplzCallbackUrl() {
  return `${publicBaseUrl()}/api/payment/billplz/callback`;
}

export function getBillplzReturnUrl() {
  return `${publicBaseUrl()}/payment/billplz/return`;
}

export async function createBillplzBill(input: {
  externalReference: string;
  description: string;
  amount: string;
  payerName: string;
  payerEmail: string;
}) {
  const { collectionId } = getConfig();

  // Amount is stored as ringgit (e.g. "60"), Billplz expects cents (e.g. 6000)
  const parsed = Number(String(input.amount).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }
  const amountCents = String(Math.round(parsed * 100));

  const data = await apiRequest("POST", "/bills", {
    collection_id: collectionId,
    email: input.payerEmail,
    name: input.payerName.slice(0, 255) || "Wedinstudio Customer",
    amount: amountCents,
    callback_url: getBillplzCallbackUrl(),
    redirect_url: getBillplzReturnUrl(),
    description: input.description.slice(0, 200) || "Wedding Invitation",
    reference_1_label: "Order Reference",
    reference_1: input.externalReference,
  }) as BillplzBill;

  if (!data.id) {
    throw new Error(`Billplz createBill failed: ${getBillplzErrorMessage(data)}`);
  }

  return {
    billId: data.id,
    paymentUrl: data.url,
  };
}

export async function getBillplzBill(billId: string): Promise<BillplzBill> {
  return await apiRequest("GET", `/bills/${encodeURIComponent(billId)}`) as BillplzBill;
}

/**
 * Validate Billplz X-Signature from a callback or redirect.
 *
 * Billplz passes all params as `billplz[key]=value`. The X-Signature is an
 * HMAC-SHA256 over the sorted `key|value` pairs (excluding `billplz[x_signature]`),
 * joined by newlines, computed with the x_signature_key.
 */
export function isValidBillplzSignature(params: Record<string, string>): boolean {
  const isProduction = process.env.NODE_ENV === "production";
  const xSignatureKey = (
    isProduction
      ? process.env.BILLPLZ_LIVE_X_SIGNATURE_KEY ?? process.env.BILLPLZ_X_SIGNATURE_KEY
      : process.env.BILLPLZ_X_SIGNATURE_KEY
  )?.trim();

  if (!xSignatureKey) return false;

  const receivedSignature = params["billplz[x_signature]"];
  if (!receivedSignature) return false;

  // Collect all billplz[...] params except x_signature, sort alphabetically
  const signingPairs = Object.entries(params)
    .filter(([key]) => key.startsWith("billplz[") && key !== "billplz[x_signature]")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}|${value ?? ""}`);

  const signingString = signingPairs.join("\n");

  const expected = createHmac("sha256", xSignatureKey)
    .update(signingString)
    .digest("hex");

  try {
    const receivedBuf = Buffer.from(receivedSignature, "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    return receivedBuf.length === expectedBuf.length && timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function parseBillplzCallbackParams(raw: Record<string, unknown>): Record<string, string> {
  // Normalize: Express may parse `billplz[id]` as `billplz.id` or as a nested object.
  // We accept both flat query-string format (key = "billplz[id]") and
  // nested object format (key = "billplz", value = { id: "..." }).
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "billplz" && value && typeof value === "object") {
      // Nested: { billplz: { id: "x", paid: "true", ... } }
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        out[`billplz[${subKey}]`] = String(subValue ?? "");
      }
    } else if (key.startsWith("billplz[")) {
      out[key] = String(value ?? "");
    }
  }
  return out;
}
