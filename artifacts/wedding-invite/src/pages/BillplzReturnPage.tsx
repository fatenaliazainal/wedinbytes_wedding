import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ReviewPromptModal, { hasReviewed, hasDismissedThisSession } from "@/components/ReviewPromptModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 3000;

async function checkStatus(orderReference: string, billId: string): Promise<string> {
  const response = await fetch(
    `${BASE}/api/payment/billplz/return-status?orderReference=${encodeURIComponent(orderReference)}&billId=${encodeURIComponent(billId)}`,
    { credentials: "include", cache: "no-store" },
  );
  const data = await response.json().catch(() => ({})) as { status?: string; error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to verify payment.");
  return data.status === "PAID" ? "PAID" : data.status === "FAILED" ? "FAILED" : "PENDING";
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function BillplzReturnPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "confirming" | "PAID" | "PENDING" | "FAILED">("loading");
  const [message, setMessage] = useState("Checking your payment status…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Billplz passes params as billplz[id], billplz[paid], billplz[x_signature]...
    // We extract what we need for display and polling.
    const billId = params.get("billplz[id]") || params.get("billplz_id") || "";
    const orderReference = params.get("billplz[reference_1]") || params.get("billplz_reference_1") || "";
    const paidParam = params.get("billplz[paid]") || params.get("billplz_paid") || "";

    if (!billId || !orderReference) {
      // Minimal info — show status based on what we got
      setStatus(paidParam === "true" ? "PAID" : paidParam === "false" ? "FAILED" : "PENDING");
      setMessage("Payment reference incomplete. Please check Payment History.");
      return;
    }

    const gatewayClaimsPaid = paidParam === "true";

    (async () => {
      let attempt = 0;
      let lastStatus = "PENDING";

      while (attempt < MAX_RETRIES) {
        try {
          if (attempt > 0) {
            setStatus("confirming");
            setMessage("Confirming payment with our server… please wait.");
            await sleep(RETRY_DELAY_MS);
          }

          lastStatus = await checkStatus(orderReference, billId);

          if (lastStatus === "PAID" || lastStatus === "FAILED") break;
          if (!gatewayClaimsPaid) break;
        } catch {
          lastStatus = "PENDING";
          if (!gatewayClaimsPaid) break;
        }

        attempt++;
      }

      const nextStatus = lastStatus === "PAID" ? "PAID" : lastStatus === "FAILED" ? "FAILED" : "PENDING";
      setStatus(nextStatus);
      setMessage(
        nextStatus === "PAID"
          ? "Payment confirmed. Your invitation is now active."
          : nextStatus === "FAILED"
            ? "The payment was not completed. You can try again from Payment History."
            : gatewayClaimsPaid
              ? "Payment was received but is still being confirmed. Please use the button below to check again, or visit Payment History in a few minutes."
              : "Payment is still being processed. You can check again from Payment History.",
      );
    })();
  }, []);

  const isLoading = status === "loading" || status === "confirming";
  const displayStatus = isLoading ? "loading" : status;

  const Icon =
    displayStatus === "PAID" ? CheckCircle2
    : displayStatus === "FAILED" ? XCircle
    : Loader2;

  const iconClass =
    displayStatus === "PAID" ? "text-emerald-600"
    : displayStatus === "FAILED" ? "text-red-600"
    : "text-amber-600";

  const heading =
    status === "loading" ? "Verifying payment"
    : status === "confirming" ? "Confirming payment…"
    : status === "PAID" ? "Payment successful"
    : status === "FAILED" ? "Payment unsuccessful"
    : "Payment pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {status === "PAID" && <ReviewPromptModal defaultName={user?.name ?? ""} />}
      <section className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
        <Icon className={`mx-auto h-14 w-14 ${iconClass} ${isLoading ? "animate-spin" : ""}`} />
        <h1 className="mt-5 text-2xl font-bold text-slate-900">{heading}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{message}</p>
        {!isLoading && (
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {status === "PENDING" && (
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Check Again
              </button>
            )}
            <Link
              href={user?.role === "business_account" ? "/business/dashboard" : "/dashboard"}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() =>
                navigate(
                  user?.role === "business_account"
                    ? "/business/dashboard?section=paymentHistory"
                    : "/dashboard?section=paymentHistory",
                )
              }
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Payment History
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
