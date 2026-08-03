import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronRight,
  Heart,
  User,
  LayoutDashboard,
  FileText,
  Users,
  Link2,
  BadgeCheck,
  Globe,
  Sparkles,
  Image,
  MessageSquareHeart,
  Building2,
  ArrowRight,
  Check,
} from "lucide-react";
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
  { label: "FOR BUSINESS", href: "/for-business" },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Business Dashboard",
    description:
      "One clean workspace for all your client invitations. See every order's status, payment, and invitation link at a glance.",
  },
  {
    icon: FileText,
    title: "Customer Order Forms",
    description:
      "Clients submit their details through a branded online form — no back-and-forth messages needed. Orders land straight in your dashboard.",
  },
  {
    icon: Users,
    title: "RSVP Management",
    description:
      "Track guest attendance counts for every client invitation. Share a private RSVP summary link directly with your client.",
  },
  {
    icon: Link2,
    title: "Shareable RSVP Links",
    description:
      "Generate a one-click link for each invitation so your client can check their own RSVP numbers without needing an account.",
  },
  {
    icon: Globe,
    title: "Public Business Profile",
    description:
      "Your own branded page on Wedinbytes showcasing your business name, logo, and description — discoverable by couples browsing the platform.",
  },
  {
    icon: Image,
    title: "Custom Invitation Designs",
    description:
      "Every client invitation uses the same beautiful premium templates, styled with their couple initials, photos, and personal details.",
  },
  {
    icon: MessageSquareHeart,
    title: "Guest Wishes & RSVPs",
    description:
      "Each invitation includes a live wishes wall and RSVP form — delighting guests and giving you real attendance data.",
  },
  {
    icon: BadgeCheck,
    title: "Featured on Homepage",
    description:
      "Business accounts with a logo are showcased in the Collaborations section on the Wedinbytes homepage, building your brand visibility.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Register as Business Account",
    description:
      "Sign up and choose a Business Account. Set up your profile with your business name, logo, and description.",
  },
  {
    step: "02",
    title: "Receive Client Orders",
    description:
      "Share your order form link with clients. They fill in the couple details, package selection, and preferences — everything arrives in your dashboard.",
  },
  {
    step: "03",
    title: "Create & Manage Invitations",
    description:
      "Review the order, generate the digital invitation, and share the link with your client. Track RSVP responses together.",
  },
];

const PACKAGE_HIGHLIGHTS = [
  { label: "Unlimited client invitations", included: true },
  { label: "Online order form for clients", included: true },
  { label: "RSVP tracking per invitation", included: true },
  { label: "Shareable RSVP summary links", included: true },
  { label: "Public business profile page", included: true },
  { label: "Homepage collaboration feature", included: true },
  { label: "Premium invitation templates", included: true },
  { label: "Music, gallery & wishes features", included: true },
];

export default function BusinessProposalPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="FOR BUSINESS"
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
            <div className="px-5 py-5">
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
                GET STARTED FREE
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

      {/* ── Hero ── */}
      <section className="bg-white border-b border-gray-100 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700 ring-1 ring-rose-100">
            <Building2 size={12} />
            For Wedding Planners &amp; Event Businesses
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Grow your business with<br className="hidden sm:block" />{" "}
            <span className="text-rose-700">beautiful digital invitations.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg">
            Wedinbytes gives event planners and wedding businesses a complete platform to manage client invitations, collect orders, and deliver a premium experience — all from one dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-7 py-3.5 text-xs font-bold tracking-widest text-white transition-colors hover:bg-gray-700"
            >
              START FOR FREE
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-7 py-3.5 text-xs font-bold tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
            >
              VIEW PRICING
            </button>
          </div>
          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Check size={12} className="text-rose-600" /> No monthly subscription</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-rose-600" /> Pay per invitation</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-rose-600" /> Your brand, your clients</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-rose-700 uppercase mb-2">Simple Process</p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How it works for your business</h2>
            <p className="mt-3 text-sm text-gray-500 max-w-lg mx-auto">
              From client enquiry to delivered invitation in three steps.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white text-sm font-bold">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-xs leading-6 text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="bg-white border-t border-gray-100 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-rose-700 uppercase mb-2">Everything You Need</p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Features built for your workflow</h2>
            <p className="mt-3 text-sm text-gray-500 max-w-lg mx-auto">
              Every tool a wedding or event business needs to deliver professionally, manage clients smoothly, and grow your reputation.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-700 shadow-sm ring-1 ring-rose-100">
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{title}</p>
                <p className="text-xs leading-5 text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="bg-gray-50 border-t border-gray-100 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-rose-700 uppercase mb-2">Business Account</p>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-4">
                One account. Every client. All the tools.
              </h2>
              <p className="text-sm leading-7 text-gray-500 mb-6">
                A Business Account unlocks a dedicated dashboard designed around managing multiple client invitations. You handle the relationship; Wedinbytes handles the technology.
              </p>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3.5 text-xs font-bold tracking-widest text-white transition-colors hover:bg-gray-700"
              >
                REGISTER AS BUSINESS
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={15} className="text-rose-700" />
                <span className="text-xs font-bold tracking-widest text-gray-900 uppercase">Included in Business Account</span>
              </div>
              <ul className="space-y-3">
                {PACKAGE_HIGHLIGHTS.map(({ label, included }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${included ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-300"}`}>
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-gray-100 pt-4">
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full rounded-lg border border-gray-200 py-2.5 text-xs font-bold tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  SEE FULL PRICING →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-gray-900 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl mb-4">
            Ready to grow your wedding business?
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-xl mx-auto leading-7">
            Join wedding planners and event businesses already using Wedinbytes to manage client invitations professionally. Sign up in minutes — no monthly fees.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-gray-900 px-7 py-3.5 text-xs font-bold tracking-widest transition-colors hover:bg-gray-100"
            >
              CREATE BUSINESS ACCOUNT
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 text-white px-7 py-3.5 text-xs font-bold tracking-widest transition-colors hover:bg-white/10"
            >
              VIEW PRICING
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} Wedinbytes · All rights reserved
      </div>
    </div>
  );
}
