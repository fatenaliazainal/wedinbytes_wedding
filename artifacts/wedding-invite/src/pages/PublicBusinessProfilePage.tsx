import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import {
  BadgeCheck,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/r2-url";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

type Profile = {
  businessName: string;
  businessType: string;
  displayName: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImage?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  invitationCount?: number;
  isVerified?: boolean;
};

function externalUrl(value?: string | null) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export default function PublicBusinessProfilePage() {
  const [, params] = useRoute("/business/:slug");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;

    fetch(`${BASE}/api/business/${encodeURIComponent(params.slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [params?.slug]);

  return (
    <div className="min-h-screen bg-[#fdfdfc] flex flex-col">
      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
      />
      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
      />

      {!profile ? (
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Business profile not found.</p>
        </main>
      ) : (
        <main className="flex-1 pb-20">
          <div className="h-64 sm:h-80 bg-gradient-to-r from-gray-200 to-gray-300">
            {profile.coverImage && (
              <img
                src={profile.coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="h-28 w-28 rounded-2xl overflow-hidden bg-gray-100 border-4 border-white shadow-lg shrink-0">
                  {profile.logoUrl ? (
                    <img
                      src={resolveImageUrl(profile.logoUrl)}
                      alt={profile.businessName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-3xl font-serif text-gray-400">
                      {profile.businessName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-3xl font-serif text-gray-900">
                      {profile.businessName}
                    </h1>
                    {profile.isVerified && (
                      <BadgeCheck size={21} className="text-blue-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {profile.businessType} · {profile.displayName}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">
                    {profile.description || "A business profile on Wedinstudio."}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="mt-4 inline-flex gap-2 items-center rounded-lg bg-gray-50 border px-3 py-2 text-xs font-semibold text-gray-600"
                  >
                    <Share2 size={14} /> Share profile
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Contact</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  {profile.address && (
                    <p className="flex gap-2">
                      <MapPin size={16} /> {profile.address}
                    </p>
                  )}
                  {profile.phone && (
                    <a className="flex gap-2" href={`tel:${profile.phone}`}>
                      <Phone size={16} /> {profile.phone}
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a
                      className="flex gap-2"
                      href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  {profile.email && (
                    <a className="flex gap-2" href={`mailto:${profile.email}`}>
                      <Mail size={16} /> {profile.email}
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Online</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  {profile.website && (
                    <a
                      className="flex gap-2"
                      href={externalUrl(profile.website)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Globe size={16} /> Website
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      className="flex gap-2"
                      href={externalUrl(profile.instagram)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Instagram size={16} /> Instagram
                    </a>
                  )}
                  <p className="text-xs text-gray-400">
                    {profile.invitationCount ?? 0} invitations created on Wedinstudio
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      <SiteFooter />
    </div>
  );
}