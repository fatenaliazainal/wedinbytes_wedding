import React, { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
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
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useListPricing } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import type { PricingPackage } from "@workspace/api-client-react";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquareHeart,
  Phone,
  MapPin,
  CalendarDays,
  Timer,
  Music,
  Images,
  Gift,
  Shirt,
  Check,
  Minus,
  Sparkles,
};

function resolveIcon(name?: string | null): LucideIcon {
  return ICON_MAP[name ?? ""] ?? Check;
}

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
      className={`relative flex flex-col h-full rounded-2xl p-5 transition-all duration-300 ${
        highlighted
          ? "bg-white border-2 border-rose-200 shadow-xl shadow-rose-100/60"
          : "bg-white border border-gray-100 shadow-lg hover:shadow-xl"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
           <span className="inline-flex items-center gap-1 rounded-full bg-rose-700 px-3 py-0.5 text-[9px] font-bold tracking-widest text-white uppercase shadow-sm">
            <Sparkles size={10} />
            {badge}
          </span>
        </div>
      )}

       <div className="mb-3">
        <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">{name}</h3>
         <div className="mt-1.5 flex items-baseline gap-1">
           <span className="text-sm font-semibold text-gray-900">RM</span>
           <span className="text-3xl font-bold text-gray-900 tracking-tight">{price}</span>
        </div>
         <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">{description}</p>
      </div>

       <ul className="mb-4 flex-1 space-y-1.5">
        {features.map((item) => (
           <li key={item.label} className="flex items-start gap-2 text-[11px] text-gray-700">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
              <Check size={10} strokeWidth={3} />
            </span>
            <span className="flex items-center gap-2">
               <item.icon size={11} className="text-gray-400" />
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
         className={`w-full rounded-lg py-2.5 text-[11px] font-bold tracking-widest transition-colors ${
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
  const { data: packages = [], isLoading, isError } = useListPricing();

  function goToEditor(packageId?: number, designCode?: string) {
    const params = new URLSearchParams();
    if (packageId) params.set("package", String(packageId));
    if (designCode) params.set("designCode", designCode);
    const qs = params.toString();
    navigate(`/editor${qs ? `?${qs}` : ""}`);
  }

  const sortedPackages = [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const packageNames = sortedPackages.map((p) => p.name);
  const featureNames = Array.from(
    new Set(
      sortedPackages.flatMap((pkg) =>
        (pkg.features ?? []).map((f) => f.name)
      )
    )
  );

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
                onClick={() => { navigate(dashboardPathForUser(user)); setNavOpen(false); }}
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
        <section className="bg-white py-5 px-4 sm:px-6 text-center sm:py-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Find the Perfect Plan
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
              Choose the package that best suits your wedding and create a beautiful digital invitation with ease.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-4 px-4 sm:px-6 bg-gray-50 sm:py-5">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Loading packages…</span>
              </div>
            ) : isError ? (
              <div className="py-16 text-center text-sm text-red-500">Failed to load pricing packages. Please refresh.</div>
            ) : sortedPackages.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No pricing packages available.</div>
            ) : (
              <div className={`grid gap-4 lg:gap-5 items-stretch ${sortedPackages.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : "md:grid-cols-2"}`}>
                {sortedPackages.map((pkg) => (
                  <PricingCard
                    key={pkg.id}
                    name={pkg.name}
                    price={pkg.price}
                    description={pkg.description || "Everything you need for a beautiful and memorable digital wedding invitation."}
                    features={(pkg.features ?? []).map((f) => ({ icon: resolveIcon(f.icon), label: f.name }))}
                    badge={pkg.showBadge ? pkg.badgeText : undefined}
                    highlighted={pkg.isFeatured}
                    onChoose={() => goToEditor(pkg.id)}
                  />
                ))}
              </div>
            )}

          </div>
        </section>

        {/* Comparison */}
        <section className="py-10 px-4 sm:px-6 bg-white">
          <div className="w-full mx-auto">
            <div className="max-w-xl mx-auto text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Compare Features</h2>
              <p className="mt-2 text-sm text-gray-500">See what is included in each plan.</p>
            </div>

            {sortedPackages.length > 0 && (
              <div className="w-full lg:w-[800px] lg:max-w-full mx-auto rounded-[16px] border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div
                  className="grid text-[11px] font-bold tracking-widest text-gray-500 uppercase border-b border-gray-100 bg-gray-50/50"
                  style={{ gridTemplateColumns: `1.5fr repeat(${packageNames.length}, 1fr)` }}
                >
                  <div className="px-3.5 py-2">Feature</div>
                  {packageNames.map((name) => (
                    <div key={name} className="px-3.5 py-2 text-center">{name}</div>
                  ))}
                </div>
                {featureNames.map((featureName) => (
                  <div
                    key={featureName}
                    className="grid text-[12px] border-b border-gray-100 last:border-0"
                    style={{ gridTemplateColumns: `1.5fr repeat(${packageNames.length}, 1fr)` }}
                  >
                    <div className="px-3.5 py-2 text-gray-700 font-medium">{featureName}</div>
                    {sortedPackages.map((pkg) => {
                      const hasFeature = (pkg.features ?? []).some((f) => f.name === featureName);
                      return (
                        <div key={pkg.id} className="px-3.5 py-2 flex justify-center items-center text-gray-900">
                          {hasFeature ? <Check size={16} className="text-rose-600" /> : <Minus size={16} className="text-gray-300" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 sm:px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <p className="font-sans text-sm font-normal leading-relaxed text-gray-500 sm:text-base">
              Ready to create your beautiful digital wedding invitation?
            </p>
            <button
              onClick={() => goToEditor()}
              className="mt-7 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gray-900 px-10 py-4 text-sm font-bold tracking-widest text-white transition-colors hover:bg-gray-800 sm:min-w-[370px]"
            >
              Create Your Invitation
              <ArrowRight size={18} />
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
