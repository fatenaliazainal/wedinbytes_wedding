import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import { ArrowRight, BriefcaseBusiness, Calendar, CheckCircle2, Copy, Check, CreditCard, ExternalLink, Link2, LogOut, Plus, ReceiptText, Settings, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";
import { startToyyibPayCheckout } from "@/lib/toyyibpay";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

type BusinessProfile = {
  businessName: string; businessType: string; displayName: string; slug: string;
  description?: string | null; logoUrl?: string | null; invitationCount?: number;
};
type Client = { id: number; brideName: string; groomName: string; phone?: string | null; email?: string | null; eventDate?: string | null; notes?: string | null; status: string; invitationId?: number | null; invitationToken?: string | null };
type Invitation = { id: number; token: string; brideName: string; groomName: string; eventDate?: string | null; eventType: string; venueCity?: string | null; isPurchased: boolean };
type FormField = {
  key: string;
  label: string;
  type: "text" | "email" | "date" | "tel" | "url" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | boolean;
  validation?: { minLength?: number; maxLength?: number; pattern?: string };
};
type BusinessPackage = {
  id: number;
  name: string;
  price: string;
  description: string;
  formConfig?: { fields?: FormField[]; hiddenFields?: Record<string, string | boolean | number | null> };
};
type PaymentHistoryItem = {
  id: number;
  amount: string;
  paymentStatus: string;
  paymentReference?: string | null;
  paymentGateway?: string | null;
  paidAt?: string | null;
  createdAt: string;
  packageName?: string | null;
  invitation?: { id: number; brideName: string; groomName: string } | null;
};

export default function BusinessDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [section, setSection] = useState<"dashboard" | "clients" | "invitations" | "analytics" | "paymentHistory" | "settings">("dashboard");
  const [packages, setPackages] = useState<BusinessPackage[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [formShareUrl, setFormShareUrl] = useState("");
  const [formShareLoading, setFormShareLoading] = useState(false);
  const [copyingFormLink, setCopyingFormLink] = useState(false);
  const [creatingInvitationFor, setCreatingInvitationFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [deleteInvitation, setDeleteInvitation] = useState<Invitation | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [paymentStartingFor, setPaymentStartingFor] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "business_account")) {
      navigate(user ? "/dashboard" : "/login");
    }
  }, [authLoading, user, navigate]);

  const load = async () => {
    setBusy(true);
    try {
      const [profileRes, clientsRes, invitationsRes, packagesRes, paymentHistoryRes] = await Promise.all([
        fetch(`${BASE}/api/business/me`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/business/clients`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/business/invitations`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/pricing`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/business/payment-history`, { credentials: "include", cache: "no-store" }),
      ]);
      if (!profileRes.ok) throw new Error("Unable to load Business Profile.");
      setProfile(await profileRes.json());
      setClients(clientsRes.ok ? await clientsRes.json() : []);
      setInvitations(invitationsRes.ok ? await invitationsRes.json() : []);
      setPackages(packagesRes.ok ? await packagesRes.json() : []);
      setPaymentHistory(paymentHistoryRes.ok ? await paymentHistoryRes.json() : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (user?.role === "business_account") void load(); }, [user?.role]);

  const upcoming = useMemo(() => invitations.filter((item) => item.eventDate && new Date(item.eventDate) >= new Date()).length, [invitations]);
  const selectedPackage = packages.find((pkg) => String(pkg.id) === selectedPackageId);
  const createFormShare = async () => {
    if (!selectedPackageId) {
      toast.error("Select a package before creating the customer form link.");
      return;
    }
    setFormShareLoading(true);
    try {
      const response = await fetch(`${BASE}/api/business/form-shares`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: Number(selectedPackageId) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "Unable to create form link.");
        return;
      }
      const url = `${window.location.origin}${BASE}/customer-form/${encodeURIComponent(data.token)}`;
      setFormShareUrl(url);
      toast.success("Customer form link created.");
    } finally {
      setFormShareLoading(false);
    }
  };
  const copyFormLink = async () => {
    if (!formShareUrl) return;
    setCopyingFormLink(true);
    await navigator.clipboard.writeText(formShareUrl);
    toast.success("Customer form link copied.");
    window.setTimeout(() => setCopyingFormLink(false), 1600);
  };
  const createInvitation = async (client: Client) => {
    setCreatingInvitationFor(client.id);
    try {
      const response = await fetch(`${BASE}/api/business/clients/${client.id}/create-invitation`, {
        method: "POST", credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "Unable to create invitation.");
        return;
      }
      setClients((items) => items.map((item) => item.id === client.id ? { ...item, ...data.client, invitationToken: data.invitationToken } : item));
      toast.success("Invitation created from customer details.");
      navigate(`/business/editor?token=${encodeURIComponent(data.invitationToken)}`);
    } finally {
      setCreatingInvitationFor(null);
    }
  };
  const deleteClient = async (id: number) => {
    const response = await fetch(`${BASE}/api/business/clients/${id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) { toast.error("Unable to remove client."); return; }
    setClients((items) => items.filter((item) => item.id !== id));
  };
  const confirmDeleteInvitation = async () => {
    if (!deleteInvitation) return;
    setDeleteSaving(true);
    try {
      const response = await fetch(`${BASE}/api/invitation/${encodeURIComponent(deleteInvitation.token)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete invitation.");
      setInvitations((items) => items.filter((item) => item.token !== deleteInvitation.token));
      setDeleteInvitation(null);
      toast.success("Invitation deleted successfully.");
    } catch {
      toast.error("Failed to delete invitation. Please try again.");
    } finally {
      setDeleteSaving(false);
    }
  };
  const handleLogout = async () => { await logout(); navigate("/"); };
  const startPayment = async (input: { invitationId?: number; orderId?: number }) => {
    const busyId = input.orderId ?? input.invitationId ?? null;
    setPaymentStartingFor(busyId);
    try {
      await startToyyibPayCheckout(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      setPaymentStartingFor(null);
    }
  };

  if (authLoading || busy || !user || user.role !== "business_account") {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]"><div className="h-8 w-8 rounded-full border-b-2 border-gray-900 animate-spin" /></div>;
  }

  const sections = [
    ["dashboard", "Dashboard"], ["clients", "Clients"], ["invitations", "Invitations"],
    ["analytics", "Analytics"], ["paymentHistory", "Payment History"], ["settings", "Settings"],
  ] as const;

  return (
    <div className="min-h-screen bg-[#fdfdfc] flex flex-col font-sans">
      <SiteHeader navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} rightSlot={<><button onClick={() => navigate("/business/profile")} className="text-gray-500 hover:text-gray-900"><User size={18} /></button><button onClick={handleLogout} className="text-gray-500 hover:text-gray-900"><LogOut size={18} /></button></>} />
      <SharedNavDrawer navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />
      {deleteInvitation && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-business-invitation-title"><div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl"><div className="px-6 py-7"><h2 id="delete-business-invitation-title" className="text-lg font-semibold text-gray-900">Delete Invitation?</h2><p className="mt-3 text-sm leading-6 text-gray-600">This action cannot be undone.<br />Your invitation and all related data will be permanently deleted.</p></div><div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4"><button onClick={() => setDeleteInvitation(null)} disabled={deleteSaving} className="rounded px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50">Cancel</button><button onClick={() => void confirmDeleteInvitation()} disabled={deleteSaving} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{deleteSaving ? "Deleting..." : "Delete"}</button></div></div></div>}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 shrink-0">
            <div className="mb-6"><p className="text-xs uppercase tracking-widest text-gray-400">Business Account</p><h1 className="mt-1 text-2xl font-serif text-gray-900">{profile?.businessName || user.name}</h1></div>
            <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1">
              {sections.map(([id, label]) => <button key={id} onClick={() => setSection(id)} className={`text-left rounded-lg px-3 py-2.5 text-sm ${section === id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{label}</button>)}
            </nav>
          </aside>
          <section className="flex-1 min-w-0">
            {section === "dashboard" && <><div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><h2 className="text-3xl font-serif text-gray-900">Welcome back</h2><p className="mt-1 text-sm text-gray-500">{profile?.displayName || user.name}. Manage your clients and invitations in one place.</p></div><button onClick={() => setSection("clients")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> New customer</button></div>
               <div className="grid sm:grid-cols-3 gap-4 mb-8">{([
                { Icon: Calendar, value: invitations.length, label: "Total invitations" },
                { Icon: Users, value: clients.length, label: "Clients" },
                { Icon: CheckCircle2, value: upcoming, label: "Upcoming events" },
              ] as const).map(({ Icon, value, label }) => <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"><Icon size={20} className="text-gray-500" /><p className="mt-4 text-2xl font-bold text-gray-900">{value}</p><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p></div>)}</div>
               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-semibold text-gray-900">Recent invitations</h3><button onClick={() => setSection("invitations")} className="text-xs text-gray-500 hover:text-gray-900">View all</button></div>{invitations.slice(0, 5).map((item) => <div key={item.id} className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4"><div><p className="font-medium text-gray-900">{item.groomName} & {item.brideName}</p><p className="text-xs text-gray-500">{item.eventDate || "Date not set"} · {item.eventType}</p></div><a href={`/invite/${item.token}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-gray-700 inline-flex gap-1 items-center">View <ArrowRight size={13} /></a></div>)}{!invitations.length && <p className="p-8 text-sm text-gray-500 text-center">No invitations yet. Create one for your first client.</p>}</div>
            </>}
             {section === "clients" && <><div className="mb-6"><h2 className="text-2xl font-serif text-gray-900">Customer form</h2><p className="text-sm text-gray-500 mt-1">Choose whether you want to share a customer link or fill in the invitation yourself.</p></div><div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-end"><label className="block flex-1 text-sm text-gray-700"><span className="mb-1 block font-medium">Package for customer form</span><select value={selectedPackageId} onChange={(event) => { setSelectedPackageId(event.target.value); setFormShareUrl(""); }} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"><option value="">Choose a package</option>{packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · RM{pkg.price}</option>)}</select></label><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => navigate("/business/editor?new=1")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"><Plus size={16} /> Fill in yourself</button><button type="button" onClick={() => void createFormShare()} disabled={formShareLoading || !selectedPackageId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Link2 size={16} />{formShareLoading ? "Creating link..." : "Create share link"}</button></div></div>{selectedPackage && <p className="mt-4 text-xs text-gray-500">{selectedPackage.description}</p>}{formShareUrl && <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Copy this link for your customer</p><div className="flex items-center gap-2"><input readOnly value={formShareUrl} onClick={(event) => event.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none" aria-label="Customer form link" /><button type="button" onClick={() => void copyFormLink()} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200">{copyingFormLink ? <Check size={14} /> : <Copy size={14} />} {copyingFormLink ? "Copied" : "Copy"}</button><a href={formShareUrl} target="_blank" rel="noreferrer" className="rounded-md border border-gray-200 bg-white p-2 text-gray-500 hover:text-gray-900" aria-label="Open customer form"><ExternalLink size={14} /></a></div></div>}</div><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-gray-900">Customer submissions</h3><span className="text-xs text-gray-500">{clients.length} customer{clients.length === 1 ? "" : "s"}</span></div><div className="bg-white border border-gray-200 rounded-xl divide-y">{clients.map((client) => <div key={client.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="font-medium">{client.groomName || "Customer submission"}{client.brideName ? ` & ${client.brideName}` : ""}</p><p className="text-xs text-gray-500">{client.email || "No email"} · {client.eventDate || "Date not set"}</p><span className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600">{client.invitationId ? "Invitation created" : "Waiting for invitation"}</span></div><div className="flex items-center gap-3"><button onClick={() => client.invitationId && client.invitationToken ? navigate(`/business/editor?token=${encodeURIComponent(client.invitationToken)}`) : void createInvitation(client)} disabled={creatingInvitationFor === client.id} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{client.invitationId ? "Edit Invitation" : creatingInvitationFor === client.id ? "Creating..." : "Create Invitation"}</button><button onClick={() => void deleteClient(client.id)} className="text-gray-400 hover:text-red-600" aria-label="Delete client"><Trash2 size={16} /></button></div></div>)}{!clients.length && <p className="p-8 text-sm text-gray-500 text-center">No customer submissions yet.</p>}</div></>}
              {section === "invitations" && <><div className="flex justify-between items-end mb-6"><div><h2 className="text-2xl font-serif text-gray-900">Invitations</h2><p className="text-sm text-gray-500 mt-1">Your business-owned invitations.</p></div><button onClick={() => setSection("clients")} className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold"><Plus size={15} /> New customer</button></div><div className="bg-white border border-gray-200 rounded-xl divide-y">{invitations.map((item) => <div key={item.id} className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.groomName} & {item.brideName}</p><p className="text-xs text-gray-500">{item.eventDate || "Date not set"} · {item.venueCity || "Venue not set"}</p></div><div className="flex flex-wrap items-center gap-3 text-xs font-semibold"><span className={`rounded-full px-2 py-1 ${item.isPurchased ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.isPurchased ? "Active" : "Pending payment"}</span>{!item.isPurchased && <button onClick={() => void startPayment({ invitationId: item.id })} disabled={paymentStartingFor === item.id} className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-white disabled:opacity-60"><CreditCard size={13} /> {paymentStartingFor === item.id ? "Starting..." : "Pay Now"}</button>}<button onClick={() => navigate(`/business/editor?token=${encodeURIComponent(item.token)}`)} className="text-gray-700">Edit</button><a href={`/invite/${item.token}`} target="_blank" rel="noreferrer" className="text-gray-500">Preview</a><button onClick={() => setDeleteInvitation(item)} className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600" aria-label={`Delete invitation for ${item.groomName} and ${item.brideName}`}><Trash2 size={13} /> Delete</button></div></div>)}{!invitations.length && <p className="p-8 text-sm text-gray-500 text-center">No invitations yet.</p>}</div></>}
              {section === "paymentHistory" && (
                <div className="space-y-6" data-testid="payment-history-page">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      <ReceiptText size={13} className="text-gray-900" />
                      Payment records
                    </div>
                    <h2 className="text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl" data-testid="text-payment-history-title">Payment History</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                      View your completed payments for business invitations.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" data-testid="card-payment-history">
                    {paymentHistory.length ? (
                      <div className="divide-y divide-gray-100">
                        {paymentHistory.map((payment) => (
                          <div key={payment.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">
                                {payment.invitation ? `${payment.invitation.groomName} & ${payment.invitation.brideName}` : payment.packageName || "Wedding invitation"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {payment.packageName || "Invitation package"} · {payment.paymentReference || "Payment completed"}
                              </p>
                              <p className="mt-2 text-xs text-gray-400">
                                {new Date(payment.paidAt || payment.createdAt).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                               {payment.paymentStatus.toUpperCase() === "PAID" ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Paid</span> : payment.paymentStatus.toUpperCase() === "PENDING" ? <button onClick={() => void startPayment({ orderId: payment.id })} disabled={paymentStartingFor === payment.id} className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60"><CreditCard size={12} /> {paymentStartingFor === payment.id ? "Starting..." : "Pay Now"}</button> : <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Failed</span>}
                              <span className="text-lg font-semibold text-gray-900">RM {Number(payment.amount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-16 text-center">
                        <ReceiptText size={30} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No payment history yet</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">Your completed payments will appear here once a payment has been made.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(section === "analytics" || section === "settings") && <div className="bg-white rounded-xl border border-gray-200 p-8"><BriefcaseBusiness size={24} className="text-gray-400" /><h2 className="mt-4 text-2xl font-serif text-gray-900">{sections.find(([id]) => id === section)?.[1]}</h2><p className="mt-2 text-sm text-gray-500">This Business Account area is ready for the next product phase. Payment and analytics logic remain intentionally deferred.</p>{section === "settings" && <button onClick={() => navigate("/business/profile")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"><Settings size={15} /> Edit business profile</button>}</div>}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}