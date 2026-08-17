import { useState } from "react";
import { Star, X } from "lucide-react";
import { hasReviewed, hasDismissedThisSession, markReviewed, markDismissedThisSession } from "@/lib/review-status";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  defaultName?: string;
  onClose?: () => void;
  onReviewed?: () => void;
}

export default function ReviewPromptModal({ defaultName = "", onClose, onReviewed }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ customerName: defaultName, rating: 0, reviewText: "", weddingDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function dismiss() {
    markDismissedThisSession();
    onClose?.();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Name is required.";
    if (form.rating < 1) e.rating = "Please select a rating.";
    if (!form.reviewText.trim()) e.reviewText = "Review is required.";
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
        markReviewed();
        setSubmitted(true);
        onReviewed?.();
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setErrors({ submit: data.error || "Failed to submit review. Please try again." });
      }
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Star size={28} className="fill-emerald-500 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Thank you! 🎉</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Your review has been submitted and is pending approval. We really appreciate your feedback!
            </p>
            <button
              type="button"
              onClick={() => { markReviewed(); onClose?.(); }}
              className="mt-6 w-full rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Star size={24} className="fill-amber-400 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Share your experience!</h2>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Help other couples by leaving a quick review.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <StarInput value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
                {errors.rating && <p className="mt-1 text-center text-xs text-red-500">{errors.rating}</p>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-0"
                />
                {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Tell us about your experience with Wedinstudio…"
                  value={form.reviewText}
                  onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-0"
                />
                {errors.reviewText && <p className="mt-1 text-xs text-red-500">{errors.reviewText}</p>}
              </div>

              <input
                type="text"
                placeholder="Wedding date (e.g. June 2025) — optional"
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
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
