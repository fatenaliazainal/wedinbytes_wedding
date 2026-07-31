import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Search, Heart, ShoppingBag, User, X, Menu } from "lucide-react";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { CardThumbnail } from "@/components/CardThumbnail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";

const PAGE_SIZE = 10;

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

function CardPreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-transparent"
      style={{
        flexShrink: 0,
      }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

export default function WeddingCardsHomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE + 2);

  const { data: designs = [], isLoading, isError } = useListDesigns();
  const { data: demoInvitation } = useGetInvitation("demo");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return designs;
    return designs.filter((d) => d.name.toLowerCase().includes(q));
  }, [query, designs]);

  const isSearching = query.trim().length > 0;
  const visibleCards = isSearching ? filtered : filtered.slice(0, visibleCount);
  const hasMore = !isSearching && visibleCount < designs.length;

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE + 2);
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
              onClick={() => navigate("/dashboard")}
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
                className="hidden sm:inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded hover:bg-gray-700 transition-colors tracking-widest"
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
                onClick={() => { navigate("/dashboard"); setNavOpen(false); }}
                className="w-full rounded bg-gray-900 text-white text-sm font-bold py-2.5 tracking-widest"
              >
                GO TO DASHBOARD
              </button>
            </div>
          ) : (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate("/register"); setNavOpen(false); }}
                className="w-full rounded bg-gray-900 text-white text-sm font-bold py-2.5 tracking-widest"
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

          {/* Search bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Search size={18} className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search designs..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {isSearching && !isLoading && (
            <p className="text-center text-sm text-gray-500 mb-4">
              {filtered.length} results for &ldquo;{query.trim()}&rdquo;
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {visibleCards.map((design) => (
                <article
                  key={design.id}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_5px_16px_rgba(31,41,55,0.10)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,41,55,0.16)]"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/invite/demo?designCode=${encodeURIComponent(design.designCode ?? "")}`)}
                    className="block w-full"
                    aria-label={`Open live demo for ${design.name}`}
                  >
                    <CardPreviewFrame>
                      {demoInvitation ? (
                        <CardThumbnail invitation={demoInvitation} design={design} containerWidth={220} />
                      ) : (
                        <div className="w-full h-full" style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }} />
                      )}
                    </CardPreviewFrame>
                  </button>

                  <div className="flex flex-col items-center px-2.5 pb-3 pt-2.5 text-center sm:px-3 sm:pb-4">
                    <p className="mt-1 text-xs font-bold leading-tight text-gray-900 sm:text-sm">{design.name}</p>
                    <p className="mt-1 font-mono text-[9px] font-semibold tracking-wider text-rose-700">
                      WED{String(design.id).padStart(2, "0")}
                    </p>
                    <button
                      type="button"
                      onClick={() => goToEditor(design.designCode ?? undefined)}
                      className="mt-3 w-full rounded-full bg-gray-900 px-2 py-2 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-gray-700"
                    >
                      <ShoppingBag size={11} className="mr-1 inline-block align-[-2px]" />
                      ORDER NOW
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !isError && visibleCards.length === 0 && (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-gray-500">
              <Search size={40} className="opacity-30" />
              <p className="text-base font-medium">No cards found for &ldquo;{query.trim()}&rdquo;</p>
              <p className="text-sm">Try a different search term.</p>
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="mt-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm shadow-sm hover:bg-gray-50 transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, designs.length))}
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-bold tracking-widest px-6 py-3 rounded hover:bg-gray-700 transition-colors"
              >
                LOAD MORE
              </button>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />

      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} WedInBytes · All rights reserved
      </div>
    </div>
  );
}
