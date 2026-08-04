import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Heart, User, Star, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = (hover || value) >= n;
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="p-0.5 focus:outline-none"
          >
            <Star
              size={28}
              className={active ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
            />
          </button>
        );
      })}
    </div>
  );
}

interface Review {
  id: number;
  customerName: string;
  rating: number;
  reviewText: string;
  weddingDate?: string | null;
  status: string;
  createdAt: string;
}

export default function ReviewsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(4.9);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    rating: 0,
    reviewText: "",
    weddingDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${BASE}/api/reviews`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setAverageRating(Number(data.averageRating || 4.9));
          setTotalReviews(data.totalReviews || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function validate() {
    const next: Record<string, string> = {};
    if (!form.customerName.trim()) next.customerName = "Full name is required.";
    if (form.rating < 1 || form.rating > 5) next.rating = "Please select a rating.";
    if (!form.reviewText.trim()) next.reviewText = "Review is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
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
        setSuccess(true);
        setForm({ customerName: "", rating: 0, reviewText: "", weddingDate: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ submit: data.error || "Failed to submit review." });
      }
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="REVIEWS"
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate(dashboardPathForUser(user))}
              className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User size={18} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors tracking-widest"
              >
                LOG IN
              </button>
              <button
                onClick={() => navigate("/register")}
                className="hidden sm:inline-flex items-center gap-1.5 bg-[#3d5a3e] text-white text-xs font-bold px-4 py-2 rounded hover:bg-[#2d4330] transition-colors tracking-widest"
              >
                <Heart size={12} />
                SIGN UP
              </button>
            </>
          )
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={
          user ? (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate(dashboardPathForUser(user)); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                GO TO DASHBOARD
              </button>
            </div>
          ) : (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate("/register"); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                SIGN UP FREE
              </button>
              <button
                onClick={() => { navigate("/login"); setNavOpen(false); }}
                className="w-full rounded border border-gray-200 text-sm font-bold py-2.5 tracking-widest text-gray-600"
              >
                LOG IN
              </button>
            </div>
          )
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white py-10 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Loved by Couples, Made for Memories.
            </h1>
            <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              See what couples have to say about their experience with Wedinstudio.
            </p>
          </div>
        </section>

        {/* Summary */}
        <section className="py-8 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex flex-col items-center gap-2 rounded-2xl bg-white border border-gray-100 shadow-sm px-8 py-6">
              <StarRating rating={5} size={24} />
              <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)} out of 5</p>
              <p className="text-xs text-gray-500">Based on {totalReviews} customer reviews</p>
            </div>
          </div>
        </section>

        {/* Review List */}
        <section className="py-8 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-8">What Couples Say</h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-gray-400" size={28} />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-sm text-gray-500">No reviews yet. Be the first to share your experience!</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col"
                  >
                    <StarRating rating={r.rating} />
                    <p className="mt-4 text-sm text-gray-700 leading-relaxed flex-1">“{r.reviewText}”</p>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{r.customerName}</p>
                      {r.weddingDate && <p className="text-xs text-gray-500 mt-0.5">{r.weddingDate}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Submit Form */}
        <section className="py-10 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Share Your Experience</h2>
              <p className="mt-2 text-sm text-gray-500">We would love to hear about your experience with Wedinstudio.</p>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
              {success ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Thank you for sharing your experience with us!</p>
                  <p className="text-xs text-gray-500 mt-1">Your review has been submitted for approval.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:shadow-sm focus:outline-none focus:ring-0"
                      placeholder="Enter your name"
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    />
                    {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                    <StarInput value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
                    {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Review</label>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:shadow-sm focus:outline-none focus:ring-0 min-h-[120px] resize-y"
                      placeholder="Tell us about your experience..."
                      value={form.reviewText}
                      onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))}
                    />
                    {errors.reviewText && <p className="mt-1 text-xs text-red-600">{errors.reviewText}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Wedding Date <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:shadow-sm focus:outline-none focus:ring-0"
                      placeholder="e.g. 15 January 2026"
                      value={form.weddingDate}
                      onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
                    />
                  </div>

                  {errors.submit && <p className="text-xs text-red-600 text-center">{errors.submit}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#3d5a3e] text-white text-xs font-bold tracking-widest py-3.5 rounded hover:bg-[#2d4330] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <div className="bg-[#2d4330] text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} Wedinstudio · All rights reserved
      </div>
    </div>
  );
}
