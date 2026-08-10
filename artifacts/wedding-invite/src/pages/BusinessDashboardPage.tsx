import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Link2,
  LogOut,
  MoreVertical,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { startToyyibPayCheckout } from "@/lib/toyyibpay";
import { startBillplzCheckout, getPaymentMethodConfig, type PaymentMethodConfig } from "@/lib/billplz";
import GatewaySelectionModal from "@/components/GatewaySelectionModal";
import PaymentMethodsNotice from "@/components/PaymentMethodsNotice";
import { publicInvitePathOrToken } from "@/lib/invite-url";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PACKAGES", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "FOR BUSINESS", href: "/for-business" },
];

type BusinessProfile = {
  businessName: string;
  businessType: string;
  invitationCount?: number;
};
type Client = {
  id: number;
  brideName: string;
  groomName: string;
  email?: string | null;
  eventDate?: string | null;
  createdAt?: string | null;
  invitationId?: number | null;
  invitationToken?: string | null;
  phone?: string | null;
  packageId?: number | null;
};
type Invitation = {
  id: number;
  token: string;
  brideName: string;
  groomName: string;
  coverBrideName?: string | null;
  coverGroomName?: string | null;
  eventDate?: string | null;
  eventType: string;
  venueCity?: string | null;
  packageId?: number | null;
  isPurchased: boolean;
};
type FormField = {
  key: string;
  label: string;
  type: "text" | "email" | "date" | "tel" | "url" | "textarea" | "checkbox";
  required?: boolean;
};
type BusinessPackage = {
  id: number;
  name: string;
  price: string;
  description: string;
  formConfig?: { fields?: FormField[] };
};
type PaymentHistoryItem = {
  id: number;
  amount: string;
  paymentStatus: string;
  paymentReference?: string | null;
  gatewayRefNo?: string | null;
  paidAt?: string | null;
  createdAt: string;
  packageName?: string | null;
  invitation?: { id: number; brideName: string; groomName: string } | null;
};

function businessNamePathSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDaysUntilEvent(eventDate: string | null | undefined): number | null {
  if (!eventDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  const diff = event.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatCountdown(days: number | null): { label: string; variant: "default" | "warning" | "success" | "muted" } {
  if (days === null) return { label: "Date not set", variant: "muted" };
  if (days < 0) return { label: "Event Passed", variant: "muted" };
  if (days === 0) return { label: "Today", variant: "success" };
  if (days === 1) return { label: "Tomorrow", variant: "warning" };
  return { label: `${days} Days Remaining`, variant: "default" };
}

export default function BusinessDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [section, setSection] = useState<"dashboard" | "clients" | "paymentHistory">(() => {
    const value = new URLSearchParams(window.location.search).get("section");
    if (value === "paymentHistory") return value;
    if (value === "invitations") return "clients";
    return value === "clients" ? value : "dashboard";
  });
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
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodConfig | null>(null);
  const [gatewayModalInput, setGatewayModalInput] = useState<{ invitationId?: number; orderId?: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "date" | "alpha">("newest");
  const [openClientMenuId, setOpenClientMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "business_account")) {
      navigate(user ? dashboardPathForUser(user) : "/login");
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

  useEffect(() => {
    if (user?.role === "business_account") void load();
  }, [user?.role]);

  // Silently refresh only the clients list — called by polling and visibility change.
  const refreshClients = async () => {
    if (user?.role !== "business_account") return;
    try {
      const res = await fetch(`${BASE}/api/business/clients`, { credentials: "include", cache: "no-store" });
      if (res.ok) setClients(await res.json());
    } catch {
      // silent — keep stale data rather than showing an error for background polls
    }
  };

  // Poll every 30 s so new form submissions appear without a manual reload.
  useEffect(() => {
    if (user?.role !== "business_account") return;
    const id = setInterval(() => { void refreshClients(); }, 30_000);
    return () => clearInterval(id);
  }, [user?.role]);

  // Refresh immediately whenever the planner switches back to this tab.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") void refreshClients(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.role]);

  const upcoming = useMemo(
    () => invitations.filter((item) => item.eventDate && new Date(item.eventDate) >= new Date()).length,
    [invitations],
  );
  const selectedPackage = packages.find((pkg) => String(pkg.id) === selectedPackageId);

  const recentCustomersCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return clients.filter((client) => client.createdAt && new Date(client.createdAt) >= thirtyDaysAgo).length;
  }, [clients]);

  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.groomName?.toLowerCase().includes(query) ||
          c.brideName?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
      );
    }

    // Package filter
    if (packageFilter) {
      filtered = filtered.filter((c) => String(c.packageId) === packageFilter);
    }

    // Month filter
    if (monthFilter) {
      filtered = filtered.filter((c) => {
        if (!c.eventDate) return false;
        const eventMonth = new Date(c.eventDate).toISOString().slice(0, 7);
        return eventMonth === monthFilter;
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sortBy === "date") {
      filtered.sort((a, b) => {
        if (!a.eventDate) return 1;
        if (!b.eventDate) return -1;
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      });
    } else if (sortBy === "alpha") {
      filtered.sort((a, b) => {
        const nameA = `${a.groomName || ""} ${a.brideName || ""}`.trim();
        const nameB = `${b.groomName || ""} ${b.brideName || ""}`.trim();
        return nameA.localeCompare(nameB);
      });
    }

    return filtered;
  }, [clients, searchQuery, packageFilter, monthFilter, sortBy]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    clients.forEach((c) => {
      if (c.eventDate) {
        months.add(new Date(c.eventDate).toISOString().slice(0, 7));
      }
    });
    return Array.from(months).sort();
  }, [clients]);

  const createFormShare = async () => {
    if (!selectedPackageId) {
      toast.error("Select a package before creating the order form link.");
      return;
    }
    setFormShareLoading(true);
    try {
      const response = await fetch(`${BASE}/api/business/form-shares`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: Number(selectedPackageId) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "Unable to create form link.");
        return;
      }
      const businessNameSegment = businessNamePathSegment(profile?.businessName || user?.name || "");
      if (!businessNameSegment) {
        toast.error("Set your Business name before creating an order form link.");
        return;
      }
      setFormShareUrl(`${window.location.origin}${BASE}/business/${encodeURIComponent(businessNameSegment)}/customer-form/${encodeURIComponent(data.token)}`);
      toast.success("Order form link created.");
    } finally {
      setFormShareLoading(false);
    }
  };

  const copyFormLink = async () => {
    if (!formShareUrl) return;
    setCopyingFormLink(true);
    await navigator.clipboard.writeText(formShareUrl);
    toast.success("Order form link copied.");
    window.setTimeout(() => setCopyingFormLink(false), 1600);
  };

  const createInvitation = async (client: Client) => {
    setCreatingInvitationFor(client.id);
    try {
      const response = await fetch(`${BASE}/api/business/clients/${client.id}/create-invitation`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || "Unable to create invitation.");
        return;
      }
      setClients((items) => items.map((item) => item.id === client.id
        ? { ...item, ...data.client, invitationToken: data.invitationToken }
        : item));
      toast.success("Invitation created from order form.");
      navigate(`/business/editor?token=${encodeURIComponent(data.invitationToken)}`);
    } finally {
      setCreatingInvitationFor(null);
    }
  };

  const deleteClient = async (id: number) => {
    const response = await fetch(`${BASE}/api/business/clients/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      toast.error("Unable to remove order form submission.");
      return;
    }
    setClients((items) => items.filter((item) => item.id !== id));
  };

  const confirmDeleteInvitation = async () => {
    if (!deleteInvitation) return;
    setDeleteSaving(true);
    try {
      const response = await fetch(`${BASE}/api/invitation/${encodeURIComponent(deleteInvitation.token)}`, {
        method: "DELETE",
        credentials: "include",
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

  const reconcileStatus = async (orderId: number) => {
    try {
      const res = await fetch(`${BASE}/api/payment/toyyibpay/status?orderId=${orderId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json() as { status?: string };
      if (data.status === "PAID") {
        const histRes = await fetch(`${BASE}/api/business/payment-history`, { credentials: "include", cache: "no-store" });
        if (histRes.ok) setPaymentHistory(await histRes.json());
        toast.success("Payment confirmed! Your invitation is now active.");
      } else {
        toast.info("Payment is still pending. Please check again in a few minutes.");
      }
    } catch {
      // Silently ignore — user can retry manually
    }
  };

  const startPayment = async (input: { invitationId?: number; orderId?: number }) => {
    if (input.invitationId != null) {
      const card = invitations.find(c => c.id === input.invitationId);
      if (card) {
        const missing: string[] = [];
        if (!(card.coverGroomName || card.groomName)?.trim()) missing.push("Nama pengantin lelaki");
        if (!(card.coverBrideName || card.brideName)?.trim()) missing.push("Nama pengantin perempuan");
        if (!card.eventDate) missing.push("Event date");
        if (missing.length > 0) {
          toast.error(`Please fill in the following before proceeding with payment: ${missing.join(", ")}.`, { duration: 5000 });
          return;
        }
      }
    }

    let config = paymentConfig;
    if (!config) {
      try { config = await getPaymentMethodConfig(); setPaymentConfig(config); }
      catch { config = { toyyibpayEnabled: true, billplzEnabled: false }; }
    }

    const { toyyibpayEnabled, billplzEnabled } = config;
    if (!toyyibpayEnabled && !billplzEnabled) {
      toast.error("No payment methods are currently available. Please contact support.");
      return;
    }
    if (toyyibpayEnabled && billplzEnabled) { setGatewayModalInput(input); return; }
    await executePayment(input, toyyibpayEnabled ? "toyyibpay" : "billplz");
  };

  const executePayment = async (
    input: { invitationId?: number; orderId?: number },
    gateway: "toyyibpay" | "billplz",
  ) => {
    const busyId = input.orderId ?? input.invitationId ?? null;
    setPaymentStartingFor(busyId);
    setGatewayModalInput(null);
    try {
      const result = gateway === "toyyibpay"
        ? await startToyyibPayCheckout(input)
        : await startBillplzCheckout(input);
      if (result.replacedExpired) {
        toast.info("Your previous payment session had expired. Starting a new payment.");
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      window.location.assign(result.paymentUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      setPaymentStartingFor(null);
    }
  };

  if (authLoading || busy || !user || user.role !== "business_account") {
    return (
      <div className="min-h-screen bg-[#fdfdfc] flex flex-col font-sans">
        <div className="h-14 bg-white border-b border-gray-200" />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-56 shrink-0">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-6" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </aside>
            <section className="flex-1 min-w-0">
              <div className="h-10 bg-gray-200 rounded animate-pulse mb-8" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse mb-4" />
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const sections = [
    ["dashboard", "Dashboard"],
    ["clients", "Order Forms & Invitations"],
    ["paymentHistory", "Payment History"],
  ] as const;

  return (
    <div className="min-h-screen bg-[#fdfdfc] flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          <>
            <button onClick={() => navigate("/business/profile")} className="text-gray-500 hover:text-gray-900" aria-label="Profile details"><User size={18} /></button>
            <button onClick={async () => { await logout(); navigate("/"); }} className="text-gray-500 hover:text-gray-900" aria-label="Log out"><LogOut size={18} /></button>
          </>
        }
      />
      <SharedNavDrawer navItems={NAV_ITEMS} navOpen={navOpen} setNavOpen={setNavOpen} />
      {deleteInvitation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="px-6 py-7">
              <h2 className="text-lg font-semibold text-gray-900">Delete Invitation?</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">This action cannot be undone.<br />Your invitation and all related data will be permanently deleted.</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setDeleteInvitation(null)} disabled={deleteSaving} className="rounded px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={() => void confirmDeleteInvitation()} disabled={deleteSaving} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white">{deleteSaving ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 shrink-0">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-gray-400">Business Account</p>
              <h1 className="mt-1 text-2xl font-serif text-gray-900">{profile?.businessName || user.name}</h1>
            </div>
            <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1">
              {sections.map(([id, label]) => (
                <button key={id} onClick={() => setSection(id)} className={`text-left rounded-lg px-3 py-2.5 text-sm ${section === id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  {label}
                </button>
              ))}
              <button
                onClick={() => navigate("/business/profile")}
                className="text-left rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Profile Details
              </button>
            </nav>
          </aside>

          <section className="flex-1 min-w-0">
            {section === "dashboard" && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-gray-900">Welcome back</h2>
                  <p className="mt-2 text-sm text-gray-600">Here's an overview of your business invitations</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow" data-testid="card-total-customers">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Users size={20} className="text-green-600" />
                      </div>
                      <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-total-order-forms">{clients.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Order Forms Submitted</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow" data-testid="card-total-invitations">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                        <Calendar size={20} className="text-pink-600" />
                      </div>
                      <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-total-invitations">{invitations.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Invitations</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow" data-testid="card-upcoming-events">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-yellow-600" />
                      </div>
                      <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-upcoming-events">{upcoming}</p>
                    <p className="text-sm text-gray-600 mt-1">Upcoming Events</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow" data-testid="card-recent-customers">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-recent-submissions">{recentCustomersCount}</p>
                    <p className="text-sm text-gray-600 mt-1">Recent Submissions</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Invitations</h3>
                    <button onClick={() => setSection("clients")} className="text-sm text-green-600 hover:text-green-700 font-medium" data-testid="button-view-all-invitations">View all</button>
                  </div>
                  {invitations.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {invitations.slice(0, 5).map((item) => {
                        const days = getDaysUntilEvent(item.eventDate);
                        const countdown = formatCountdown(days);
                        return (
                          <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors" data-testid={`row-invitation-${item.id}`}>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{[item.groomName, item.brideName].filter(Boolean).join(" & ") || "Untitled Invitation"}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{item.eventDate ? new Date(item.eventDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "Date not set"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full ${countdown.variant === "success" ? "bg-green-50 text-green-700" : countdown.variant === "warning" ? "bg-yellow-50 text-yellow-700" : countdown.variant === "muted" ? "bg-gray-50 text-gray-500" : "bg-blue-50 text-blue-700"}`}>
                                {countdown.label}
                              </span>
                              {publicInvitePathOrToken(item) ? (
                                <a href={publicInvitePathOrToken(item) ?? undefined} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1" data-testid={`link-preview-invitation-${item.id}`}>
                                  View <ArrowRight size={14} />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                        <Calendar size={28} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No invitations yet</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Start by creating an order form or fill in an invitation yourself</p>
                      <button onClick={() => setSection("clients")} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors" data-testid="button-create-first-invitation">
                        <Plus size={16} /> Create Invitation
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {section === "clients" && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold text-gray-900">Order Forms & Invitations</h2>
                  <p className="text-sm text-gray-600 mt-2">Review submitted order forms and create invitations</p>
                </div>

                {/* Process Guide */}
                <div className="bg-gradient-to-br from-green-50 to-pink-50 border border-gray-200 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">How it works</h3>
                  <div className="grid sm:grid-cols-5 gap-4">
                    {[
                      { step: "1", label: "Select Package", icon: Calendar },
                      { step: "2", label: "Generate Form Link", icon: Link2 },
                      { step: "3", label: "Order Form Submitted", icon: ReceiptText },
                      { step: "4", label: "Review Order Form", icon: CheckCircle2 },
                      { step: "5", label: "Create Invitation", icon: Plus },
                    ].map(({ step, label, icon: Icon }, idx) => (
                      <div key={step} className="relative">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-2">
                            <Icon size={20} className="text-gray-500" />
                          </div>
                          <p className="text-xs font-medium text-gray-700">{label}</p>
                        </div>
                        {idx < 4 && (
                          <div className="hidden sm:block absolute top-6 left-full w-full h-0.5 bg-gray-200" style={{ transform: "translateX(-50%)" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                  {/* Create Order Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Create Order Form</h3>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <label className="block flex-1 text-sm text-gray-700">
                      <span className="mb-2 block font-medium">Select Package</span>
                      <select value={selectedPackageId} onChange={(event) => { setSelectedPackageId(event.target.value); setFormShareUrl(""); }} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:shadow-md focus:ring-0" data-testid="select-package">
                        <option value="">Choose a package</option>
                        {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · RM{pkg.price}</option>)}
                      </select>
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={() => navigate("/business/editor?new=1")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" data-testid="button-fill-yourself">
                        <Plus size={16} /> Fill in yourself
                      </button>
                      <button type="button" onClick={() => void createFormShare()} disabled={formShareLoading || !selectedPackageId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-gray-800 transition-colors" data-testid="button-create-share-link">
                        <Link2 size={16} />{formShareLoading ? "Creating..." : "Create Order Form Link"}
                      </button>
                    </div>
                  </div>
                  {selectedPackage && <p className="mt-4 text-sm text-gray-600">{selectedPackage.description}</p>}
                  {formShareUrl && (
                    <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-700">Share this order form link</p>
                      <div className="flex items-center gap-2">
                        <input readOnly value={formShareUrl} onClick={(event) => event.currentTarget.select()} className="min-w-0 flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none" aria-label="Customer form link" data-testid="input-form-share-url" />
                        <button type="button" onClick={() => void copyFormLink()} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white border border-green-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-green-100 transition-colors" data-testid="button-copy-form-link">
                          {copyingFormLink ? <Check size={14} /> : <Copy size={14} />} {copyingFormLink ? "Copied" : "Copy"}
                        </button>
                        <a href={formShareUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-green-200 bg-white p-2 text-gray-600 hover:bg-green-100 transition-colors" aria-label="Open customer form" data-testid="link-open-form">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Form Submissions */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Order Form Submissions</h3>
                    <span className="text-sm text-gray-500">{filteredAndSortedClients.length} of {clients.length}</span>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search order forms by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                          data-testid="input-search-customers"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" data-testid="button-clear-search">
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" data-testid="select-filter-package">
                        <option value="">All Packages</option>
                        {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
                      </select>

                      <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" data-testid="select-filter-month">
                        <option value="">All Months</option>
                        {availableMonths.map((month) => (
                          <option key={month} value={month}>
                            {new Date(month + "-01").toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
                          </option>
                        ))}
                      </select>

                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "date" | "alpha")} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100" data-testid="select-sort-by">
                        <option value="newest">Sort by: Newest</option>
                        <option value="date">Sort by: Wedding Date</option>
                        <option value="alpha">Sort by: Alphabetical</option>
                      </select>
                    </div>
                  </div>

                  {/* Order Form Submission Rows */}
                  {filteredAndSortedClients.length > 0 ? (
                    <div className="overflow-visible rounded-xl border border-gray-200 bg-white">
                      {filteredAndSortedClients.map((client) => {
                        const days = getDaysUntilEvent(client.eventDate);
                        const countdown = formatCountdown(days);
                        const packageName = packages.find((p) => p.id === client.packageId)?.name || "Package";

                        return (
                          <div key={client.id} className="relative grid gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50/70 sm:px-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(190px,1fr)_minmax(170px,auto)] lg:items-center" data-testid={`row-order-form-${client.id}`}>
                            <div className="min-w-0">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-semibold text-gray-900">
                                    {client.groomName || "Order form submission"}{client.brideName ? ` & ${client.brideName}` : ""}
                                  </h4>
                                  <p className="mt-0.5 truncate text-xs text-gray-500">Order form submitted · {packageName}</p>
                                </div>
                                <div className="relative shrink-0 lg:hidden">
                                  <button
                                    onClick={() => setOpenClientMenuId((current) => current === client.id ? null : client.id)}
                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    aria-label={`More actions for ${client.groomName || "order form submission"}`}
                                    data-testid={`button-more-customer-${client.id}`}
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="grid min-w-0 grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2 lg:grid-cols-1">
                              <span className="truncate">
                                <Calendar size={13} className="mr-1.5 inline-block text-gray-400" />
                                {client.eventDate ? new Date(client.eventDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "Date not set"}
                              </span>
                              <span className={`font-medium ${client.invitationId ? "text-green-700" : "text-gray-500"}`}>
                                {client.invitationId ? "Invitation created" : "Invitation not created"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                              <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${countdown.variant === "success" ? "bg-green-50 text-green-700" : countdown.variant === "warning" ? "bg-yellow-50 text-yellow-700" : countdown.variant === "muted" ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700"}`}>
                                {countdown.label}
                              </span>
                              <button
                                onClick={() => client.invitationId && client.invitationToken ? navigate(`/business/editor?token=${encodeURIComponent(client.invitationToken)}`) : void createInvitation(client)}
                                disabled={creatingInvitationFor === client.id}
                                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                data-testid={`button-${client.invitationId ? "edit" : "create"}-invitation-${client.id}`}
                              >
                                {client.invitationId ? "Edit Invitation" : creatingInvitationFor === client.id ? "Creating..." : "Create Invitation"}
                              </button>
                              <button
                                onClick={() => void deleteClient(client.id)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                aria-label="Delete order form submission"
                                data-testid={`button-delete-order-form-${client.id}`}
                              >
                                <Trash2 size={16} />
                              </button>
                              <div className="relative hidden lg:block">
                                <button
                                  onClick={() => setOpenClientMenuId((current) => current === client.id ? null : client.id)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                  aria-label={`More actions for ${client.groomName || "order form submission"}`}
                                  data-testid={`button-more-customer-${client.id}`}
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </div>
                            {openClientMenuId === client.id && (
                              <div className="absolute right-4 top-12 z-10 w-48 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                                {client.invitationToken && invitations.some((item) => item.token === client.invitationToken) && (
                                  <>
                                    {(() => {
                                      const inv = invitations.find((item) => item.token === client.invitationToken)!;
                                      const path = publicInvitePathOrToken(inv);
                                      return path ? (
                                        <a href={path} target="_blank" rel="noreferrer" onClick={() => setOpenClientMenuId(null)} className="block rounded-md px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50">
                                          Preview invitation
                                        </a>
                                      ) : null;
                                    })()}
                                    <button onClick={async () => {
                                      const invitation = invitations.find((item) => item.token === client.invitationToken);
                                      if (!invitation) return;
                                      const path = publicInvitePathOrToken(invitation);
                                      if (!path) return;
                                      await navigator.clipboard.writeText(`${window.location.origin}${BASE}${path}`);
                                      toast.success("Invitation link copied");
                                      setOpenClientMenuId(null);
                                    }} className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50">
                                      Copy invitation link
                                    </button>
                                  </>
                                )}
                                <button onClick={() => {
                                  setOpenClientMenuId(null);
                                  void deleteClient(client.id);
                                }} className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">
                                  Delete order form submission
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                        <ReceiptText size={28} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No order form submissions yet</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Create an order form link and share it to start collecting submissions</p>
                      <button onClick={() => document.querySelector<HTMLSelectElement>('[data-testid="select-package"]')?.focus()} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors" data-testid="button-create-first-form">
                        <Link2 size={16} /> Create Order Form
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                        <Search size={28} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No order forms found</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Try adjusting your search or filter criteria</p>
                      <button onClick={() => { setSearchQuery(""); setPackageFilter(""); setMonthFilter(""); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" data-testid="button-clear-filters">
                        <X size={16} /> Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Business Invitations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Your Invitations</h3>
                      <p className="text-sm text-gray-500 mt-1">Invitations created from your order forms or manually</p>
                    </div>
                    <button onClick={() => navigate("/business/editor?new=1")} className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 transition-colors" data-testid="button-new-invitation">
                      <Plus size={16} /> New Invitation
                    </button>
                  </div>

                  {invitations.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {invitations.map((item) => {
                        const days = getDaysUntilEvent(item.eventDate);
                        const countdown = formatCountdown(days);
                         const publicPath = publicInvitePathOrToken(item);
                         const inviteUrl = publicPath ? `${window.location.origin}${BASE}${publicPath}` : "";
                        const packageName = packages.find((pkg) => pkg.id === item.packageId)?.name;

                        const displayName = [item.groomName, item.brideName].filter(Boolean).join(" & ") || "Untitled Invitation";

                        return (
                          <div key={item.id} className="grid gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0 hover:bg-gray-50/70 sm:px-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(190px,1fr)_minmax(220px,auto)] lg:items-center" data-testid={`row-invitation-${item.id}`}>
                            {/* Name + status */}
                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="truncate text-sm font-semibold text-gray-900">{displayName}</h4>
                                  <p className="mt-0.5 truncate text-xs text-gray-500">{packageName || item.eventType || "—"}</p>
                                </div>
                                <span className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.isPurchased ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                                  {item.isPurchased ? "Active" : "Pending"}
                                </span>
                              </div>
                            </div>

                            {/* Date + venue */}
                            <div className="flex min-w-0 flex-col gap-1 text-xs text-gray-500">
                              <span className="truncate">
                                <Calendar size={13} className="mr-1.5 inline-block text-gray-400" />
                                {item.eventDate ? new Date(item.eventDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "Date not set"}
                              </span>
                              <span className="truncate">{item.venueCity || "Venue not set"}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                              <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${countdown.variant === "success" ? "bg-green-50 text-green-700" : countdown.variant === "warning" ? "bg-yellow-50 text-yellow-700" : countdown.variant === "muted" ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700"}`}>
                                {countdown.label}
                              </span>
                              <button onClick={() => navigate(`/business/editor?token=${encodeURIComponent(item.token)}`)} className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors" data-testid={`button-edit-invitation-${item.id}`}>
                                Edit
                              </button>
                              {publicPath ? (
                                <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors" data-testid={`link-preview-invitation-card-${item.id}`}>
                                  Preview
                                </a>
                              ) : (
                                <button disabled title="Set Cover Groom Name and Cover Bride Name in the editor first" className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400">
                                  Preview
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  const rsvpUrl = `${window.location.origin}${BASE}/rsvp-share/${encodeURIComponent(item.token)}`;
                                  await navigator.clipboard.writeText(rsvpUrl);
                                  toast.success("RSVP link copied");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                                title="Copy shareable RSVP response link"
                                data-testid={`button-copy-rsvp-link-${item.id}`}
                              >
                                <Users size={13} />
                                <span className="hidden sm:inline">RSVP Link</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!inviteUrl) {
                                    toast.info("Set Cover Groom Name, Cover Bride Name and event date in the editor first.");
                                    return;
                                  }
                                  await navigator.clipboard.writeText(inviteUrl);
                                  toast.success("Link copied");
                                }}
                                disabled={!inviteUrl}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Copy invitation link"
                                title={inviteUrl ? "Copy invitation link" : "Set Cover Groom Name, Cover Bride Name and date first"}
                                data-testid={`button-copy-link-${item.id}`}
                              >
                                <Copy size={15} />
                              </button>
                              <button onClick={() => setDeleteInvitation(item)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete invitation for ${displayName}`} data-testid={`button-delete-invitation-${item.id}`}>
                                <Trash2 size={15} />
                              </button>
                              {!item.isPurchased && (
                                <button onClick={() => void startPayment({ invitationId: item.id })} disabled={paymentStartingFor === item.id} className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-60" data-testid={`button-pay-now-${item.id}`}>
                                  {paymentStartingFor === item.id ? "Starting..." : "Pay Now"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                        <Calendar size={28} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No invitations yet</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Create your first invitation or wait for an order form submission</p>
                      <button onClick={() => navigate("/business/editor?new=1")} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors" data-testid="button-create-first-invitation-card">
                        <Plus size={16} /> Create Invitation
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {section === "paymentHistory" && (
              <div className="space-y-6" data-testid="payment-history-page">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500"><ReceiptText size={13} className="text-gray-900" /> Payment records</div>
                  <h2 className="text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl" data-testid="text-payment-history-title">Payment History</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">View your completed payments for business invitations.</p>
                </div>
                <PaymentMethodsNotice />
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" data-testid="card-payment-history">
                  {paymentHistory.length ? (
                    <div className="divide-y divide-gray-100">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {payment.invitation
                                ? [payment.invitation.groomName, payment.invitation.brideName].filter(Boolean).join(" & ") || "Untitled Invitation"
                                : payment.packageName || "Wedding invitation"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">{payment.packageName || "Invitation package"} · {payment.paymentReference || "—"}{payment.gatewayRefNo && <span className="ml-1 text-gray-400">({payment.gatewayRefNo})</span>}</p>
                            <p className="mt-2 text-xs text-gray-400">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          </div>
                          <div className="flex items-center justify-between gap-4 sm:justify-end">
                            {payment.paymentStatus.toUpperCase() === "PAID"
                              ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Paid</span>
                              : payment.paymentStatus.toUpperCase() === "PENDING"
                              ? (
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700">Pending</span>
                                  <button onClick={() => void reconcileStatus(payment.id)} disabled={paymentStartingFor === payment.id} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-800 disabled:opacity-50">Check Status</button>
                                </div>
                              )
                              : payment.paymentStatus.toUpperCase() === "EXPIRED"
                              ? <button onClick={() => void (payment.invitation?.id ? startPayment({ invitationId: payment.invitation.id }) : undefined)} disabled={!payment.invitation?.id || paymentStartingFor === payment.invitation?.id} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 disabled:opacity-50"><CreditCard size={12} /> Retry Payment</button>
                              : <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Failed</span>}
                            <span className="text-lg font-semibold text-gray-900">RM {Number(payment.amount || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-16 text-center"><ReceiptText size={30} className="mx-auto text-gray-300" /><h3 className="mt-4 text-lg font-semibold text-gray-900">No payment history yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">Your completed payments will appear here once a payment has been made.</p></div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />

      {/* Gateway selection modal */}
      {gatewayModalInput && (
        <GatewaySelectionModal
          onSelect={(gateway) => void executePayment(gatewayModalInput, gateway)}
          onClose={() => setGatewayModalInput(null)}
        />
      )}
    </div>
  );
}