import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, Menu, Heart, X, Loader2 } from "lucide-react";
import desktopHero from "@assets/Screenshot_2026-05-10-16-48-46-99_40deb401b9ffe8e1df2f1cc5ba48_1778402959136.jpg";
import mobileHero from "@assets/Screenshot_2026-05-10-16-48-53-68_40deb401b9ffe8e1df2f1cc5ba48_1778402959164.jpg";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { CardThumbnail } from "@/components/CardThumbnail";

const PAGE_SIZE = 10;

export default function WeddingCardsHomePage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE + 2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-[100dvh] w-full bg-[#f7f2ea] text-[#222]">
      <div className="border-b border-black/5 bg-[#f7f2ea]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f25c4c] text-white">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight sm:text-2xl">WedInBytes</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-black/65">
            <span>Online Invitation</span>
            <span>Digital Card</span>
            <span>Pricing</span>
          </div>
          <button
            type="button"
            className="sm:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white/80 border border-black/10"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-black/8 bg-[#f7f2ea] px-4 py-3 flex flex-col gap-1">
            {["Online Invitation", "Digital Card", "Pricing"].map((item) => (
              <button
                key={item}
                type="button"
                className="text-left w-full px-3 py-3 rounded-xl text-sm text-black/70 hover:bg-black/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </button>
            ))}
            <div className="mt-1 border-t border-black/8 pt-2">
              <button
                type="button"
                className="w-full rounded-full bg-[#222] py-3 text-sm font-medium text-white"
                onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
              >
                Log In
              </button>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 shadow-sm">
            <Search size={18} className="shrink-0 text-black/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search wedding card designs..."
              className="flex-1 bg-transparent text-sm text-[#222] placeholder:text-black/40 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="shrink-0 text-black/40 hover:text-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <img src={mobileHero} alt="Wedding Invitation" className="h-[240px] w-full object-cover sm:hidden" />
        <img src={desktopHero} alt="Wedding Invitation" className="hidden h-[280px] w-full object-cover sm:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#cabf9f]/88 via-[#cabf9f]/55 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl text-white">
              <div className="mb-3 flex items-center gap-1 text-xs font-semibold tracking-wide opacity-90">
                <span>Wedding Invitation</span>
              </div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Wedding Invitation</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90 sm:text-xl">
                Your dream event starts here. Choose the perfect digital invitation design and share it with your guests.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <button className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm shadow-sm">
            <SlidersHorizontal size={18} />
            Filter &amp; Sort
          </button>
          {isSearching && !isLoading && (
            <p className="text-sm text-black/55">
              {filtered.length} results for &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>

        {isLoading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-black/40">
            <Loader2 size={36} className="animate-spin" />
            <p className="text-sm">Loading designs...</p>
          </div>
        )}

        {isError && !isLoading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-black/50">
            <p className="text-base font-medium">Failed to load card designs.</p>
            <p className="text-sm">Please try again in a moment.</p>
          </div>
        )}

        {!isLoading && !isError && visibleCards.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {visibleCards.map((design) => (
              <button
                key={design.id}
                type="button"
                onClick={() => navigate(`/weddingcards/home/${design.id}`)}
                className="group text-left"
              >
                <div className="relative mx-auto w-full max-w-[220px]">
                  <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm bg-[#d8d0be]" />
                  <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-sm bg-[#ede7d8]" />
                  <div className="relative overflow-hidden rounded-sm border border-black/8 bg-white shadow-sm">
                    <div className="aspect-[3/4] bg-[#f6f1e7] relative">
                      {demoInvitation ? (
                        <CardThumbnail invitation={demoInvitation} design={design} />
                      ) : (
                        <div className="absolute inset-0 bg-[#f6f1e7]" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center text-sm text-black/85">{design.name}</div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && !isError && visibleCards.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-black/50">
            <Search size={40} className="opacity-30" />
            <p className="text-base font-medium">No cards found for &ldquo;{query.trim()}&rdquo;</p>
            <p className="text-sm">Try a different search term.</p>
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              className="mt-2 rounded-full border border-black/10 bg-white px-5 py-2 text-sm shadow-sm hover:bg-black/5 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, designs.length))}
              className="inline-flex items-center gap-2 rounded-full bg-[#222] px-5 py-3 text-sm text-white shadow-sm"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
