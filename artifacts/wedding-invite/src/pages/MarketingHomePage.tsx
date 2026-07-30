import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ExternalLink, Heart, PenLine, Send, ShoppingBag, Smartphone, User, Users } from "lucide-react";
import { toast } from "sonner";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { CardThumbnail } from "@/components/CardThumbnail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { resolveImageUrl } from "@/lib/r2-url";

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
      className="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-xl bg-transparent shadow-[0_8px_22px_rgba(31,41,55,0.18)] transition-shadow group-hover:shadow-[0_12px_28px_rgba(31,41,55,0.24)]"
      style={{
        flexShrink: 0,
      }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

type Collaboration = {
  businessName: string;
  businessType: string;
  displayName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  instagram?: string | null;
};

export default function MarketingHomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);

  const goToEditor = useCallback((code?: string) => {
    if (code) navigate(`/editor?new=1&designCode=${encodeURIComponent(code)}`);
    else navigate("/editor?new=1");
  }, [navigate]);

  const { data: designs = [], isLoading } = useListDesigns();
  const { data: demoInvitation } = useGetInvitation("demo");

  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/business/collaborations`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setCollaborations(Array.isArray(data) ? data : []))
      .catch(() => setCollaborations([]));
  }, []);

  const previewCards = designs.slice(0, 8);
  const logoCollaborations = collaborations.filter((business) => business.logoUrl);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="HOME"
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
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Exclusive Collection</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Love Story, Beautifully Told.</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Create a beautiful wedding website for your special day — effortlessly.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {previewCards.map((design) => (
                <div key={design.id} className="flex flex-col items-center gap-3">
                  <CardPreviewFrame>
                    {demoInvitation ? (
                      <CardThumbnail invitation={demoInvitation} design={design} containerWidth={220} />
                    ) : (
                      <div className="w-full h-full" style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }} />
                    )}
                  </CardPreviewFrame>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{design.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono tracking-wider">#{String(design.id).padStart(4, "0")}</p>
                  </div>

                  <button
                    onClick={() => goToEditor(design.designCode ?? undefined)}
                    className="flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-bold tracking-widest px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                  >
                    <ShoppingBag size={10} />
                    GET IT NOW
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button onClick={() => navigate("/weddingcards/home")} className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-xs font-bold tracking-widest px-8 py-3 rounded hover:bg-gray-50 transition-colors">
              VIEW ALL CARDS
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── All-in-One section ── */}
      <section id="all-in-one" className="bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.35fr)] lg:gap-16">
            {/* Left: live invitation preview */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="absolute left-1/2 top-1/2 h-[21rem] w-[17rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-100/70 blur-3xl" />
              <button
                type="button"
                onClick={() => navigate(`/invite/demo?designCode=${encodeURIComponent(designs[0]?.designCode ?? "")}`)}
                className="group relative mx-auto cursor-pointer overflow-hidden rounded-[2.5rem] border-[7px] border-gray-900 bg-gray-900 shadow-[0_24px_45px_rgba(31,41,55,0.26)] transition-transform hover:-translate-y-1 lg:mx-0"
                style={{
                  width: 238,
                  height: 470,
                }}
                aria-label="Open live demo"
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
                  style={{ width: 86, height: 26, borderRadius: "0 0 17px 17px" }}
                />
                <div className="absolute inset-0">
                  {demoInvitation && designs[0] ? (
                    <div className="absolute inset-0 flex items-start justify-center overflow-hidden">
                      <div className="mt-1 h-[calc(100%-0.25rem)] w-full origin-top scale-y-[1.58]">
                        <CardThumbnail invitation={demoInvitation} design={designs[0]} containerWidth={224} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#f6f1e7]" />
                  )}
                </div>
              </button>
            </div>

            {/* Right: headline, features and actions */}
            <div className="max-w-3xl">
              <div>
                <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700 shadow-sm ring-1 ring-rose-100">
                  All-in-One
                </p>
                <h2 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl">
                  Beautiful invitations, made effortless.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
                  Create stunning digital invitations with RSVP tracking, guest messages, and everything you need for your celebration — all in one place.
                </p>
              </div>

              <div className="mt-9 grid gap-5 sm:grid-cols-3">
                {[
                  {
                    icon: PenLine,
                    title: "Customise with Ease",
                    description: "Personalise fonts, colours, and wording to match your theme.",
                  },
                  {
                    icon: Users,
                    title: "Track RSVPs Live",
                    description: "Monitor guest responses and manage your event easily.",
                  },
                  {
                    icon: Send,
                    title: "Send Instantly",
                    description: "Share via link, text or email — reach your guests in seconds.",
                  },
                ].map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className={`border-gray-200 py-1 sm:px-5 ${index > 0 ? "border-t pt-5 sm:border-l sm:border-t-0 sm:pt-1" : "sm:pl-0"}`}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-700 shadow-sm ring-1 ring-rose-100">
                      <Icon size={19} strokeWidth={1.8} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">{description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  onClick={() => goToEditor()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3.5 text-xs font-bold tracking-widest text-white transition-colors hover:bg-gray-700"
                >
                  START PERSONALISING
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => navigate(`/invite/demo?designCode=${encodeURIComponent(designs[0]?.designCode ?? "")}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3.5 text-xs font-bold tracking-widest text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  VIEW DEMO
                  <ExternalLink size={14} />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-rose-100 bg-white/70 px-4 py-4 text-xs text-gray-600 sm:px-5">
                <span className="inline-flex items-center gap-2">
                  <Smartphone size={15} className="text-rose-700" />
                  Mobile friendly
                </span>
                <span className="hidden h-4 w-px bg-gray-200 sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Heart size={15} className="text-rose-700" />
                  Made for meaningful moments
                </span>
                <span className="hidden h-4 w-px bg-gray-200 sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Users size={15} className="text-rose-700" />
                  Built for every guest
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-9">
            <p className="text-xs font-semibold tracking-widest text-rose-700 uppercase mb-2">Our Network</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Collaborations & Businesses</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">Meet the talented businesses creating beautiful celebrations with WedInBytes.</p>
          </div>
          {logoCollaborations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">Our collaboration partners will appear here soon.</div>
          ) : (
            <div className="flex gap-4 overflow-x-auto px-1 pb-3 snap-x snap-mandatory scrollbar-thin">
              {logoCollaborations.map((business) => (
                <a
                  key={business.slug}
                  href={`/business/${encodeURIComponent(business.slug)}`}
                  aria-label={`View ${business.businessName} business profile`}
                  title={business.businessName}
                  className="flex h-32 w-44 shrink-0 snap-start items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <img
                    src={resolveImageUrl(business.logoUrl ?? "")}
                    alt={`${business.businessName} logo`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />

      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} WedInBytes · All rights reserved
      </div>
    </div>
  );
}
