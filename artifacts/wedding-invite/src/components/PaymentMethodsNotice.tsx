import { useEffect, useState } from "react";
import { CreditCard, QrCode } from "lucide-react";
import { getToyyibPayAvailability, type ToyyibPayAvailability } from "@/lib/toyyibpay";

export default function PaymentMethodsNotice() {
  const [availability, setAvailability] = useState<ToyyibPayAvailability | null>(null);

  useEffect(() => {
    let active = true;
    void getToyyibPayAvailability()
      .then((data) => {
        if (active) setAvailability(data);
      })
      .catch(() => {
        // Payment can still be started; the server performs the authoritative check.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      <span className="font-semibold text-slate-700">Payment methods:</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">
        <CreditCard size={13} className="text-slate-500" /> FPX
      </span>
      {availability?.duitNowQr && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
          <QrCode size={13} /> DuitNow QR
        </span>
      )}
      {availability?.duitNowQr && (
        <span className="basis-full text-[11px] text-slate-500 sm:basis-auto">
          DuitNow QR akan muncul di halaman pembayaran ToyyibPay.
        </span>
      )}
    </div>
  );
}