import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import { ArrowLeft, LogOut, Save, User } from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NAV_ITEMS: SiteNavItem[] = [{ label: "HOME", href: "/" }, { label: "CATALOG", href: "/weddingcards/home" }, { label: "PRICE LIST", href: "/pricing" }, { label: "FAQs", href: "/faq" }, { label: "REVIEWS", href: "/reviews" }];
const fields = ["businessName", "businessType", "displayName", "slug", "description", "phone", "whatsapp", "email", "website", "instagram", "facebook", "tiktok", "logoUrl", "coverImage", "address", "googleMapsUrl", "businessHours"] as const;
type FormState = Record<typeof fields[number], string>;
const emptyForm = (): FormState => Object.fromEntries(fields.map((field) => [field, ""])) as FormState;

export default function BusinessProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!authLoading && (!user || user.role !== "business_account")) navigate(user ? "/dashboard" : "/login"); }, [authLoading, user, navigate]);
  useEffect(() => { if (user?.role !== "business_account") return; fetch(`${BASE}/api/business/me`, { credentials: "include" }).then((res) => res.json()).then((data) => setForm((current) => Object.fromEntries(fields.map((field) => [field, data[field] ?? current[field]])) as FormState)).catch(() => toast.error("Unable to load profile.")).finally(() => setLoading(false)); }, [user?.role]);
  if (authLoading || loading || !user || user.role !== "business_account") return <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]"><div className="h-8 w-8 rounded-full border-b-2 border-gray-900 animate-spin" /></div>;
  const save = async (event: React.FormEvent) => { event.preventDefault(); const response = await fetch(`${BASE}/api/business/me`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json().catch(() => ({})); if (!response.ok) { toast.error(data.error || "Unable to save profile."); return; } setForm((current) => Object.fromEntries(fields.map((field) => [field, data[field] ?? current[field]])) as FormState); toast.success("Business Profile saved."); };
  return <div className="min-h-screen bg-[#fdfdfc] flex flex-col"><SiteHeader navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} rightSlot={<><button onClick={() => navigate("/business/dashboard")} className="text-gray-500"><User size={18} /></button><button onClick={async () => { await logout(); navigate("/"); }} className="text-gray-500"><LogOut size={18} /></button></>} /><SharedNavDrawer navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} /><main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12"><button onClick={() => navigate("/business/dashboard")} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500"><ArrowLeft size={15} /> Back to dashboard</button><h1 className="text-3xl font-serif text-gray-900">Business Profile</h1><p className="mt-1 mb-8 text-sm text-gray-500">This profile powers your public business page and invitation footer.</p><form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-6 grid sm:grid-cols-2 gap-5">{fields.map((field) => <label key={field} className={field === "description" ? "sm:col-span-2" : ""}><span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{field.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</span>{field === "description" || field === "address" ? <textarea rows={field === "description" ? 4 : 2} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /> : <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />}</label>)}<button className="sm:col-span-2 justify-self-start inline-flex items-center gap-2 bg-gray-900 text-white rounded-lg px-5 py-2.5 text-sm font-semibold"><Save size={15} /> Save profile</button></form></main><SiteFooter /></div>;
}