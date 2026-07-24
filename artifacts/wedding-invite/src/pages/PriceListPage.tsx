import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Heart,
  User,
  ChevronRight,
  Check,
  Minus,
  Sparkles,
  ArrowRight,
  MessageSquareHeart,
  Phone,
  MapPin,
  CalendarDays,
  Timer,
  Music,
  Images,
  Gift,
  Shirt,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

const STANDARD_FEATURES = [
  { icon: MessageSquareHeart, label: "RSVP / Wishes" },
  { icon: Phone, label: "Contact" },
  { icon: MapPin, label: "Location & Navigation" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Timer, label: "Countdown" },
  { icon: Music, label: "Background Music" },
];

const PREMIUM_FEATURES = [
  ...STANDARD_FEATURES,
  { icon: Images, label: "Photo Gallery" },
  { icon: Gift, label: "Money Gift" },
  { icon: Shirt, label: "Dress Code" },
];

const COMPARISON = [
  { feature: "RSVP / Wishes", standard: true, premium: true },
  { feature: "Contact", standard: true, premium: true },
  { feature: "Location & Navigation", standard: true, premium: true },
  { feature: "Calendar", standard: true, premium: true },
  { feature: "Countdown", standard: true, premium: true },
  { feature: "Background Music", standard: true, premium: true },
  { feature: "Photo Gallery", standard: false, premium: true },
  { feature: "Money Gift", standard: false, premium: true },
  { feature: "Dress Code", standard: false, premium: true },
];

function PricingCard({
  name,
  price,
  description,
  features,
  badge,
  highlighted = false,
  onChoose,
}: {
  name: string;
  price: string;
  description: string;
  features: { icon: React.ElementType; label: string }[];
  badge?: string;
  highlighted?: boolean;
  onChoose: () => void;
}) {
  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl p-6 transition-all duration-300 ${
        highlighted
          ? "bg-white border-2 border-rose-200 shadow-xl shadow-rose-100/60"
          : "bg-white border border-gray-100 shadow-lg hover:shadow-xl"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-sm">
            <Sparkles size={10} />
            {badge}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">{name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-base font-semibold text-gray-900">RM</span>
          <span className="text-4xl font-bold text-gray-900 tracking-tight">{price}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {features.map((item) => (
          <li key={item.label} className="flex items-start gap-3 text-xs text-gray-700">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <Check size={10} strokeWidth={3} />
            </span>
            <span className="flex items-center gap-2">
              <item.icon size={12} className="text-gray-400" />
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
        className={`w-full rounded-xl py-3 text-xs font-bold tracking-widest transition-colors ${
          highlighted
            ? "bg-rose-700 text-white hover:bg-rose-800 shadow-md shadow-rose-200"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
        Choose {name}
      </button>
    </div>
  );
}

export default function PriceListPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  function goToEditor(designCode?: string) {
    const dest = designCode ? `/editor?designCode=${encodeURIComponent(designCode)}` : "/editor";
    if (user) {
      navigate(dest);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(dest)}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="PRICE LIST"
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

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white py-10 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Choose the perfect invitation for your special day.
            </h1>
            <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              Beautiful digital wedding invitations designed to make your special day even more memorable.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-10 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              <PricingCard
                name="Standard"
                price="55"
                description="Everything you need for a beautiful and memorable digital wedding invitation."
                features={STANDARD_FEATURES}
                onChoose={() => goToEditor()}
              />
              <PricingCard
                name="Premium"
                price="65"
                description="A complete digital wedding invitation experience with more ways to personalise and connect with your guests."
                features={PREMIUM_FEATURES}
                badge="More Features"
                highlighted
                onChoose={() => goToEditor()}
              />
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              LIMIT TO:<br />
              2 pairs of brides and grooms<br />
              2 pairs of parents<br />
              LANGUAGE:<br />
              Malay OR English
            </p>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-10 px-4 sm:px-6 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Compare Features</h2>
              <p className="mt-2 text-sm text-gray-500">See what is included in each plan.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 text-xs font-bold tracking-widest text-gray-500 uppercase border-b border-gray-100 bg-gray-50/50">
                <div className="px-4 py-3">Feature</div>
                <div className="px-4 py-3 text-center">Standard</div>
                <div className="px-4 py-3 text-center">Premium</div>
              </div>
              {COMPARISON.map((row) => (
                <div key={row.feature} className="grid grid-cols-3 text-sm border-b border-gray-100 last:border-0">
                  <div className="px-4 py-3.5 text-gray-700 font-medium">{row.feature}</div>
                  <div className="px-4 py-3.5 flex justify-center items-center text-gray-900">
                    {row.standard ? <Check size={16} className="text-rose-600" /> : <Minus size={16} className="text-gray-300" />}
                  </div>
                  <div className="px-4 py-3.5 flex justify-center items-center text-gray-900">
                    {row.premium ? <Check size={16} className="text-rose-600" /> : <Minus size={16} className="text-gray-300" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 sm:px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Ready to create your beautiful digital wedding invitation?
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              Start creating your wedding invitation and share your special day with the people you love.
            </p>
            <button
              onClick={() => goToEditor()}
              className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-bold tracking-widest px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Create Your Invitation
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />

      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} WedInBytes · All rights reserved
      </div>
    </div>
  );
}
