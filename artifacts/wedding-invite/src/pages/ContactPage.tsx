import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

type ContactInfo = {
  contactWhatsapp: string;
  contactEmail: string;
  contactCompany: string;
  contactRegNo: string;
  contactHours: string;
};

const DEFAULTS: ContactInfo = {
  contactWhatsapp: "601128134211",
  contactEmail:    "wedinbytestudio@gmail.com",
  contactCompany:  "WEDINBYTES ENTERPRISE",
  contactRegNo:    "IP0629841-X",
  contactHours:    "Monday – Friday, 9:00 AM – 6:00 PM",
};

export default function ContactPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [info, setInfo] = useState<ContactInfo>(DEFAULTS);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then(r => r.ok ? r.json() : null)
      .then((d: Partial<ContactInfo> | null) => {
        if (!d) return;
        setInfo({
          contactWhatsapp: d.contactWhatsapp || DEFAULTS.contactWhatsapp,
          contactEmail:    d.contactEmail    || DEFAULTS.contactEmail,
          contactCompany:  d.contactCompany  || DEFAULTS.contactCompany,
          contactRegNo:    d.contactRegNo    || DEFAULTS.contactRegNo,
          contactHours:    d.contactHours    || DEFAULTS.contactHours,
        });
      })
      .catch(() => {});
  }, []);

  // Parse hours into lines for the card
  const hoursLines = info.contactHours.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

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
        {/* Hero */}
        <section className="border-b border-gray-100 bg-[#f9f9f7] px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d5a3e] shadow-sm ring-1 ring-gray-200">
            Contact Us
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            We&apos;re here to help.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Have a question about your invitation, package, or payment? Reach out and our team will get back to you as soon as possible.
          </p>
        </section>

        {/* Contact cards */}
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          {info.contactCompany && (
            <p className="mb-8 text-sm font-semibold text-gray-700">
              {info.contactCompany}
              {info.contactRegNo && (
                <span className="font-normal text-gray-500"> ({info.contactRegNo})</span>
              )}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            {info.contactWhatsapp && (
              <a
                href={`https://wa.me/${info.contactWhatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3d5a3e] shadow-sm">
                  <img src="/icons/whatsapp2.png" alt="WhatsApp" className="h-6 w-6 object-contain brightness-0 invert" />
                </div>
                <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                <p className="mt-1 text-xs text-gray-500">+{info.contactWhatsapp}</p>
                <p className="mt-3 text-xs font-medium text-[#3d5a3e] group-hover:underline">Chat with us →</p>
              </a>
            )}

            {info.contactEmail && (
              <a
                href={`mailto:${info.contactEmail}`}
                className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3d5a3e] shadow-sm">
                  <img src="/icons/email2.png" alt="Email" className="h-6 w-6 object-contain brightness-0 invert" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="mt-1 text-xs text-gray-500">{info.contactEmail}</p>
                <p className="mt-3 text-xs font-medium text-[#3d5a3e] group-hover:underline">Send an email →</p>
              </a>
            )}

            {info.contactHours && (
              <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3d5a3e] shadow-sm">
                  <Clock size={22} strokeWidth={1.8} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Response Time</p>
                {hoursLines.map((line, i) => (
                  <p key={i} className="mt-1 text-xs text-gray-500">{line}</p>
                ))}
              </div>
            )}
          </div>

          {/* FAQ nudge */}
          <div className="mt-10 rounded-2xl border border-gray-100 bg-[#f9f9f7] px-5 py-6">
            <p className="text-sm font-semibold text-gray-900">Looking for quick answers?</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Most questions about packages, payments, and features are already answered in our FAQ.
            </p>
            <button
              onClick={() => navigate("/faq")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Browse FAQ →
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
