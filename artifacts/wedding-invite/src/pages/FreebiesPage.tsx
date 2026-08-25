import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, Heart, Minus, Plus, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { usePageMeta } from "@/hooks/usePageMeta";

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

type FreebieItem = { title: string; text: string };
type FreebieCategory = { category: string; items: FreebieItem[] };

function FreebieItemRow({ title, text }: FreebieItem) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900">{title || "Untitled freebie"}</span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div
        className="overflow-hidden text-sm leading-relaxed text-gray-500 transition-all duration-300"
        style={{ maxHeight: open ? 1000 : 0, opacity: open ? 1 : 0, paddingBottom: open ? 20 : 0 }}
      >
        <p style={{ whiteSpace: "pre-line" }}>{text}</p>
        <button
          type="button"
          onClick={copyText}
          className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#d9e2d9] px-3 py-2 text-xs font-semibold text-[#3d5a3e] transition-colors hover:bg-[#f4f7f4]"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>
    </div>
  );
}

export default function FreebiesPage() {
  usePageMeta({
    title: "Freebies | Wedinstudio",
    description: "Free wedding invitation wording, template ideas and helpful content from Wedinstudio.",
    canonical: "https://wedinstudio.com/freebies",
  });

  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [freebieData, setFreebieData] = useState<FreebieCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/site-settings`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: { freebieItems?: FreebieCategory[] } | null) => {
        setFreebieData(data?.freebieItems ?? []);
      })
      .catch(() => setFreebieData([]))
      .finally(() => setLoading(false));
  }, []);

  const rightSlot = user ? (
    <button
      onClick={() => navigate(dashboardPathForUser(user))}
      className="inline-flex items-center justify-center text-gray-700 transition-colors hover:text-gray-900"
      aria-label="Dashboard"
      title="Dashboard"
    >
      <User size={18} />
    </button>
  ) : (
    <>
      <button
        onClick={() => navigate("/login")}
        className="text-xs font-bold tracking-widest text-gray-500 transition-colors hover:text-gray-800"
      >
        LOG IN
      </button>
      <button
        onClick={() => navigate("/register")}
        className="hidden items-center gap-1.5 rounded bg-[#3d5a3e] px-4 py-2 text-xs font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330] sm:inline-flex"
      >
        <Heart size={12} />
        SIGN UP
      </button>
    </>
  );

  const drawerFooter = user ? (
    <div className="flex flex-col gap-2 px-5 py-5">
      <button
        onClick={() => { navigate(dashboardPathForUser(user)); setNavOpen(false); }}
        className="w-full rounded bg-[#3d5a3e] py-2.5 text-sm font-bold tracking-widest text-white"
      >
        GO TO DASHBOARD
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-2 px-5 py-5">
      <button
        onClick={() => { navigate("/register"); setNavOpen(false); }}
        className="w-full rounded bg-[#3d5a3e] py-2.5 text-sm font-bold tracking-widest text-white"
      >
        SIGN UP FREE
      </button>
      <button
        onClick={() => { navigate("/login"); setNavOpen(false); }}
        className="w-full rounded border border-gray-200 py-2.5 text-sm font-bold tracking-widest text-gray-600"
      >
        LOG IN
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="FREEBIES"
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={rightSlot}
      />
      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={drawerFooter}
      />

      <main className="flex-1">
        <section className="bg-white px-4 py-8 text-center sm:px-6 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-[#f2f2f0] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d5a3e]">
              FREEBIES
            </p>
            <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
              Helpful ideas, free for you
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-gray-500">
              Free ideas, wording inspiration and useful tips. Made to help you plan, create and personalise your wedding with ease.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 px-4 pb-12 pt-5 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {loading ? (
              <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
            ) : freebieData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                <h2 className="text-lg font-semibold text-gray-900">Freebies coming soon</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                  We are preparing helpful wedding invitation ideas for you.
                </p>
              </div>
            ) : (
              freebieData.map((category) => (
                <div key={category.category}>
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#3d5a3e]">
                    {category.category}
                  </h2>
                  <div className="rounded-2xl border border-gray-100 bg-white px-5 shadow-sm sm:px-8">
                    {category.items.map((item, index) => (
                      <FreebieItemRow
                        key={`${item.title}-${index}`}
                        title={item.title}
                        text={item.text}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white px-4 py-12 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ready to create yours?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
              Turn your favourite ideas into a beautiful digital wedding invitation.
            </p>
            <button
              onClick={() => navigate("/editor")}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded bg-[#3d5a3e] px-8 py-4 text-xs font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330]"
            >
              CREATE MY INVITATION
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
      <div className="bg-[#2d4330] py-4 text-center text-xs tracking-wide text-white/60">
        © {new Date().getFullYear()} Wedinstudio · All rights reserved
      </div>
    </div>
  );
}