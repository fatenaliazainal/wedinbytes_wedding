import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

const WHATSAPP_NUMBER = "601128134211";
const SUPPORT_EMAIL = "wedinbytestudio@gmail.com";

export default function ContactPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel=""
        onMenuClick={() => setDrawerOpen(true)}
        onLogoClick={() => navigate("/")}
        onLoginClick={() => navigate("/login")}
        onDashboardClick={() => navigate(dashboardPathForUser(user))}
        isLoggedIn={!!user}
      />
      <SharedNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={NAV_ITEMS}
        activeLabel=""
        isLoggedIn={!!user}
        onLoginClick={() => { setDrawerOpen(false); navigate("/login"); }}
        onDashboardClick={() => { setDrawerOpen(false); navigate(dashboardPathForUser(user)); }}
      />

      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
          {/* Title */}
          <div className="mb-14 text-center">
            <h1 className="font-serif text-3xl font-normal tracking-widest text-gray-900 sm:text-4xl">
              CONTACT US
            </h1>
            <div className="mx-auto mt-4 h-px w-12 bg-gray-400" />
          </div>

          {/* Info block */}
          <div className="space-y-7 text-sm text-gray-800">
            {/* Company name */}
            <p className="text-base font-bold text-gray-900">
              WEDINBYTES ENTERPRISE&nbsp;
              <span className="font-normal text-gray-500">(IP0629841-X)</span>
            </p>

            {/* WhatsApp */}
            <div>
              <p className="font-bold text-gray-900">Whatsapp Us</p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-block text-gray-700 underline underline-offset-2 hover:text-[#3d5a3e]"
              >
                +{WHATSAPP_NUMBER}
              </a>
            </div>

            {/* Email */}
            <div>
              <p className="font-bold text-gray-900">Email Us</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-0.5 inline-block text-gray-700 underline underline-offset-2 hover:text-[#3d5a3e]"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
