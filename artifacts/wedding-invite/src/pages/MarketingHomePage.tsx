import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Gift, Heart, Images, LayoutGrid, MapPin, MessageCircle, Music, Palette, PenLine, Phone, QrCode, Send, Share2, Shirt, Smartphone, Timer, User, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { CardThumbnail } from "@/components/CardThumbnail";
import { CatalogDesignCard } from "@/components/CatalogDesignCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { resolveImageUrl } from "@/lib/r2-url";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { normalizeBusinessHomepageLink } from "@/lib/business-link";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

type Collaboration = {
  businessName: string;
  businessType: string;
  displayName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
};

function businessHomepageLink(business: Collaboration): { url: string; label: string } | null {
  const url = normalizeBusinessHomepageLink(business.website);
  return url ? { url, label: "Homepage link" } : null;
}

const FEATURE_ICONS = [
  { icon: Gift,          label: "Gift Registry" },
  { icon: MessageCircle, label: "Live Wishes" },
  { icon: MapPin,        label: "Google Maps" },
  { icon: CalendarDays,  label: "Add to Calendar" },
  { icon: Timer,         label: "Countdown" },
  { icon: Music,         label: "Background Music" },
  { icon: Images,        label: "Photo Gallery" },
  { icon: Shirt,         label: "Dress Code" },
  { icon: ClipboardList, label: "Event Programme" },
  { icon: BookOpen,      label: "Guestbook" },
  { icon: Phone,         label: "Contact Host" },
  { icon: QrCode,        label: "QR Code" },
] as const;

function FeatureIconStrip() {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {FEATURE_ICONS.map(({ icon: Icon, label }) => {
        const isOpen = activeLabel === label;
        return (
          <div key={label} className="relative">
            <button
              type="button"
              aria-label={label}
              onClick={() => setActiveLabel(isOpen ? null : label)}
              onMouseEnter={() => setActiveLabel(label)}
              onMouseLeave={() => setActiveLabel(null)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition-all ${
                isOpen
                  ? "bg-white ring-gray-200 shadow-md"
                  : "bg-gray-50 ring-gray-200 hover:bg-white hover:shadow-md hover:ring-gray-200"
              } text-gray-600`}
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
            {isOpen && (
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white z-10">
                {label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

  const previewCards = designs.slice(0, 5);
  const logoCollaborations = collaborations.filter((business) => business.logoUrl);
  const [businessSlide, setBusinessSlide] = useState(0);
  const [businessCarouselPaused, setBusinessCarouselPaused] = useState(false);
  const businessSlides = useMemo(() => {
    if (!logoCollaborations.length) return [];
    return Array.from(
      { length: Math.ceil(logoCollaborations.length / 2) },
      (_, index) => logoCollaborations.slice(index * 2, index * 2 + 2),
    );
  }, [logoCollaborations]);

  useEffect(() => {
    setBusinessSlide((current) => Math.min(current, Math.max(0, businessSlides.length - 1)));
  }, [businessSlides.length]);

  useEffect(() => {
    if (businessCarouselPaused || businessSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setBusinessSlide((current) => (current + 1) % businessSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [businessCarouselPaused, businessSlides.length]);

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
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Exclusive Collection</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Love Story, Beautifully Told.</h1>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Create a beautiful wedding website for your special day — effortlessly.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {previewCards.map((design) => (
                <CatalogDesignCard
                  key={design.id}
                  design={design}
                  onPreview={() => navigate(`/invite/demo?designCode=${encodeURIComponent(design.designCode ?? "")}`)}
                  onOrder={() => goToEditor(design.designCode ?? undefined)}
                />
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
              <div className="absolute left-1/2 top-1/2 h-[21rem] w-[17rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100/70 blur-3xl" />
              <button
                type="button"
                onClick={() => navigate(`/invite/demo?designCode=${encodeURIComponent(designs[0]?.designCode ?? "")}`)}
                className="group relative mx-auto cursor-pointer overflow-hidden rounded-[2.5rem] border-[7px] border-gray-900 bg-gray-900 shadow-[0_28px_50px_rgba(31,41,55,0.28)] transition-transform hover:-translate-y-1 lg:mx-0"
                style={{
                  width: 246,
                  height: 492,
                }}
                aria-label="Open live demo"
              >
                {/* Dynamic island / notch */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
                  style={{ width: 84, height: 24, borderRadius: "0 0 16px 16px" }}
                />
                {/*
                  Phone screen: 232 × 478 px (246 outer – 7 px border each side).
                  CardThumbnail at containerWidth=232 renders naturally at 232 × 413 px.
                  Uniform scale = 478 / 413 ≈ 1.157 → fills screen height, no distortion.
                  The invitation's own 28 px internal top padding clears the 24 px notch.
                */}
                <div className="absolute inset-0 overflow-hidden flex items-start justify-center">
                  {demoInvitation && designs[0] ? (
                    <div style={{ width: 232, height: 413, transform: "scale(1.157)", transformOrigin: "top center", flexShrink: 0, position: "relative" }}>
                      <CardThumbnail invitation={demoInvitation} design={designs[0]} containerWidth={232} />
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
                <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d5a3e] shadow-sm ring-1 ring-gray-200">
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
                    icon: Palette,
                    title: "Make It Yours",
                    description: "Choose your colours, fonts and wording to match your celebration.",
                  },
                  {
                    icon: UserCheck,
                    title: "See Who's Coming",
                    description: "Keep track of who's attending, all in one place.",
                  },
                  {
                    icon: Share2,
                    title: "Share in Seconds",
                    description: "Send your invitation to family and friends with just one link.",
                  },
                ].map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className={`border-gray-200 py-1 sm:px-5 ${index > 0 ? "border-t pt-5 sm:border-l sm:border-t-0 sm:pt-1" : "sm:pl-0"}`}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#3d5a3e] shadow-md">
                      <Icon size={19} strokeWidth={1.8} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">{description}</p>
                  </div>
                ))}
              </div>

              {/* ── Feature icon strip ── */}
              <FeatureIconStrip />

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => goToEditor()}
                  className="inline-flex items-center gap-2 rounded bg-[#3d5a3e] px-6 py-3.5 text-xs font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330]"
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

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-gray-100 bg-white/70 px-4 py-4 text-xs text-gray-600 sm:px-5">
                <span className="inline-flex items-center gap-2">
                  <LayoutGrid size={15} className="text-[#3d5a3e]" />
                  Everything in one place
                </span>
                <span className="hidden h-4 w-px bg-gray-200 sm:block" />
                <span className="inline-flex items-center gap-2">
                  <PenLine size={15} className="text-[#3d5a3e]" />
                  Update anytime
                </span>
                <span className="hidden h-4 w-px bg-gray-200 sm:block" />
                <span className="inline-flex items-center gap-2">
                  <Send size={15} className="text-[#3d5a3e]" />
                  Share in seconds
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── More Than Just an Invitation ── HIDDEN TEMPORARILY
      <section className="bg-white py-20 px-4 sm:px-6 border-t border-gray-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">More Than Just an Invitation</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">Everything your celebration needs, thoughtfully built in.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Gift,          name: "Gift Registry",     desc: "Help guests give meaningful gifts." },
              { icon: MessageCircle, name: "Live Wishes",       desc: "Receive real-time wishes from guests." },
              { icon: MapPin,        name: "Google Maps",       desc: "Guide your guests with ease." },
              { icon: CalendarDays,  name: "Add to Calendar",   desc: "One tap to save your special day." },
              { icon: Timer,         name: "Countdown",         desc: "Build excitement up to the big day." },
              { icon: Music,         name: "Background Music",  desc: "Set the mood with your favourite track." },
              { icon: Images,        name: "Photo Gallery",     desc: "Share beautiful moments together." },
              { icon: Shirt,         name: "Dress Code",        desc: "Help guests know what to wear." },
              { icon: ClipboardList, name: "Event Programme",   desc: "Keep your guests in the loop." },
              { icon: BookOpen,      name: "Guestbook",         desc: "Collect messages and memories." },
              { icon: Phone,         name: "Contact Host",      desc: "Guests can reach out to the host easily." },
              { icon: QrCode,        name: "QR Code",           desc: "Share or print with a scan." },
            ].map(({ icon: Icon, name, desc }) => (
              <div key={name} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-200 text-[#3d5a3e]">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      ── */}

      {/* ── Video Invitations promo ── */}
      <section className="bg-[#2d4330] py-20 px-4 sm:px-6 overflow-hidden">
        <div className="mx-auto max-w-4xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">

            {/* Left: text + CTA */}
            <div className="text-center lg:text-left">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 mb-6">SOMETHING DIFFERENT</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-white mb-6">
                Prefer Something a Little More Animated?
              </h2>
              <p className="text-sm leading-7 text-white/60 max-w-md mx-auto lg:mx-0 mb-4">
                Not every invitation has to be a website.
              </p>
              <p className="text-sm leading-7 text-white/60 max-w-md mx-auto lg:mx-0 mb-10">
                Discover beautifully crafted <span className="text-white font-semibold">Video Invitations</span> designed to turn your invitation into a shareable experience.
              </p>
              <a
                href="https://wedinbytes.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#3d5a3e] text-white text-xs font-bold px-7 py-3.5 rounded hover:bg-[#4a6e4b] transition-colors tracking-widest"
              >
                DISCOVER THE COLLECTION →
              </a>
            </div>

            {/* Right: phone mockup with looping video */}
            <div className="flex justify-center">
              {/* Soft glow behind the phone */}
              <div className="relative">
                <div className="absolute left-1/2 top-1/2 h-[26rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3d5a3e]/40 blur-3xl pointer-events-none" />
                <div
                  className="relative overflow-hidden rounded-[2.5rem] border-[7px] border-gray-900 bg-gray-900 shadow-[0_28px_56px_rgba(0,0,0,0.55)]"
                  style={{ width: 246, height: 492 }}
                >
                  {/* Notch */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
                    style={{ width: 84, height: 24, borderRadius: "0 0 16px 16px" }}
                  />
                  {/* Video — autoplay, loop, muted */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    src={resolveImageUrl("DisplayWebsiteMockup/DIGITAL_INVITATION.mp4")}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="collaborations" className="bg-white py-16 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-9">
            <p className="text-xs font-semibold tracking-widest text-[#3d5a3e] uppercase mb-2">Our Network</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Collaborations & Businesses</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">Meet the talented businesses creating beautiful celebrations with Wedinstudio.</p>
          </div>
          {logoCollaborations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">Our collaboration partners will appear here soon.</div>
          ) : (
            <div
              className="relative mx-auto max-w-2xl"
              onMouseEnter={() => setBusinessCarouselPaused(true)}
              onMouseLeave={() => setBusinessCarouselPaused(false)}
              onFocus={() => setBusinessCarouselPaused(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setBusinessCarouselPaused(false);
                }
              }}
            >
              <div className="overflow-hidden px-1 py-1">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${businessSlide * 100}%)` }}
                >
                  {businessSlides.map((slide, slideIndex) => (
                    <div
                      key={slideIndex}
                      className="grid w-full shrink-0 grid-cols-2 gap-4 px-1"
                      aria-hidden={businessSlide !== slideIndex}
                    >
                      {slide.map((business) => {
                        const businessLink = businessHomepageLink(business);
                        const logoImg = (
                          <img
                            src={resolveImageUrl(business.logoUrl ?? "")}
                            alt={`${business.businessName} logo`}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        );
                        return businessLink ? (
                          <a
                            key={business.slug}
                            href={businessLink.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Visit ${business.businessName} homepage`}
                            title={business.businessName}
                            className="relative flex aspect-square items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-white hover:shadow-md focus:outline-none focus:shadow-md"
                          >
                            {logoImg}
                          </a>
                        ) : (
                          <div
                            key={business.slug}
                            title={business.businessName}
                            className="relative flex aspect-square items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4"
                          >
                            {logoImg}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {businessSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setBusinessSlide((current) => (current - 1 + businessSlides.length) % businessSlides.length)}
                    className="absolute left-0 top-1/2 inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:text-gray-900 focus:outline-none focus:shadow-md"
                    aria-label="Previous businesses"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessSlide((current) => (current + 1) % businessSlides.length)}
                    className="absolute right-0 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:text-gray-900 focus:outline-none focus:shadow-md"
                    aria-label="Next businesses"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Business carousel pages">
                    {businessSlides.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        role="tab"
                        aria-selected={businessSlide === index}
                        aria-label={`Show business page ${index + 1}`}
                        onClick={() => setBusinessSlide(index)}
                        className={`h-1.5 rounded-full transition-all ${businessSlide === index ? "w-6 bg-[#3d5a3e]" : "w-1.5 bg-gray-300 hover:bg-gray-500"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />

      <div className="bg-[#2d4330] text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} Wedinstudio · All rights reserved
      </div>
    </div>
  );
}
