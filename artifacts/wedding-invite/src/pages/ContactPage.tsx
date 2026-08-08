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

      <main className="flex-1 bg-[#f9f9f7]">
        <section className="mx-auto max-w-2xl px-6 py-20 sm:py-28">

          {/* Title */}
          <h1 className="mb-10 text-center font-serif text-3xl font-bold tracking-widest text-gray-900 sm:text-4xl">
            CONTACT US
          </h1>

          {/* Info block */}
          <div className="text-sm leading-7 text-gray-800">

            {/* HQ heading */}
            <p className="mb-4 font-bold text-gray-900">WEDINBYTES ENTERPRISE (IP0629841-X)</p>

            {/* Spacer */}
            <div className="mt-5" />

            {/* WhatsApp */}
            <p>
              WHATSAPP:{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-700 hover:text-[#3d5a3e] hover:underline"
              >
                +{WHATSAPP_NUMBER}
              </a>
            </p>

            {/* Email */}
            <p className="italic">
              EMAIL:{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-gray-700 hover:text-[#3d5a3e] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>

            {/* Spacer */}
            <div className="mt-5" />

            {/* Working hours */}
            <p className="font-bold text-gray-900">WORKING HOURS:</p>
            <p>Isnin – Jumaat: 9:00pg – 6:00ptg</p>
            <p>Sabtu – Ahad: Closed</p>
            <p>Cuti Umum: Closed</p>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
