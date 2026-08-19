import React, { useState } from "react";
import { ExternalLink, FileText, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import {
  HOW_TO_USE_PDF_PATH,
  HOW_TO_USE_PAGE_COUNT,
  howToUsePageImagePath,
} from "@/lib/how-to-use-guide";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
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
];

export default function HowToUsePage() {
  usePageMeta({
    title: "How To Use | Wedinstudio",
    description: "Learn how to create, edit and manage your Wedinstudio digital wedding invitation.",
    canonical: "https://wedinstudio.com/how-to-use",
  });

  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const pdfUrl = `${BASE}${HOW_TO_USE_PDF_PATH}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f7]">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="HOW TO USE"
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate(dashboardPathForUser(user))}
              className="inline-flex items-center justify-center text-gray-700 transition-colors hover:text-gray-900"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User size={18} />
            </button>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold tracking-widest text-gray-500 transition-colors hover:text-gray-800"
              >
                LOG IN
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center rounded bg-[#3d5a3e] px-4 py-2 text-xs font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330]"
              >
                SIGN UP
              </button>
            </div>
          )
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={
          <div className="flex flex-col gap-2 px-5 py-5">
            {user ? (
              <button
                onClick={() => {
                  navigate(dashboardPathForUser(user));
                  setNavOpen(false);
                }}
                className="w-full rounded bg-[#3d5a3e] py-2.5 text-sm font-bold tracking-widest text-white"
              >
                GO TO DASHBOARD
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate("/register");
                    setNavOpen(false);
                  }}
                  className="w-full rounded bg-[#3d5a3e] py-2.5 text-sm font-bold tracking-widest text-white"
                >
                  SIGN UP FREE
                </button>
                <button
                  onClick={() => {
                    navigate("/login");
                    setNavOpen(false);
                  }}
                  className="w-full rounded border border-gray-200 py-2.5 text-sm font-bold tracking-widest text-gray-600"
                >
                  LOG IN
                </button>
              </>
            )}
          </div>
        }
      />

      <main className="flex-1">
        <section className="border-b border-gray-100 bg-white px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f4ef] text-[#3d5a3e]">
              <FileText size={23} strokeWidth={1.7} />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d5a3e]">
              Wedinstudio Guide
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              How To Use
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
              Follow this guide to create, customise and manage your digital wedding invitation.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Tutorial PDF
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                Open PDF
                <ExternalLink size={13} />
              </a>
            </div>
            <div className="flex flex-col gap-3 bg-gray-100 p-2 sm:gap-4 sm:p-4">
              {Array.from({ length: HOW_TO_USE_PAGE_COUNT }, (_, i) => i + 1).map((page) => (
                <img
                  key={page}
                  src={`${BASE}${howToUsePageImagePath(page)}`}
                  alt={`How To Use guide, page ${page} of ${HOW_TO_USE_PAGE_COUNT}`}
                  width={1100}
                  height={1556}
                  loading={page <= 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full rounded-lg border border-gray-200 bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-gray-400">
            Prefer a copy? Use <strong>Open PDF</strong> to view or download the full guide.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}