import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useGetMyPlannerProfile, useUpdateMyPlannerProfile } from "@workspace/api-client-react";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import { User, LogOut, Save, ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

export default function PlannerProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else if (user.role !== "event_planner") {
        navigate("/dashboard");
      }
    }
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading: profileLoading } = useGetMyPlannerProfile({
    request: { credentials: "include" },
  });

  const updateProfile = useUpdateMyPlannerProfile({
    request: { credentials: "include" },
  });

  const [formData, setFormData] = useState({
    companyName: "",
    displayName: "",
    slug: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    logoUrl: "",
    coverImage: "",
    businessAddress: "",
    googleMapsUrl: "",
    businessHours: "",
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setFormData({
        companyName: profile.companyName || "",
        displayName: profile.displayName || "",
        slug: profile.slug || "",
        description: profile.description || "",
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        email: profile.email || "",
        website: profile.website || "",
        instagram: profile.instagram || "",
        facebook: profile.facebook || "",
        tiktok: profile.tiktok || "",
        logoUrl: profile.logoUrl || "",
        coverImage: profile.coverImage || "",
        businessAddress: profile.businessAddress || "",
        googleMapsUrl: profile.googleMapsUrl || "",
        businessHours: profile.businessHours || "",
      });
      initialized.current = true;
    }
  }, [profile]);

  if (authLoading || (user && user.role !== "event_planner") || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
        },
        onError: (err: any) => {
          toast.error(err?.details || err?.error || "Failed to update profile");
        }
      }
    );
  };

  const isSaving = updateProfile.isPending;

  return (
    <div className="min-h-screen bg-[#Fdfdfc] flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          <>
            <button
              onClick={() => navigate("/planner/dashboard")}
              title={user.name}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </>
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={
          <div className="px-5 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-900 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => navigate("/planner/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-2">Public Profile</h1>
          <p className="text-sm text-gray-500">Manage how you appear to prospective clients.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Info */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Company Name</label>
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Display Name</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  Profile URL Slug
                  <span className="text-[10px] text-gray-400 font-normal normal-case">wedinbytes.com/planner/[slug]</span>
                </label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  pattern="^[a-z0-9-]+$"
                  title="Only lowercase letters, numbers, and hyphens"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">About / Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-y"
                  placeholder="Tell clients about your event planning services..."
                />
              </div>
            </div>
          </section>

          {/* Branding */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-6">Branding</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  Logo Image URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    name="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                  Cover Image URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    name="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contact Details */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-6">Contact & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Public Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Phone Number</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">WhatsApp Number</label>
                <input
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="e.g. 62812345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Business Hours</label>
                <input
                  name="businessHours"
                  value={formData.businessHours}
                  onChange={handleChange}
                  placeholder="Mon-Fri, 9AM-5PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Business Address</label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Google Maps Link</label>
                <input
                  name="googleMapsUrl"
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-6">Social Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Website</label>
                <input
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Instagram</label>
                <input
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Facebook</label>
                <input
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="Page link or username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">TikTok</label>
                <input
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-70 shadow-md"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? "SAVING..." : "SAVE PROFILE"}</span>
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
