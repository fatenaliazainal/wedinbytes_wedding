import React from "react";
import { useLocation } from "wouter";
import { Heart, Sparkles, Users, Star } from "lucide-react";
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
  { label: "HOW TO USE", href: "/how-to-use" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

export default function AboutPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
            About Us
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            More than an invitation, it&apos;s the beginning.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
            Wedinstudio helps couples create stunning digital wedding invitations — with RSVP tracking, guest messages, and everything they need for their celebration, all in one place.
          </p>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-semibold text-gray-900">Our Story</h2>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Wedinstudio started with{" "}
            <a href="https://wedinbytes.com" target="_blank" rel="noreferrer" className="font-medium text-[#3d5a3e] underline underline-offset-2 hover:text-[#2d4330]">Wedinbytes</a>
            , creating beautiful motion and digital wedding invitations for couples who wanted something simple, beautiful, and easy to share.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Our journey began with Canva-based designs. But as more couples started using our invitations, we kept receiving the same requests again and again.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600 italic text-gray-500">
            "Can we have RSVP?"<br />
            "Can our guests leave wishes?"<br />
            "Can we customise the website ourselves?"
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            And eventually, we thought:
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            Why not build it ourselves?
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            We realised couples didn't just need a digital invitation. They needed a simple space where they could create, customise, and manage their own wedding website — all in one place.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            That idea became Wedinstudio.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            What started with templates has now grown into a platform designed to make wedding invitations more personal, interactive, and effortless.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            Today, Wedinstudio brings everything together in one beautiful link — from wedding details, RSVP, maps and music to gifts and live wishes — making it easier for couples to share their special day with the people who matter most.
          </p>
          <p className="mt-4 text-sm leading-7 text-gray-500 italic">
            Built from the requests we heard every day, and created to make wedding invitations easier to create, share, and manage.
          </p>
        </section>

        {/* Values */}
        <section className="border-t border-gray-100 bg-[#f9f9f7] px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-gray-900">What we believe in</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                { icon: Heart, title: "Love is in the details", desc: "Every element of your invitation — colours, fonts, wording — should feel like you. We give you full control." },
                { icon: Sparkles, title: "Simple by design", desc: "No complicated software. No design skills required. Just fill in your details and your invitation is ready to share." },
                { icon: Users, title: "For every couple", desc: "Whether you are planning an intimate gathering or a grand reception, Wedinstudio has a package that fits." },
                { icon: Star, title: "Always improving", desc: "We listen to our customers and continuously add new features, designs, and tools to make the experience better." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-[#3d5a3e] shadow-sm">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-14 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-gray-900">Ready to create yours?</h2>
          <p className="mt-3 text-sm text-gray-500">Join hundreds of couples who have shared their love story with Wedinstudio.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/weddingcards/home")}
              className="inline-flex items-center gap-2 rounded bg-[#3d5a3e] px-6 py-3 text-xs font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330]"
            >
              VIEW CATALOG
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-xs font-bold tracking-widest text-gray-700 transition-colors hover:bg-gray-50"
            >
              SEE PRICING
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
