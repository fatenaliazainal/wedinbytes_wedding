import React, { useState } from "react";
import { useLocation } from "wouter";
import { Heart, User, Plus, Minus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
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
];

const FAQS = [
  {
    category: "General",
    items: [
      {
        question: "What is WedInBytes?",
        answer:
          "WedInBytes is a digital wedding invitation platform that allows you to create and share a beautiful online wedding invitation with your guests.",
      },
      {
        question: "What is a digital wedding invitation?",
        answer:
          "A digital wedding invitation is an online invitation that you can share with your guests through a link, WhatsApp, social media, or other messaging platforms.",
      },
    ],
  },
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I create my digital wedding invitation?",
        answer:
          "Choose your preferred package, provide your wedding details, customise your invitation, and share your unique invitation link with your guests.",
      },
      {
        question: "Do I need any technical knowledge?",
        answer:
          "No. WedInBytes is designed to be simple and easy to use. You do not need any technical knowledge to create your digital wedding invitation.",
      },
    ],
  },
  {
    category: "Features",
    items: [
      {
        question: "Can my guests RSVP through the invitation?",
        answer: "Yes. Guests can confirm their attendance directly through your digital wedding invitation.",
      },
      {
        question: "Can guests leave wishes for the couple?",
        answer: "Yes. Guests can leave their wishes and messages for the couple through the invitation.",
      },
      {
        question: "Can I add background music?",
        answer: "Yes. You can add background music to your digital wedding invitation.",
      },
      {
        question: "Can I add photos?",
        answer: "Photo Gallery is available with the Premium package.",
      },
      {
        question: "Can I add a dress code?",
        answer: "Dress Code is available with the Premium package.",
      },
      {
        question: "Can I include a money gift feature?",
        answer: "Money Gift is available with the Premium package.",
      },
    ],
  },
  {
    category: "Customisation",
    items: [
      {
        question: "Can I edit my wedding details after creating the invitation?",
        answer: "Yes. You can update your available wedding details and content after creating your invitation.",
      },
      {
        question: "Can I choose the language of my invitation?",
        answer: "Premium invitations are available in either Malay or English.",
      },
    ],
  },
  {
    category: "Sharing",
    items: [
      {
        question: "How do I share my digital wedding invitation?",
        answer: "You can share your unique invitation link through WhatsApp, social media, or any messaging platform.",
      },
      {
        question: "Can my guests open the invitation on their phones?",
        answer: "Yes. WedInBytes digital wedding invitations are designed to work on mobile devices, tablets, and desktop computers.",
      },
    ],
  },
  {
    category: "Package & Payment",
    items: [
      {
        question: "What packages are available?",
        answer:
          "We currently offer two packages: Standard at RM55 and Premium at RM65. Visit our Pricing page to see the features included in each package.",
      },
      {
        question: "What is the difference between Standard and Premium?",
        answer: "The Premium package includes additional features such as Photo Gallery, Money Gift, and Dress Code.",
      },
      {
        question: "Can I change my package after creating my invitation?",
        answer: "Please contact us for assistance with package changes.",
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{question}</span>
        <span className="shrink-0 w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div
        className="overflow-hidden text-sm text-gray-500 transition-all duration-300"
        style={{ maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, paddingBottom: open ? 20 : 0 }}
      >
        {answer}
      </div>
    </div>
  );
}

export default function FaqPage() {
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
            <div className="px-5 py-5 flex flex-col gap-2">
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
        <section className="bg-white py-10 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Frequently Asked Questions</h1>
            <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              Everything you need to know about creating and sharing your digital wedding invitation.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-10 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto space-y-8">
            {FAQS.map((category) => (
              <div key={category.category}>
                <h2 className="text-xs font-bold tracking-widest text-rose-700 uppercase mb-4">{category.category}</h2>
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
              Ready to create your beautiful digital wedding invitation?
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              Start creating your wedding invitation and share your special day with the people you love.
            </p>
            <button
              onClick={() => navigate("/editor")}
              className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-bold tracking-widest px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Create Your Invitation
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />

      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} WedInBytes · All rights reserved
      </div>
    </div>
  );
}
