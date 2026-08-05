import React from "react";
import { useLocation } from "wouter";
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
  { label: "FOR BUSINESS", href: "/for-business" },
];

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Wedinstudio (\"the Service\"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.",
  },
  {
    title: "2. Description of Service",
    body: "Wedinstudio provides a digital wedding invitation platform that allows users to create, customise, and share online wedding invitations. Features available to you depend on the package you have purchased.",
  },
  {
    title: "3. Account Registration",
    body: "You must provide accurate and complete information when registering an account. You are responsible for maintaining the security of your account credentials. Wedinstudio is not liable for any loss arising from unauthorised access to your account.",
  },
  {
    title: "4. Payments & Packages",
    body: "All payments are processed securely through our payment gateway. Package prices are listed in Malaysian Ringgit (RM) and are inclusive of applicable fees. Once a package is purchased and the invitation is activated, no refunds will be issued unless required by applicable law.",
  },
  {
    title: "5. Invitation Content",
    body: "You are solely responsible for the content of your invitation, including text, images, and uploaded files. You must not upload content that is unlawful, offensive, defamatory, or infringes on any third-party rights. Wedinstudio reserves the right to remove any content that violates these terms.",
  },
  {
    title: "6. Intellectual Property",
    body: "The Wedinstudio platform, including its designs, templates, and software, is the property of Wedinstudio and is protected by applicable intellectual property laws. You retain ownership of the personal content you upload to your invitation.",
  },
  {
    title: "7. Invitation Expiry",
    body: "Digital invitations are accessible to guests for a period of three (3) calendar months from the date of your wedding event. After this period, the invitation link will no longer be publicly accessible.",
  },
  {
    title: "8. Privacy",
    body: "We collect and process your personal information in accordance with our privacy practices. Your data is used solely to provide and improve the Service. We do not sell or share your personal information with third parties for marketing purposes.",
  },
  {
    title: "9. Limitation of Liability",
    body: "Wedinstudio is provided on an \"as is\" basis. We do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, Wedinstudio shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.",
  },
  {
    title: "10. Changes to Terms",
    body: "We reserve the right to update these Terms and Conditions at any time. Continued use of the Service after changes are posted constitutes your acceptance of the revised terms. We will notify users of significant changes via email or an in-app notice.",
  },
  {
    title: "11. Governing Law",
    body: "These Terms and Conditions are governed by the laws of Malaysia. Any disputes arising from the use of the Service shall be subject to the exclusive jurisdiction of the courts of Malaysia.",
  },
  {
    title: "12. Contact",
    body: "If you have any questions about these Terms and Conditions, please contact us via WhatsApp at +601128134211 or by email at support@wedinstudio.com.",
  },
];

export default function TermsPage() {
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
        <section className="border-b border-gray-100 bg-[#f9f9f7] px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3d5a3e] shadow-sm ring-1 ring-gray-200">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-4 text-xs text-gray-400">Last updated: January 2025</p>
          </div>
        </section>

        {/* Terms body */}
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="space-y-8">
            {SECTIONS.map(({ title, body }) => (
              <div key={title}>
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-gray-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-gray-100 bg-[#f9f9f7] px-5 py-6 text-center">
            <p className="text-sm font-semibold text-gray-900">Questions about our terms?</p>
            <button
              onClick={() => navigate("/contact")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Contact Us →
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
