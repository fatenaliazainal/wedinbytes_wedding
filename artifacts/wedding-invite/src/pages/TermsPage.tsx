import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { User, Heart } from "lucide-react";

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

type TermsSection = { title: string; body: string };

export default function TermsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [sections, setSections] = useState<TermsSection[]>([]);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { termsSections?: TermsSection[] } | null) => {
        if (d?.termsSections?.length) setSections(d.termsSections);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel=""
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate(dashboardPathForUser(user))}
              className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Dashboard"
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
          !user && (
            <div className="px-5 py-5">
              <button
                onClick={() => { navigate("/register"); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                SIGN UP FREE
              </button>
            </div>
          )
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-gray-100 bg-[#f9f9f7] px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d5a3e] shadow-sm ring-1 ring-gray-200">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-4 text-xs text-gray-400">Last updated: August 2026</p>
          </div>
        </section>

        {/* Terms body */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          {sections.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading…</p>
          ) : (
            <div className="space-y-8">
              {sections.map(({ title, body }) => (
                <div key={title}>
                  <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600" style={{ whiteSpace: "pre-line" }}>{body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-gray-100 bg-[#f9f9f7] px-5 py-6 text-center">
            <p className="text-sm font-semibold text-gray-900">Questions about our terms?</p>
            <p className="mt-1 text-xs text-gray-500">Reach us directly and we'll get back to you.</p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/601128134211"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                WhatsApp Us →
              </a>
              <a
                href="mailto:support@wedinstudio.com"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Email Us →
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
