import React, { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ShoppingBag, Heart, User, PenLine, Mail, Smartphone, Users } from "lucide-react";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";
import { CardThumbnail } from "@/components/CardThumbnail";
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

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto bg-gray-900 shadow-xl"
      style={{
        width: 90,
        height: 182,
        borderRadius: 18,
        border: "4px solid #1f2937",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
        style={{ width: 26, height: 10, borderRadius: "0 0 8px 8px" }}
      />
      <div
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-white/30 rounded-full"
        style={{ width: 26, height: 3 }}
      />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function MarketingHomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const goToEditor = useCallback((designCode?: string) => {
    const dest = designCode ? `/editor?designCode=${encodeURIComponent(designCode)}` : "/editor";
    if (user) {
      navigate(dest);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(dest)}`);
    }
  }, [user, navigate]);

  const { data: designs = [], isLoading } = useListDesigns();
  const { data: demoInvitation } = useGetInvitation("demo");

  const previewCards = designs.slice(0, 8);

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
                  <IPhoneFrame>
                    {demoInvitation ? (
                      <CardThumbnail invitation={demoInvitation} design={design} containerWidth={82} />
                    ) : (
                      <div className="w-full h-full" style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }} />
                    )}
                  </IPhoneFrame>

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

      {/* ── Features section ── */}
      <section className="bg-gray-50 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left: phone mockup */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate(`/invite/demo?designCode=${encodeURIComponent(designs[0]?.designCode ?? "")}`)}
                className="relative mx-auto bg-gray-900 shadow-2xl cursor-pointer hover:shadow-2xl transition-shadow"
                style={{
                  width: 220,
                  height: 440,
                  borderRadius: 36,
                  border: "6px solid #1f2937",
                  overflow: "hidden",
                }}
                aria-label="Open live demo"
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
                  style={{ width: 80, height: 24, borderRadius: "0 0 16px 16px" }}
                />
                <div className="absolute inset-0">
                  {demoInvitation && designs[0] ? (
                    <CardThumbnail invitation={demoInvitation} design={designs[0]} containerWidth={220} />
                  ) : (
                    <div className="w-full h-full bg-[#f6f1e7]" />
                  )}
                </div>
              </button>
            </div>

            {/* Right: feature list */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-widest text-rose-700 uppercase mb-2">All-in-One</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Digital & Physical Wedding Invitations</h2>
                <p className="mt-3 text-sm text-gray-500 max-w-md">
                  Create beautiful, shareable invitations packed with the features you need to manage your event.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FeatureCard
                  icon={PenLine}
                  title="Personalise Your Message"
                  description="Customise fonts, colours, and text to match your event theme."
                  color="bg-rose-50 text-rose-700"
                />
                <FeatureCard
                  icon={Mail}
                  title="Customise Your Envelope"
                  description="Choose envelope decorations, inner lining, and preferred stamps."
                  color="bg-amber-50 text-amber-700"
                />
                <FeatureCard
                  icon={Smartphone}
                  title="Send via Text or Email"
                  description="Deliver invitations the way your guests like to receive them."
                  color="bg-emerald-50 text-emerald-700"
                />
                <FeatureCard
                  icon={Users}
                  title="Track RSVPs"
                  description="Monitor RSVPs in real-time and follow up with guests."
                  color="bg-sky-50 text-sky-700"
                />
              </div>

              <button
                onClick={() => goToEditor()}
                className="inline-flex items-center gap-2 bg-rose-700 text-white text-xs font-bold tracking-widest px-8 py-3 rounded hover:bg-rose-800 transition-colors"
              >
                PERSONALISE NOW
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} WedInBytes · All rights reserved
      </div>
    </div>
  );
}
