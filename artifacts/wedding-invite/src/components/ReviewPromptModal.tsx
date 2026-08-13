import { useState } from "react";
import { Star, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LS_KEY = "wedinstudio_reviewed";
const SS_KEY = "wedinstudio_review_dismissed";

export function hasReviewed(): boolean {
  return localStorage.getItem(LS_KEY) === "1";
}

export function hasDismissedThisSession(): boolean {
  return sessionStorage.getItem(SS_KEY) === "1";
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} star`}
        >
          <Star
            size={28}
            className={
              n <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        </button>
      ))}
    </div>
  );
}

interface Props {
  /** Name pre-filled from user account (optional) */
  defaultName?: string;
}

export default function ReviewPromptModal({ defaultName = "" }: Props) {
  const [visible, setVisible] = useState(() => !hasReviewed() && !hasDismissedThisSession());
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ customerName: defaultName, rating: 0, reviewText: "", weddingDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(SS_KEY, "1");
    setVisible(false);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Nama diperlukan.";
    if (form.rating < 1) e.rating = "Sila pilih rating.";
    if (!form.reviewText.trim()) e.reviewText = "Review diperlukan.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          rating: form.rating,
          reviewText: form.reviewText.trim(),
          weddingDate: form.weddingDate.trim() || undefined,
        }),
      });
      if (res.ok) {
        localStorage.setItem(LS_KEY, "1");
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setErrors({ submit: data.error || "Gagal hantar review. Cuba lagi." });
      }
    } catch {
      setErrors({ submit: "Ralat rangkaian. Cuba lagi." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

        {/* Close (dismiss for session) */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {submitted ? (
          /* ── Thank-you state ── */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Star size={28} className="fill-emerald-500 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Terima kasih! 🎉</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Review anda telah dihantar dan sedang dalam semakan. Kami sangat hargai maklum balas anda!
            </p>
            <button
              type="button"
              onClick={() => { localStorage.setItem(LS_KEY, "1"); setVisible(false); }}
              className="mt-6 w-full rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
            >
              Tutup
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Star size={24} className="fill-amber-400 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Kongsi pengalaman anda!</h2>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Pembayaran anda berjaya 🎊 Bantu pasangan lain dengan meninggalkan ulasan ringkas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <StarInput value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
                {errors.rating && <p className="mt-1 text-center text-xs text-red-500">{errors.rating}</p>}
              </div>

              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Nama anda"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-0"
                />
                {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
              </div>

              {/* Review text */}
              <div>
                <textarea
                  rows={3}
                  placeholder="Ceritakan pengalaman anda menggunakan Wedinstudio…"
                  value={form.reviewText}
                  onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-0"
                />
                {errors.reviewText && <p className="mt-1 text-xs text-red-500">{errors.reviewText}</p>}
              </div>

              {/* Wedding date (optional) */}
              <input
                type="text"
                placeholder="Tarikh perkahwinan (contoh: Jun 2025) — pilihan"
                value={form.weddingDate}
                onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-0"
              />

              {errors.submit && <p className="text-center text-xs text-red-500">{errors.submit}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:opacity-80 disabled:opacity-50"
              >
                {submitting ? "Menghantar…" : "Hantar Review"}
              </button>
            </form>

            {/* Soft dismiss */}
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
            >
              Mungkin nanti
            </button>
          </>
        )}
      </div>
    </div>
  );
}
