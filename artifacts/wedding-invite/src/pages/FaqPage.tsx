import React, { useState } from "react";
import { useLocation } from "wouter";
import { Heart, User, Plus, Minus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { usePageMeta } from "@/hooks/usePageMeta";

const PACKAGE_SUPPORT_WHATSAPP = "https://wa.me/601128134211";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

const WA = (
  <a
    href={PACKAGE_SUPPORT_WHATSAPP}
    target="_blank"
    rel="noreferrer"
    className="font-semibold text-[#3d5a3e] underline underline-offset-2 hover:opacity-80"
  >
    WhatsApp
  </a>
);

const FAQS = [
  {
    category: "General",
    items: [
      {
        question: "What is Wedinstudio?",
        answer:
          "Wedinstudio is a Malaysian digital wedding invitation platform. You can create, customise, and share a beautiful online invitation with your guests via a link — no printing, no postage, no hassle.",
      },
      {
        question: "What is the difference between a digital invitation and a physical card?",
        answer:
          "A digital invitation is shared as a link. Guests open it on their phone or computer and see a beautifully animated card with background music, a GPS location button, and an online RSVP. No printing costs, and no card left behind at home.",
      },
    ],
  },
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I create my digital wedding invitation?",
        answer: (
          <>
            It's simple — just follow these 4 steps:
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Choose a package (Standard, Premium, or Signature)</li>
              <li>Fill in your wedding details — couple names, date, venue, and more</li>
              <li>Complete payment to activate your invitation</li>
              <li>Share your unique link with guests via WhatsApp or social media</li>
            </ol>
          </>
        ),
      },
      {
        question: "Do I need any technical knowledge?",
        answer:
          "Not at all. Everything is done through simple forms. Just type in your wedding details and Wedinstudio will generate your beautiful invitation automatically.",
      },
      {
        question: "Can I preview my invitation before paying?",
        answer:
          "Yes. After registering and filling in your basic details, you can preview your invitation for free. Payment is only required to activate and share the link with guests.",
      },
    ],
  },
  {
    category: "Features",
    items: [
      {
        question: "Can my guests RSVP through the invitation?",
        answer:
          "Yes. Guests can confirm their attendance directly through the card — selecting whether they'll attend, stating the number of guests, and leaving their name. All responses are collected in your dashboard.",
      },
      {
        question: "Can guests leave wishes for the couple?",
        answer:
          "Yes. There is a dedicated wishes section in the invitation. Guests can write congratulatory messages or prayers, and everything is saved in your card for you to read anytime.",
      },
      {
        question: "Will I receive an email notification when a guest RSVPs?",
        answer:
          "Yes — every time a guest submits an RSVP, you will receive a notification to your registered email address. This feature is active as soon as your payment is completed.",
      },
      {
        question: "Can I add background music?",
        answer:
          "Yes. Background music is available in all packages — Standard, Premium, and Signature. Guests can mute or unmute it as they prefer.",
      },
      {
        question: "Can I add a photo gallery?",
        answer:
          "Yes — Photo Gallery is available in the Premium and Signature packages. You can upload cherished photos to be displayed beautifully inside the invitation.",
      },
      {
        question: "Is there a Dress Code feature?",
        answer:
          "Yes — Dress Code is available in the Premium and Signature packages. You can set a colour theme or attire guideline for guests, complete with a colour palette display.",
      },
      {
        question: "Can I add a Money Gift or bank QR code?",
        answer:
          "Yes — Money Gift is available in the Premium and Signature packages. You can upload a QR code for your bank account or e-wallet to make it easy for guests to send gifts.",
      },
      {
        question: "What are Gift Corner and Gift Registry?",
        answer:
          "Gift Corner and Gift Registry are exclusive to the Signature package. Gift Corner lets you list items you'd love to receive, while Gift Registry lets guests 'claim' a gift they plan to bring — preventing duplicates.",
      },
    ],
  },
  {
    category: "Editing & Customisation",
    items: [
      {
        question: "Can I edit my invitation details after paying?",
        answer:
          "Yes. You can freely update your wedding details — venue, time, music, gallery, RSVP settings, and more — at any time before your event date. Once the event date has passed, the invitation is automatically locked to read-only.",
      },
      {
        question: "Can I change the couple names after paying?",
        answer:
          "The names displayed inside the invitation can be changed at any time. However, the Cover Names — which form your invitation's public URL — cannot be changed after payment. This ensures the link you've already shared with guests remains valid.",
      },
      {
        question: "Can I choose the language for my invitation?",
        answer:
          "Yes. You can choose between Bahasa Melayu or English for the text displayed in your invitation.",
      },
      {
        question: "How long is my invitation active?",
        answer:
          "Your invitation stays active for three months after your event date. For example, if your wedding is on 1 August 2026, your invitation will expire on 1 November 2026. This gives late-opening guests time to still access the card after the event.",
      },
    ],
  },
  {
    category: "Sharing",
    items: [
      {
        question: "How do I share my digital invitation with guests?",
        answer:
          "You will have a unique link such as wedinstudio.com/invite/260814/amirul-amira. Share it via WhatsApp, Telegram, Instagram, or any messaging platform. Guests simply tap the link and the invitation opens instantly — no app required.",
      },
      {
        question: "Can guests open the invitation on their phones?",
        answer:
          "Yes. Wedinstudio invitations are designed specifically for mobile phones. They also work on tablets and computers. Guests do not need to download anything.",
      },
    ],
  },
  {
    category: "Packages & Payment",
    items: [
      {
        question: "What packages are available and how much do they cost?",
        answer: (
          <>
            We offer three packages:
            <ul className="mt-2 space-y-1.5">
              <li><span className="font-semibold text-gray-800">Standard — RM50:</span> RSVP &amp; Wishes, GPS Location, Countdown, Background Music, Calendar</li>
              <li><span className="font-semibold text-gray-800">Premium — RM60:</span> Everything in Standard + Photo Gallery, Money Gift, Dress Code</li>
              <li><span className="font-semibold text-gray-800">Signature — RM70:</span> Everything in Premium + Gift Corner &amp; Gift Registry</li>
            </ul>
            <p className="mt-2">Visit our <a href="/pricing" className="font-semibold text-[#3d5a3e] underline underline-offset-2">Packages</a> page for a full feature comparison.</p>
          </>
        ),
      },
      {
        question: "What is the difference between Standard, Premium, and Signature?",
        answer:
          "Standard covers all the essentials for a complete invitation. Premium adds Photo Gallery, Money Gift, and Dress Code — ideal for couples who want more personalisation. Signature goes further with Gift Corner and Gift Registry for the most complete invitation experience.",
      },
      {
        question: "What do I need to complete before I can make payment?",
        answer:
          "Before payment, you need to fill in the groom's name, bride's name, and the official event date in the Edit section. This information is needed to generate your unique invitation URL. Once payment is made, the URL cannot be changed.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept payment via FPX (all major Malaysian banks), credit/debit card, and e-wallet through the ToyyibPay and Billplz payment gateways. Payment is secure and processed instantly.",
      },
      {
        question: "Can I change my package after paying?",
        answer: (
          <>
            Package changes are not available after payment has been made. For further assistance, please contact us on {WA}.
          </>
        ),
      },
      {
        question: "Are there any recurring charges after the first payment?",
        answer:
          "No. It is a one-time payment. There are no monthly fees or hidden charges. Your invitation remains active until three months after your event date.",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        question: "How do I contact Wedinstudio if I have a problem?",
        answer: (
          <>
            You can reach us directly via {WA}. We are available Monday to Saturday.
          </>
        ),
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: React.ReactNode }) {
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
        style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, paddingBottom: open ? 20 : 0 }}
      >
        {answer}
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
            {FAQS.map((category) => (
              <div key={category.category}>
                <h2 className="text-xs font-bold tracking-widest text-[#3d5a3e] uppercase mb-3">{category.category}</h2>
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 sm:px-8">
                  {category.items.map((faq) => (
                    <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4 sm:px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Still have questions?
            </h2>
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
