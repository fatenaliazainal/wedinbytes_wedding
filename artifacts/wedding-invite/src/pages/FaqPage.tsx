import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Heart, User, Plus, Minus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const PACKAGE_SUPPORT_WHATSAPP = "https://wa.me/601128134211";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
  { label: "HOW TO USE", href: "/how-to-use" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

type FaqItem     = { question: string; answer: string };
type FaqCategory = { category: string; items: FaqItem[] };

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{question}</span>
        <span className="shrink-0 w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div
        className="overflow-hidden text-sm text-gray-500 leading-relaxed transition-all duration-300"
        style={{ maxHeight: open ? 800 : 0, opacity: open ? 1 : 0, paddingBottom: open ? 20 : 0 }}
      >
        <p style={{ whiteSpace: "pre-line" }}>{answer}</p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  usePageMeta({
    title: "Soalan Lazim (FAQ) Kad Kahwin Digital | Wedinstudio",
    description: "Jawapan kepada soalan-soalan lazim tentang kad kahwin digital Wedinstudio — cara buat, harga, RSVP, editing, tempoh aktif, dan lebih banyak lagi.",
    canonical: "https://wedinstudio.com/faq",
  });
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [faqData, setFaqData] = useState<FaqCategory[]>([]);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { faqItems?: FaqCategory[] } | null) => {
        if (d?.faqItems?.length) setFaqData(d.faqItems);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="FAQs"
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

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white py-6 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Frequently Asked Questions</h1>
            <p className="mt-2 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              Everything you need to know about creating and sharing your digital wedding invitation.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="pt-5 pb-10 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto space-y-6">
            {faqData.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">Loading…</p>
            ) : (
              faqData.map((cat) => (
                <div key={cat.category}>
                  <h2 className="text-xs font-bold tracking-widest text-[#3d5a3e] uppercase mb-3">{cat.category}</h2>
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 sm:px-8">
                    {cat.items.map((faq) => (
                      <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 sm:px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Still have questions?</h2>
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              Contact us directly on WhatsApp — we're available Monday to Saturday.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={PACKAGE_SUPPORT_WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#3d5a3e] text-white text-xs font-bold tracking-widest px-8 py-4 rounded hover:bg-[#2d4330] transition-colors"
              >
                Contact Us on WhatsApp
              </a>
              <button
                onClick={() => navigate("/editor")}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 text-xs font-bold tracking-widest px-8 py-4 rounded hover:bg-gray-50 transition-colors"
              >
                Create My Invitation
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <div className="bg-[#2d4330] text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} Wedinstudio · All rights reserved
      </div>
    </div>
  );
}
