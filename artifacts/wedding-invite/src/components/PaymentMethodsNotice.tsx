import { useEffect, useState } from "react";
import { CreditCard, QrCode } from "lucide-react";
import { getToyyibPayAvailability, type ToyyibPayAvailability } from "@/lib/toyyibpay";
import { getPaymentMethodConfig, type PaymentMethodConfig } from "@/lib/billplz";

export default function PaymentMethodsNotice() {
  const [availability, setAvailability] = useState<ToyyibPayAvailability | null>(null);
  const [config, setConfig] = useState<PaymentMethodConfig | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getPaymentMethodConfig().catch(() => null),
      getToyyibPayAvailability().catch(() => null),
    ]).then(([cfg, avail]) => {
      if (!active) return;
      if (cfg) setConfig(cfg);
      if (avail) setAvailability(avail);
    });
    return () => { active = false; };
  }, []);

  const showToyyibPay = config?.toyyibpayEnabled !== false;
  const showBillplz = config?.billplzEnabled === true;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      <span className="font-semibold text-slate-700">Payment methods:</span>
      {showToyyibPay && (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium shadow-sm">
            <CreditCard size={13} className="text-slate-500" /> FPX (ToyyibPay)
          </span>
          {availability?.duitNowQr && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              <QrCode size={13} /> DuitNow QR
            </span>
          )}
        </>
      )}
      {showBillplz && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
          <CreditCard size={13} /> FPX (Billplz)
        </span>
      )}
      {availability?.duitNowQr && showToyyibPay && (
        <span className="basis-full text-[11px] text-slate-500 sm:basis-auto">
          DuitNow QR akan muncul di halaman pembayaran ToyyibPay.
        </span>
      )}
    </div>
  );
}
