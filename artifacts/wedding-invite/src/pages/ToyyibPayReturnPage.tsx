import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ToyyibPayReturnPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "PAID" | "PENDING" | "FAILED">("loading");
  const [message, setMessage] = useState("Checking your payment status…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billCode = params.get("billcode") || "";
    const orderReference = params.get("order_id") || "";
    const statusId = params.get("status_id") || "";

    if (!billCode || !orderReference) {
      setStatus(statusId === "1" ? "PAID" : statusId === "3" ? "FAILED" : "PENDING");
      setMessage("ToyyibPay returned without a complete transaction reference. Please check Payment History.");
      return;
    }

    fetch(
      `${BASE}/api/payment/toyyibpay/return-status?orderReference=${encodeURIComponent(orderReference)}&billCode=${encodeURIComponent(billCode)}`,
      { credentials: "include", cache: "no-store" },
    )
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { status?: string; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to verify payment.");
        const nextStatus = data.status === "PAID" ? "PAID" : data.status === "FAILED" ? "FAILED" : "PENDING";
        setStatus(nextStatus);
        setMessage(
          nextStatus === "PAID"
            ? "Payment confirmed. Your invitation is now active."
            : nextStatus === "FAILED"
              ? "The payment was not completed. You can try again from Payment History."
              : "Payment is still being processed. You can check again from Payment History.",
        );
      })
      .catch((error: unknown) => {
        setStatus("PENDING");
        setMessage(error instanceof Error ? error.message : "Unable to verify payment. Please check Payment History.");
      });
  }, []);

  const Icon = status === "PAID" ? CheckCircle2 : status === "FAILED" ? XCircle : status === "PENDING" ? Clock3 : Loader2;
  const iconClass = status === "PAID" ? "text-emerald-600" : status === "FAILED" ? "text-red-600" : "text-amber-600";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
        <Icon className={`mx-auto h-14 w-14 ${iconClass} ${status === "loading" ? "animate-spin" : ""}`} />
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          {status === "loading" ? "Verifying payment" : status === "PAID" ? "Payment successful" : status === "FAILED" ? "Payment unsuccessful" : "Payment pending"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{message}</p>
        {status !== "loading" && (
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Go to Dashboard
            </Link>
            <button onClick={() => navigate("/dashboard")} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              View Payment History
            </button>
          </div>
        )}
      </section>
    </main>
  );
}