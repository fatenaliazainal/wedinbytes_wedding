import React from "react";
import { useLocation } from "wouter";
import { Heart, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "INFO", href: "/info" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

export default function InfoPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="INFO"
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors tracking-widest"
            >
              LOG IN
            </button>
          )
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
      />

      <main className="flex-1">
        <section className="bg-white py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-[#f25c4c]/10 flex items-center justify-center mx-auto mb-6">
              <Heart size={32} className="text-[#f25c4c]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              About WedInBytes
            </h1>
            <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              WedInBytes is a digital wedding invitation platform that helps couples create,
              customise, and share beautiful online invitations with their guests.
            </p>
          </div>
        </section>

        <section className="py-10 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">What we do</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We make it effortless to build a personalised digital wedding invitation card,
                manage RSVPs, share event details, and delight your guests with a modern,
                mobile-first experience.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Have questions or need help? Reach out to our team and we’ll be happy to assist
                you with your invitation.
              </p>
              <a
                href="mailto:hello@wedinbytes.com"
                className="mt-4 inline-block text-sm font-semibold text-[#f25c4c] hover:underline"
              >
                hello@wedinbytes.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
