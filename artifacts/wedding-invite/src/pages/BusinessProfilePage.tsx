import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import { ArrowLeft, ExternalLink, ImagePlus, Link2, LogOut, Save, User } from "lucide-react";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/r2-url";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

type FormState = {
  businessName: string;
  businessType: string;
  businessLink: string;
};

export default function BusinessProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ businessName: "", businessType: "", businessLink: "" });
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "business_account")) {
      navigate(user ? "/dashboard" : "/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user?.role !== "business_account") return;
    fetch(`${BASE}/api/business/me`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load profile.");
        setLogoUrl(data.logoUrl ?? "");
        setForm({
          businessName: data.businessName ?? "",
          businessType: data.businessType ?? "",
          businessLink: data.slug ?? "",
        });
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load profile."))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (authLoading || loading || !user || user.role !== "business_account") {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]"><div className="h-8 w-8 rounded-full border-b-2 border-gray-900 animate-spin" /></div>;
  }

  const publicBusinessLink = `${window.location.origin}${BASE}/business/${encodeURIComponent(form.businessLink)}`;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${BASE}/api/business/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: form.businessName, businessType: form.businessType, slug: form.businessLink }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to save profile.");
      setForm((current) => ({ ...current, businessName: data.businessName ?? current.businessName, businessType: data.businessType ?? current.businessType, businessLink: data.slug ?? current.businessLink }));
      toast.success("Business profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "image/png" || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a transparent PNG logo no larger than 2 MB.");
      return;
    }
    setLogoUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${BASE}/api/business/me/logo`, { method: "POST", credentials: "include", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to upload logo.");
      setLogoUrl(data.logoUrl ?? "");
      toast.success("Logo uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc] flex flex-col">
      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          <>
            <button onClick={() => navigate("/business/dashboard")} className="text-gray-500 hover:text-gray-900" aria-label="Back to dashboard"><User size={18} /></button>
            <button onClick={async () => { await logout(); navigate("/"); }} className="text-gray-500 hover:text-gray-900" aria-label="Log out"><LogOut size={18} /></button>
          </>
        }
      />
      <SharedNavDrawer navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button onClick={() => navigate("/business/dashboard")} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft size={15} /> Back to dashboard
        </button>
        <h1 className="text-3xl font-serif text-gray-900">Profile Details</h1>
        <p className="mt-1 mb-8 text-sm text-gray-500">Manage the information shown on your public business profile.</p>

        <form onSubmit={save} className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-1">
              <ImagePlus size={18} className="text-rose-700" />
              <h2 className="font-semibold text-gray-900">Business logo</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">Upload a transparent PNG logo for your collaboration profile.</p>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="h-28 w-28 rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                {logoUrl ? <img src={resolveImageUrl(logoUrl)} alt={form.businessName || "Business logo"} className="h-full w-full object-contain p-3" /> : <ImagePlus size={24} className="text-gray-400" />}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold cursor-pointer">
                  {logoUploading ? "Uploading…" : "Upload logo"}
                  <input type="file" accept="image/png" onChange={uploadLogo} disabled={logoUploading} className="sr-only" />
                </label>
                <p className="mt-2 text-xs text-gray-500">Transparent PNG · max 2 MB · max 1600 × 1600 px</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-rose-700" />
              <h2 className="font-semibold text-gray-900">Business details</h2>
            </div>
            <label className="block text-sm text-gray-700">
              <span className="mb-1 block font-medium">Business name</span>
              <input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" required />
            </label>
            <label className="block text-sm text-gray-700">
              <span className="mb-1 block font-medium">Business type</span>
              <input value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} placeholder="Wedding planner, photographer, venue..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" required />
            </label>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Business link</span>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <span className="shrink-0 text-sm text-gray-400">{window.location.origin}{BASE}/business/</span>
                <input value={form.businessLink} onChange={(event) => setForm({ ...form, businessLink: event.target.value })} placeholder="your-business-name" className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none" aria-label="Business link" required />
                <a href={publicBusinessLink} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-900" aria-label="Open business link"><ExternalLink size={15} /></a>
              </div>
              <p className="mt-1 text-xs text-gray-400">Masukkan nama custom untuk pautan business anda. Gunakan huruf, nombor atau tanda sempang.</p>
            </div>
          </section>

          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
            <Save size={15} /> {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}