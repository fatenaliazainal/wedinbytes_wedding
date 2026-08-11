import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { User, Heart } from "lucide-react";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
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
    body: "Wedinstudio provides a digital wedding invitation platform that allows users to create, customise, and share online wedding invitations. Features include RSVP management, photo galleries, gift registry, music, and countdown timers. Features available to you depend on the package you have purchased. Business Account users may additionally manage multiple client invitations, share dedicated order forms, and access a centralised client dashboard.",
  },
  {
    title: "3. Account Registration",
    body: "You must provide accurate and complete information when registering an account. Two account types are available: Buyer accounts for individual couples, and Business Accounts for wedding professionals managing client invitations. You are responsible for maintaining the security of your account credentials. Wedinstudio is not liable for any loss arising from unauthorised access to your account.",
  },
  {
    title: "4. Payments & Packages",
    body: "All payments are processed securely through our supported payment gateways, which include ToyyibPay and Billplz. Package prices are listed in Malaysian Ringgit (RM). Once a package is purchased and the invitation is activated, no refunds will be issued unless required by applicable law. For Business Accounts, package pricing applies per client invitation. Purchased package features are fixed upon payment and cannot be downgraded.",
  },
  {
    title: "5. Invitation Content & Uploads",
    body: "You are solely responsible for the content of your invitation, including text, images, audio, and any files uploaded to the platform (including photo galleries, gift QR codes, and initials artwork). You must not upload content that is unlawful, offensive, defamatory, or infringes on any third-party rights. Uploaded files are stored securely and served exclusively through the platform. Wedinstudio reserves the right to remove any content that violates these terms.",
  },
  {
    title: "6. Intellectual Property",
    body: "The Wedinstudio platform, including its designs, templates, card designs, and software, is the property of Wedinstudio and is protected by applicable intellectual property laws. You retain ownership of the personal content you upload to your invitation. By uploading content, you grant Wedinstudio a limited, non-exclusive licence to store and serve that content solely for the purpose of operating the Service.",
  },
  {
    title: "7. Invitation Expiry & Edit Lock",
    body: "Digital invitations are accessible to guests for a period of three (3) calendar months from the date of your wedding event. After this period, the invitation link will no longer be publicly accessible. Additionally, paid invitations become read-only after the event date has passed — content editing is disabled at that point to preserve the integrity of the invitation record.",
  },
  {
    title: "8. RSVP & Guest Data",
    body: "Wedinstudio provides built-in RSVP functionality. Guest names, attendance status, guest counts, time slot selections, and messages submitted through RSVP forms are stored and accessible to the invitation owner. You are responsible for handling guest data in accordance with applicable privacy laws. Wedinstudio does not use RSVP data for any purpose other than operating the Service.",
  },
  {
    title: "9. Business Account Terms",
    body: "Business Account users may create and manage invitations on behalf of clients. You are responsible for obtaining appropriate consent from your clients to collect and process their personal information through the platform. Client order form data submitted through Wedinstudio is stored securely and accessible only to the Business Account that created the form. Wedinstudio is not a party to any agreement between a Business Account and its clients.",
  },
  {
    title: "10. Privacy",
    body: "We collect and process your personal information in accordance with our privacy practices. Your data is used solely to provide and improve the Service. We do not sell or share your personal information with third parties for marketing purposes. For details on data collected, how it is used, and your rights, please refer to our Privacy Policy.",
  },
  {
    title: "11. Limitation of Liability",
    body: "Wedinstudio is provided on an \"as is\" basis. We do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, Wedinstudio shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of data, loss of revenue, or interruption of service.",
  },
  {
    title: "12. Changes to Terms",
    body: "We reserve the right to update these Terms and Conditions at any time. We will notify users of significant changes via email or an in-app notice at least 15 days before the changes take effect. Continued use of the Service after changes are posted constitutes your acceptance of the revised terms.",
  },
  {
    title: "13. Governing Law",
    body: "These Terms and Conditions are governed by the laws of Malaysia. Any disputes arising from the use of the Service shall be subject to the exclusive jurisdiction of the courts of Malaysia.",
  },
  {
    title: "14. Contact",
    body: "If you have any questions about these Terms and Conditions, please contact us via WhatsApp at +601128134211 or by email at support@wedinstudio.com.",
  },
];

export default function TermsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel=""
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate(dashboardPathForUser(user))}
              className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Dashboard"
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
          !user && (
            <div className="px-5 py-5">
              <button
                onClick={() => { navigate("/register"); setNavOpen(false); }}
                className="w-full rounded bg-[#3d5a3e] text-white text-sm font-bold py-2.5 tracking-widest"
              >
                SIGN UP FREE
              </button>
            </div>
          )
        }
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
            <p className="mt-4 text-xs text-gray-400">Last updated: August 2026</p>
          </div>
        </section>

        {/* Terms body */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
            <p className="mt-1 text-xs text-gray-500">Reach us directly and we'll get back to you.</p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/601128134211"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                WhatsApp Us →
              </a>
              <a
                href="mailto:support@wedinstudio.com"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Email Us →
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
