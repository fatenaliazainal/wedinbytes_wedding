import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Heart, User, Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

const REVIEWS_PER_PAGE = 6;

type SortOption = "newest" | "oldest" | "highest" | "lowest";
type FilterRating = 0 | 1 | 2 | 3 | 4 | 5;

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
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

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 2);
  }, [review.reviewText]);

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex flex-col transition-shadow duration-200 hover:shadow-md">
      <StarRating rating={review.rating} size={13} />
      <div className="mt-2.5 flex-1">
        <p
          ref={textRef}
          className={`text-[12px] text-gray-700 leading-relaxed transition-all duration-300 ${
            expanded ? "" : "line-clamp-3"
          }`}
        >
          "{review.reviewText}"
        </p>
        {(isClamped || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-[11px] font-medium text-[#3d5a3e] hover:text-[#2d4330] transition-colors"
          >
            {expanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[12px] font-semibold text-gray-900">{review.customerName}</p>
        {review.weddingDate && (
          <p className="text-[11px] text-gray-400 mt-0.5">{review.weddingDate}</p>
        )}
      </div>
    </div>
  );
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

  // Pagination, sort, filter
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterRating, setFilterRating] = useState<FilterRating>(0);
  const [visible, setVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

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

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (filterRating > 0) list = list.filter((r) => r.rating === filterRating);
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "highest":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        list.sort((a, b) => a.rating - b.rating);
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [reviews, sortBy, filterRating]);

  const totalPages = Math.ceil(filtered.length / REVIEWS_PER_PAGE);
  const start = (currentPage - 1) * REVIEWS_PER_PAGE;
  const end = Math.min(start + REVIEWS_PER_PAGE, filtered.length);
  const pageReviews = filtered.slice(start, end);

  const triggerFade = useCallback(() => {
    setVisible(false);
    setTimeout(() => setVisible(true), 180);
  }, []);

  function handleSort(val: SortOption) {
    setSortBy(val);
    setCurrentPage(1);
    triggerFade();
  }

  function handleFilter(val: FilterRating) {
    setFilterRating(val);
    setCurrentPage(1);
    triggerFade();
  }

  function changePage(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    triggerFade();
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 10);
  }

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

  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
            <h1 className="text-[21px] sm:text-[25px] font-bold text-gray-900 leading-tight">
              Loved by Couples, Made for Memories.
            </h1>
            <p className="mt-4 text-[11px] text-gray-500 max-w-xl mx-auto leading-relaxed">
              See what couples have to say about their experience with Wedinstudio.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-gray-100 shadow-sm px-8 py-5">
              <StarRating rating={5} size={22} />
              <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)} out of 5</p>
              <p className="text-xs text-gray-500">Based on {totalReviews} customer reviews</p>
            </div>
          </div>
        </section>

        {/* Review List */}
        <section ref={gridRef} className="py-8 px-4 sm:px-6 bg-white scroll-mt-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-6">What Couples Say</h2>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-gray-400" size={28} />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No reviews yet. Be the first to share your experience!
              </p>
            ) : (
              <>
                {/* Sort + Filter bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
                  {/* Filter by stars */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {([0, 5, 4, 3, 2, 1] as FilterRating[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleFilter(r)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          filterRating === r
                            ? "bg-[#3d5a3e] text-white border-[#3d5a3e]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#3d5a3e] hover:text-[#3d5a3e]"
                        }`}
                      >
                        {r === 0 ? "All" : `${r} ★`}
                      </button>
                    ))}
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value as SortOption)}
                    className="text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>

                {/* Grid */}
                <div
                  className="grid grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity duration-200"
                  style={{ opacity: visible ? 1 : 0 }}
                >
                  {pageReviews.length === 0 ? (
                    <p className="col-span-full text-center text-sm text-gray-400 py-8">
                      No reviews match this filter.
                    </p>
                  ) : (
                    pageReviews.map((r) => <ReviewCard key={r.id} review={r} />)
                  )}
                </div>

                {/* Count */}
                {filtered.length > 0 && (
                  <p className="text-center text-[11px] text-gray-400 mt-5">
                    Showing {start + 1}–{end} of {filtered.length} review{filtered.length !== 1 ? "s" : ""}
                    {filterRating > 0 ? ` (${filterRating}-star filter)` : ""}
                  </p>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <button
                      type="button"
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>

                    {pageNumbers.map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-[12px] select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => changePage(p as number)}
                          className={`w-8 h-8 rounded-lg text-[12px] font-semibold border transition-colors ${
                            currentPage === p
                              ? "bg-[#3d5a3e] text-white border-[#3d5a3e]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#3d5a3e] hover:text-[#3d5a3e]"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </>
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
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Wedding Date <span className="text-gray-400">(optional)</span>
                    </label>
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
