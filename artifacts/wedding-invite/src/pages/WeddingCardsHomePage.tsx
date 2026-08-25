import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Search, Heart, X, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useListDesigns } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { CatalogDesignCard } from "@/components/CatalogDesignCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { DESIGN_COLORS, DESIGN_CATEGORIES } from "@/lib/design-filter-constants";
import { usePageMeta } from "@/hooks/usePageMeta";

const CARDS_PER_PAGE = 15;

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
  { label: "HOW TO USE", href: "/how-to-use" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
  { label: "FREEBIES", href: "/freebies" },
];

// ── URL param helpers ──────────────────────────────────────────────────────────

function getParam(name: string): string {
  return typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(name) ?? ""
    : "";
}

export default function WeddingCardsHomePage() {
  usePageMeta({
    title: "Katalog Design Kad Kahwin Digital | Wedinstudio",
    description: "Browse koleksi design kad kahwin digital eksklusif — tema Melayu tradisional, moden minimalist, floral romantik dan lebih banyak lagi. Preview sebelum pilih.",
    canonical: "https://wedinstudio.com/weddingcards/home",
  });
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  // Filter state — initialise from URL so refresh preserves selection
  const [query, setQuery] = useState(() => getParam("search"));
  const [colorFilter, setColorFilter] = useState(() => getParam("color"));
  const [categoryFilter, setCategoryFilter] = useState(() => getParam("category"));
  const [currentPage, setCurrentPage] = useState(1);

  // Sync filters → URL query params (replace, no new history entry)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set("search", query);
    if (colorFilter) sp.set("color", colorFilter);
    if (categoryFilter) sp.set("category", categoryFilter);
    const qs = sp.toString();
    const newSearch = qs ? `?${qs}` : "";
    if (typeof window !== "undefined" && window.location.search !== newSearch) {
      const newUrl = `/weddingcards/home${newSearch}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [query, colorFilter, categoryFilter]);

  // Server-side filtering — only send non-empty params
  const filterParams = useMemo(() => ({
    search: query || undefined,
    color: colorFilter || undefined,
    category: categoryFilter || undefined,
  }), [query, colorFilter, categoryFilter]);

  const { data: designs = [], isLoading, isError } = useListDesigns(filterParams);

  const hasFilters = !!(query || colorFilter || categoryFilter);
  const totalPages = Math.ceil(designs.length / CARDS_PER_PAGE);
  const visibleCards = hasFilters
    ? designs  // show all results when filtering (no paging of filtered results)
    : designs.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);

  function setFilter(key: "query" | "color" | "category", value: string) {
    setCurrentPage(1);
    if (key === "query") setQuery(value);
    else if (key === "color") setColorFilter(value);
    else setCategoryFilter(value);
  }

  function resetFilters() {
    setQuery("");
    setColorFilter("");
    setCategoryFilter("");
    setCurrentPage(1);
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToEditor(designCode?: string) {
    if (designCode) navigate(`/editor?new=1&designCode=${encodeURIComponent(designCode)}`);
    else navigate("/editor?new=1");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="CATALOG"
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

      <div className="bg-white py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Full Collection</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse All Designs</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Find the perfect wedding invitation design and personalise it for your special day.
            </p>
          </div>

          {/* Filter bar */}
          <div className="max-w-2xl mx-auto mb-8 flex flex-col gap-3">
            {/* Search row */}
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Search size={18} className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setFilter("query", e.target.value)}
                placeholder="Search designs..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setFilter("query", "")}
                  className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Color + Category row */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={colorFilter}
                onChange={(e) => setFilter("color", e.target.value)}
                className="flex-1 min-w-[140px] rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#3d5a3e]/30"
              >
                <option value="">All Colors</option>
                {DESIGN_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setFilter("category", e.target.value)}
                className="flex-1 min-w-[140px] rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#3d5a3e]/30"
              >
                <option value="">All Categories</option>
                {DESIGN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {hasFilters && !isLoading && (
            <p className="text-center text-sm text-gray-500 mb-4">
              {designs.length} result{designs.length !== 1 ? "s" : ""} found
            </p>
          )}

          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-gray-500">
              <p className="text-base font-medium">Failed to load card designs.</p>
              <p className="text-sm">Please try again in a moment.</p>
            </div>
          )}

          {!isLoading && !isError && visibleCards.length > 0 && (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleCards.map((design) => (
                <CatalogDesignCard
                  key={design.id}
                  design={design}
                  onPreview={() => navigate(`/invite/demo?designCode=${encodeURIComponent(design.designCode ?? "")}`)}
                  onOrder={() => goToEditor(design.designCode ?? undefined)}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && visibleCards.length === 0 && (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-gray-500">
              <Search size={40} className="opacity-30" />
              <p className="text-base font-medium">No designs found</p>
              {hasFilters && (
                <p className="text-sm">Try adjusting your filters or clearing them to see all designs.</p>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm shadow-sm hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {!hasFilters && totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400">{designs.length} designs available</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                    page === currentPage
                      ? "bg-[#3d5a3e] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />

      <div className="bg-[#2d4330] text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} Wedinstudio · All rights reserved
      </div>
    </div>
  );
}
