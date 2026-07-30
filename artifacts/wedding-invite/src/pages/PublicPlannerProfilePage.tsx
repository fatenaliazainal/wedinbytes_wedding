import { useRoute } from "wouter";
import { useGetPlannerProfile } from "@workspace/api-client-react";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import { useState } from "react";
import { 
  BadgeCheck, MapPin, Clock, Phone, Mail, Globe,
  Instagram, Facebook, MessageCircle,
  CalendarHeart, Image as ImageIcon, Share2
} from "lucide-react";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

export default function PublicPlannerProfilePage() {
  const [, params] = useRoute("/planner/:slug");
  const slug = params?.slug || "";
  const [navOpen, setNavOpen] = useState(false);

  const { data: profile, isLoading, error } = useGetPlannerProfile(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <SiteHeader navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <SiteHeader navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-serif text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-500 max-w-md">The event planner profile you are looking for does not exist or has been removed.</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const formatExternalUrl = (url: string) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const getInstagramUrl = (handle: string) => {
    const clean = handle.replace("@", "").trim();
    return `https://instagram.com/${clean}`;
  };

  const getTikTokUrl = (handle: string) => {
    const clean = handle.replace("@", "").trim();
    return `https://tiktok.com/@${clean}`;
  };

  const getWhatsappUrl = (number: string) => {
    const clean = number.replace(/\D/g, "");
    return `https://wa.me/${clean}`;
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied!");
  };

  return (
    <div className="min-h-screen bg-[#Fdfdfc] flex flex-col font-sans">
      <SiteHeader navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />
      <SharedNavDrawer navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />

      <main className="flex-1 w-full pb-20">
        {/* Hero Section */}
        <div className="relative w-full h-64 sm:h-80 bg-gray-200">
          {profile.coverImage ? (
            <img 
              src={profile.coverImage} 
              alt={`${profile.companyName} cover`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-24">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
              
              {/* Logo */}
              <div className="shrink-0 -mt-20 sm:-mt-24 self-center sm:self-start">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl shadow-lg border-4 border-white overflow-hidden flex items-center justify-center">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={profile.companyName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-serif text-gray-400">
                      {profile.companyName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Core Info */}
              <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-4xl font-serif text-gray-900">{profile.companyName}</h1>
                    {profile.isVerified && (
                      <BadgeCheck className="text-blue-500 shrink-0" size={24} aria-label="Verified Planner" />
                    )}
                  </div>
                  <button 
                    onClick={copyProfileLink}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-colors border border-gray-200 shrink-0"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>
                
                <p className="text-gray-500 text-sm sm:text-base mb-4 max-w-2xl leading-relaxed">
                  {profile.description || "No description provided."}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                  {profile.invitationCount !== undefined && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      <CalendarHeart size={14} />
                      <span>{profile.invitationCount} Events Planned</span>
                    </div>
                  )}
                  {profile.displayName && profile.displayName !== profile.companyName && (
                    <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wide">
                      Planner: {profile.displayName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10">
            
            {/* Left Column - Gallery & More Details */}
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-serif text-gray-900 mb-6 flex items-center gap-2">
                  <ImageIcon size={20} className="text-gray-400" />
                  Gallery & Portfolio
                </h2>
                {/* Gallery Placeholder */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                      <ImageIcon size={24} className="text-gray-300" />
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-400 mt-4">More portfolio features coming soon.</p>
              </section>
            </div>

            {/* Right Column - Contact & Socials */}
            <div className="space-y-6">
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">Contact Details</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  {profile.businessAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p>{profile.businessAddress}</p>
                        {profile.googleMapsUrl && (
                          <a 
                            href={formatExternalUrl(profile.googleMapsUrl)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-xs font-medium mt-1 inline-block"
                          >
                            View on Map
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400 shrink-0" />
                      <a href={`tel:${profile.phone}`} className="hover:text-gray-900 transition-colors">
                        {profile.phone}
                      </a>
                    </div>
                  )}
                  {profile.whatsapp && (
                    <div className="flex items-center gap-3">
                      <MessageCircle size={16} className="text-gray-400 shrink-0" />
                      <a 
                        href={getWhatsappUrl(profile.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-gray-900 transition-colors"
                      >
                        {profile.whatsapp}
                      </a>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400 shrink-0" />
                      <a href={`mailto:${profile.email}`} className="hover:text-gray-900 transition-colors break-all">
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {profile.businessHours && (
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <p>{profile.businessHours}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">Social Media</h3>
                <div className="flex flex-col gap-3">
                  {profile.website && (
                    <a 
                      href={formatExternalUrl(profile.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <Globe size={18} className="text-gray-400" />
                      <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {profile.instagram && (
                    <a 
                      href={getInstagramUrl(profile.instagram)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <Instagram size={18} className="text-gray-400" />
                      <span>{profile.instagram}</span>
                    </a>
                  )}
                  {profile.facebook && (
                    <a 
                      href={formatExternalUrl(profile.facebook)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <Facebook size={18} className="text-gray-400" />
                      <span className="truncate">{profile.facebook}</span>
                    </a>
                  )}
                  {profile.tiktok && (
                    <a 
                      href={getTikTokUrl(profile.tiktok)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                    >
                      <span className="font-bold text-gray-400 text-lg leading-none shrink-0" style={{ width: 18, textAlign: "center" }}>♪</span>
                      <span>{profile.tiktok}</span>
                    </a>
                  )}
                  
                  {!profile.website && !profile.instagram && !profile.facebook && !profile.tiktok && (
                    <p className="text-sm text-gray-400 text-center py-2">No social links added yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
