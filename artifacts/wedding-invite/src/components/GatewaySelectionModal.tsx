import { X } from "lucide-react";

type Gateway = "toyyibpay" | "billplz";

interface Props {
  onSelect: (gateway: Gateway) => void;
  onClose: () => void;
}

function ToyyibPayLogo() {
  return (
    <img src="/toyyibpay-logo.png" alt="ToyyibPay" className="h-8 w-auto object-contain" />
  );
}

function BillplzLogo() {
  return (
    <img src="/billplz-logo.png" alt="Billplz" className="h-8 w-auto object-contain" />
  );
}

export default function GatewaySelectionModal({ onSelect, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Select Payment Method</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose how you'd like to pay</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* ToyyibPay — recommended */}
          <button
            onClick={() => onSelect("toyyibpay")}
            className="flex items-center gap-4 rounded-2xl border-2 border-blue-500 bg-blue-50 px-4 py-3.5 text-left transition-all hover:bg-blue-100 active:scale-[0.98] relative"
          >
            <ToyyibPayLogo />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">ToyyibPay</p>
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide">RECOMMENDED</span>
              </div>
              <p className="text-xs text-slate-500">FPX · DuitNow QR · Online Banking</p>
            </div>
          </button>

          {/* Billplz */}
          <button
            onClick={() => onSelect("billplz")}
            className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-left transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            <BillplzLogo />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Billplz</p>
              <p className="text-xs text-slate-500">FPX · Online Banking</p>
            </div>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Payments are processed securely
        </p>
      </div>
    </div>
  );
}
