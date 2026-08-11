import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  ClipboardList,
  Monitor,
  LayoutDashboard,
  UserPlus,
  Send,
  ClipboardCheck,
  Wand2,
  Check,
  ArrowRight,
  User,
  Heart,
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
  { label: "PACKAGES", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

const BUILT_FOR = [
  {
    icon: ClipboardList,
    title: "DEDICATED CLIENT FORM",
    description:
      "Each client gets their own form link. They fill in the details — you skip the back-and-forth entirely.",
  },
  {
    icon: Monitor,
    title: "INVITATION BUILT INSTANTLY",
    description:
      "The moment they submit, a live invitation website is created and ready to preview in your dashboard.",
  },
  {
    icon: LayoutDashboard,
    title: "ONE DASHBOARD, ALL CLIENTS",
    description:
      "Track every client, every invitation, and every upcoming event date — all in one organised place.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: UserPlus,
    title: "Add Your Client",
    description: "Select a package and add a new client to your dashboard in seconds.",
  },
  {
    step: 2,
    icon: Send,
    title: "Share the Form",
    description:
      "Copy their unique form link and send it — WhatsApp, email, however you like.",
  },
  {
    step: 3,
    icon: ClipboardCheck,
    title: "They Fill It In",
    description:
      "Your client fills in all their details at their own pace. No chasing required.",
  },
  {
    step: 4,
    icon: Wand2,
    title: "Invitation Goes Live",
    description:
      "Their invitation website is instantly created. Preview, refine, and share.",
  },
];

const PARTNER_BENEFITS = [
  "Partner pricing per package",
  "Unique form link per client",
  "Invitation created automatically",
  "Dashboard to manage all clients",
  "Edit & preview anytime, instantly",
  "Listed as a featured collaborator",
];

export default function BusinessProposalPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
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
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                GO TO DASHBOARD
              </button>
            </div>
          ) : (
            <div className="px-5 py-5">
              <button
                onClick={() => { navigate("/register/business"); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                BECOME A PARTNER
              </button>
            </div>
          )
        }
      />

      {/* ── Hero ── */}
      <section className="bg-white px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-500 mb-5">
              FOR WEDDING PROFESSIONALS
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 mb-6">
              You Handle the Event.<br />
              <em className="not-italic text-[#3d5a3e]">We Simplify the Invitation.</em>
            </h1>
            <p className="text-sm leading-7 text-gray-500 max-w-md mb-8">
              Stop collecting details over WhatsApp. Give each client their own form, and watch their invitation build itself — live, shareable, and ready to send.
            </p>
            <button
              onClick={() => navigate("/register/business")}
              className="inline-flex items-center gap-2 bg-[#3d5a3e] text-white text-xs font-bold px-6 py-3 rounded hover:bg-[#2d4330] transition-colors tracking-widest"
            >
              BECOME A PARTNER <ArrowRight size={13} />
            </button>
          </div>
          {/* Right side — decorative placeholder matching the editor mockup in the image */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 shadow-lg">
                <div className="bg-white rounded-xl border border-gray-100 p-3 mb-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded" />
                </div>
                <div className="bg-[#f5f0eb] rounded-xl p-6 text-center">
                  <div className="text-[#3d5a3e] font-bold text-xl mb-1">A | H</div>
                  <div className="text-gray-800 font-bold text-lg leading-tight mb-1">AIMAN<br />&amp; HANISAH</div>
                  <div className="text-gray-500 text-xs mb-4">21 · 06 · 2026</div>
                  <div className="inline-block bg-[#3d5a3e] text-white text-xs font-bold px-6 py-1.5 rounded">RSVP</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#3d5a3e] text-white text-[9px] font-bold tracking-widest px-3 py-2 rounded-full shadow-lg">
                CREATED<br />LIVE WEBSITE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Built for Event Planners ── */}
      <section className="bg-gray-50 border-y border-gray-100 px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-10">
            BUILT FOR WEDDING PROFESSIONALS
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {BUILT_FOR.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-[#3d5a3e]">
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-1.5">{title}</p>
                  <p className="text-xs leading-6 text-gray-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="bg-white px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-12">
            HOW IT WORKS
          </p>
          <div className="grid gap-8 sm:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }, i) => (
              <div key={step} className="relative text-center">
                {/* connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[60%] right-0 h-px border-t border-dashed border-gray-300" />
                )}
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#3d5a3e] text-white text-xs font-bold relative z-10">
                  {step}
                </div>
                <div className="mb-3 flex justify-center text-gray-400">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-bold text-gray-900 mb-1.5">{title}</p>
                <p className="text-[11px] leading-5 text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Auto Created as a Live Website ── */}
      <section className="bg-gray-50 border-y border-gray-100 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-4">
              READY THE MOMENT THEY SUBMIT
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-[1.15] text-gray-900 mb-5">
              They Fill In.<br />The Invitation<br />Builds Itself.
            </h2>
            <p className="text-sm leading-7 text-gray-500 mb-6">
              No copy-pasting, no manual setup. The moment your client submits their details, a complete invitation website is live in your dashboard — ready to preview, edit, and share.
            </p>
            <ul className="space-y-2.5 mb-6">
              {[
                "Preview together with your client before publishing",
                "Make edits anytime — changes reflect instantly",
                "Share a direct link or RSVP link straight away",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Check size={14} className="text-[#3d5a3e] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-white border border-gray-200 p-4 flex gap-3 items-start">
              <div className="mt-0.5 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 border border-gray-200">
                <Heart size={13} className="text-[#3d5a3e]" />
              </div>
              <p className="text-xs leading-5 text-gray-500">
                Their details, your finishing touch — a beautiful invitation website that reflects the couple's big day.
              </p>
            </div>
          </div>
          {/* Editor mockup */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
              {/* Browser bar */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-gray-800">WEDINSTUDIO</span>
                <div className="flex gap-2">
                  <div className="rounded px-3 py-1 text-[10px] border border-gray-200 text-gray-500">Preview</div>
                  <div className="rounded px-3 py-1 text-[10px] bg-[#3d5a3e] text-white font-bold">Publish</div>
                </div>
              </div>
              <div className="flex">
                {/* Sidebar */}
                <div className="w-36 border-r border-gray-100 p-3 space-y-1.5">
                  {["Couple Details","Event Details","Programme","Gallery","RSVP","Gift Registry","Other Sections","Theme Settings"].map((item) => (
                    <div key={item} className="text-[9px] text-gray-500 px-2 py-1 rounded hover:bg-gray-50">{item}</div>
                  ))}
                </div>
                {/* Preview */}
                <div className="flex-1 bg-[#f5f0eb] p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[#3d5a3e] font-bold text-sm mb-0.5">A | H</div>
                    <div className="text-gray-800 font-bold text-sm leading-tight mb-0.5">AIMAN<br />&amp; HANISAH</div>
                    <div className="text-gray-500 text-[9px] mb-3">21 · 06 · 2026</div>
                    <div className="inline-block bg-[#3d5a3e] text-white text-[8px] font-bold px-4 py-1 rounded">RSVP</div>
                  </div>
                </div>
                {/* Fields panel */}
                <div className="w-36 border-l border-gray-100 p-3 space-y-2">
                  <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mb-2">COUPLE DETAILS</p>
                  {[["Groom's Name","Aiman Hakim"],["Bride's Name","Hanisah Sofea"],["Event Date","21 · 06 · 2026"],["Venue","Tenera Hotel, Bang"],["Hashtag","#AimanHanisahForever"]].map(([l,v]) => (
                    <div key={l}>
                      <div className="text-[7px] text-gray-400">{l}</div>
                      <div className="text-[8px] text-gray-700 font-medium">{v}</div>
                    </div>
                  ))}
                  <button className="mt-2 w-full rounded bg-[#3d5a3e] text-white text-[8px] font-bold py-1.5">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner Benefits + Featured Collaborators ── */}
      <section className="bg-white px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-12">
          {/* Benefits */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-6">
              PARTNER BENEFITS
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {PARTNER_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={14} className="text-[#3d5a3e] shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          {/* Collaborators */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-4">
              FEATURED COLLABORATORS
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your Brand Deserves Visibility Too.
            </h2>
            <p className="text-sm leading-7 text-gray-500 mb-6">
              We feature our Event Planner partners in our Collaborators section with your logo and social media link.
            </p>
            <button
              onClick={() => navigate("/collaborators")}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-xs font-bold px-5 py-2.5 rounded hover:bg-gray-50 transition-colors tracking-widest"
            >
              SEE ALL COLLABORATORS <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-[#2d3d2e] px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/50 mb-3">
              READY TO GET STARTED?
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Less Admin. More Events.
            </h2>
            <p className="text-sm text-white/60 max-w-sm leading-6">
              Join wedding professionals already using WedinBytes to deliver polished invitations — faster, with zero back-and-forth.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 shrink-0">
            <button
              onClick={() => navigate("/register/business")}
              className="inline-flex items-center gap-2 bg-white text-[#2d3d2e] text-xs font-bold px-6 py-3 rounded hover:bg-gray-100 transition-colors tracking-widest whitespace-nowrap"
            >
              BECOME A PARTNER <ArrowRight size={13} />
            </button>
            <p className="text-xs text-white/40 italic">You handle the event. We simplify the invitation.</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
