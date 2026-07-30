import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit2, Eye, Users, Share2, Lock, LogOut,
  User, Plus, Copy, Check, QrCode, X, Trash2,
  Calendar, Clock, CreditCard, Link2,
  LayoutGrid, List as ListIcon, Activity, AlertCircle, FileText,
  EyeOff, Save, KeyRound, Download, ReceiptText
} from "lucide-react";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import { WeddingCard } from "@/components/WeddingCard";
import type { SiteNavItem } from "@/components/SiteHeader";
import { resolveImageUrl } from "@/lib/r2-url";
import { startToyyibPayCheckout } from "@/lib/toyyibpay";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Invitation {
  id: number;
  token: string;
  groomName: string;
  brideName: string;
  eventType: string;
  eventDate?: string | null;
  brideShortName?: string | null;
  groomShortName?: string | null;
  brideInitial?: string | null;
  groomInitial?: string | null;
  isPurchased: boolean;
  isLocked?: boolean;
  createdAt: string;
  colorPrimary?: string;
  designCode?: string;
}

interface Design {
  cardImageUrl?: string;
  envelopeImageUrl?: string;
  cardMaxWidth?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorBackground?: string;
  colorCard?: string;
  nameFontFamily?: string;
  nameFontSize?: number | string;
  nameColor?: string;
  bodyFontFamily?: string;
  designCode?: string;
}

type Section = "orders" | "paymentHistory" | "profile";
type PaymentHistoryItem = {
  id: number;
  amount: string;
  paymentStatus: string;
  paymentReference?: string | null;
  paymentGateway?: string | null;
  paidAt?: string | null;
  createdAt: string;
  packageName?: string | null;
  invitation?: { brideName: string; groomName: string } | null;
};

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

function paymentStatusMeta(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PAID") {
    return { label: "Paid", className: "border-green-200 bg-green-50 text-green-700" };
  }
  if (normalized === "PENDING") {
    return { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  return { label: "Failed", className: "border-red-200 bg-red-50 text-red-700" };
}

function PaymentHistoryTable({
  payments,
  onDownloadReceipt,
  onPayNow,
}: {
  payments: PaymentHistoryItem[];
  onDownloadReceipt: (payment: PaymentHistoryItem) => void;
  onPayNow: (payment: PaymentHistoryItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-100">
            {["Invoice ID", "Invitation", "Payment Date", "Amount", "Status", "Receipt"].map((heading) => (
              <th key={heading} className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.length ? payments.map((payment) => {
            const status = paymentStatusMeta(payment.paymentStatus);
            const invoiceId = payment.paymentReference || `INV-${payment.id}`;
            return (
              <tr key={payment.id} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{invoiceId}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{payment.invitation ? `${payment.invitation.groomName} & ${payment.invitation.brideName}` : payment.packageName || "Wedding invitation"}</td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">RM {Number(payment.amount || 0).toFixed(2)}</td>
                <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span></td>
                <td className="px-5 py-4">
                  {payment.paymentStatus.toUpperCase() === "PAID" ? (
                    <button onClick={() => onDownloadReceipt(payment)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><Download size={14} /> Download Receipt</button>
                  ) : payment.paymentStatus.toUpperCase() === "PENDING" ? (
                     <button onClick={() => onPayNow(payment)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"><CreditCard size={14} /> Pay Now</button>
                  ) : (
                    <span className="text-xs text-slate-400">Not available</span>
                  )}
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <ReceiptText size={30} className="mx-auto text-slate-300" />
                <h4 className="mt-4 text-lg font-bold text-slate-900">No payment history yet.</h4>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Your invoice and payment records will appear here once an order is created.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const isExpired = (createdAt?: string) => {
  if (!createdAt) return false;
  const expiry = new Date(new Date(createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);
  return expiry < new Date();
};

function ThumbnailView({ card, design, width = 100, height = 180, scale = 0.219 }: { card: Invitation, design: Design | null, width?: number, height?: number, scale?: number }) {
  return (
    <div
      className="bg-slate-900 shadow-sm shrink-0 relative overflow-hidden"
      style={{ width, height, borderRadius: 12, border: "4px solid #0f172a" }}
    >
      <div
        style={{
          width: 420,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          "--card-viewport-height": `${Math.round((height - 8) / scale)}px`,
          "--primary": design?.colorPrimary || "221 83% 53%",
          "--primary-foreground": "0 0% 100%",
          "--secondary": design?.colorSecondary || "210 40% 96.1%",
          "--background": design?.colorBackground || "0 0% 100%",
          "--card": design?.colorCard || "0 0% 100%",
          "--popover": design?.colorCard || "0 0% 100%",
          "--border": "214.3 31.8% 91.4%",
          "--muted": "210 40% 96.1%",
          "--muted-foreground": "215.4 16.3% 46.9%",
          "--name-font-family": `'${design?.nameFontFamily || "Dancing Script"}', cursive`,
          "--name-font-size": `${Number(design?.nameFontSize) || 38}px`,
          "--name-color": design?.nameColor ? `hsl(${design.nameColor})` : "hsl(221 83% 53%)",
          "--body-font-family": `'${design?.bodyFontFamily || "Dancing Script"}', cursive`,
        } as React.CSSProperties}
      >
        <WeddingCard
          invitation={card as any}
          cardImageUrl={resolveImageUrl(design?.cardImageUrl || "")}
          envelopeImageUrl={resolveImageUrl(design?.envelopeImageUrl || design?.cardImageUrl || "")}
          cardMaxWidth={design?.cardMaxWidth || "420px"}
          rsvpCount={{ attending: 0, notAttending: 0, totalGuests: 0 }}
        />
      </div>
      {!card.isPurchased && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-900/10 backdrop-blur-[1px]">
          <div style={{ transform: "rotate(-45deg)" }} className="bg-white/95 px-4 py-1 shadow-lg border border-white/50 backdrop-blur-md">
            <span className="text-slate-900 font-bold tracking-[0.2em] select-none uppercase text-[8px]">PREVIEW</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading, updateUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [design, setDesign] = useState<Design | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("orders");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [protectCard, setProtectCard] = useState(false);
  const [lockPin, setLockPin] = useState("");
  const [lockSaving, setLockSaving] = useState(false);
  const [deleteInvitation, setDeleteInvitation] = useState<Invitation | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordValues, setPasswordValues] = useState<Record<PasswordField, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [paymentStartingFor, setPaymentStartingFor] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const effectiveViewMode = isMobile ? "grid" : viewMode;

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfileEmail(user.email);
    const fetchData = async () => {
      try {
        const [invRes, designRes, allDesRes, paymentHistoryRes] = await Promise.all([
          fetch(`${BASE}/api/invitations-by-user/${user.id}`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/design/active`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/design`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/buyer/payment-history`, { credentials: "include", cache: "no-store" }),
        ]);
        const invData = invRes.ok ? await invRes.json() as Invitation[] : [];
        const globalDesign = designRes.ok ? await designRes.json() : null;
        const allDesigns: Design[] = allDesRes.ok ? await allDesRes.json() : [];
        setInvitations(invData);
        setPaymentHistory(paymentHistoryRes.ok ? await paymentHistoryRes.json() : []);
        setInvitation(invData[0] ?? null);
        setDesigns(allDesigns);
        const tpl = allDesigns.find((d) => d.designCode === invData[0]?.designCode);
        setDesign(tpl ?? globalDesign ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: invitations.length,
      active: invitations.filter(i => i.isPurchased && !isExpired(i.createdAt)).length,
      pending: invitations.filter(i => !i.isPurchased).length,
      expired: invitations.filter(i => isExpired(i.createdAt)).length,
      rsvp: 0
    };
  }, [invitations]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const inviteLinkFor = (card: Invitation) =>
    `${window.location.origin}${BASE}/invite/${encodeURIComponent(card.token)}`;

  const copyLink = (card: Invitation) => {
    navigator.clipboard.writeText(inviteLinkFor(card));
    setCopiedToken(card.token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Link copied!");
  };

  const formatCreatedDate = (card: Invitation) =>
    new Date(card.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

  const formatExpiryDate = (card: Invitation) =>
    new Date(new Date(card.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (authLoading || (loading && !!user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!user) return null;

  const actionButtonsFor = (card: Invitation) => [
    { icon: Edit2,  label: "Edit",  onClick: () => navigate(`/editor?token=${encodeURIComponent(card.token)}`) },
    { icon: Eye,    label: "View",  onClick: () => window.open(`${BASE}/invite/${encodeURIComponent(card.token)}`, "_blank") },
    { icon: Users,  label: "RSVP",  onClick: () => navigate("/rsvp") },
    { icon: Share2, label: "Share", onClick: () => copyLink(card) },
    { icon: QrCode, label: "QR",    onClick: () => toast.info("Coming soon!") },
    { icon: Lock,   label: "Lock",  onClick: () => {
      setInvitation(card);
      setProtectCard(Boolean(card.isLocked));
      setLockPin("");
      setLockModalOpen(true);
    } },
    { icon: Trash2, label: "Delete", onClick: () => setDeleteInvitation(card) },
  ];

  const saveCardLock = async () => {
    if (!invitation) return;
    if (protectCard && !/^\d{4}$/.test(lockPin)) {
      toast.error("Please enter exactly 4 digits.");
      return;
    }
    setLockSaving(true);
    try {
      const response = await fetch(`${BASE}/api/invitation/${invitation.token}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ protect: protectCard, pin: lockPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update card lock");
      setInvitation((current) => current ? { ...current, isLocked: data.isLocked } : current);
      setLockModalOpen(false);
      setLockPin("");
      toast.success(protectCard ? "Card protected with PIN." : "Card lock removed.");
      // Also update the card in the list
      setInvitations((items) => items.map(item => item.token === invitation.token ? { ...item, isLocked: data.isLocked } : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update card lock");
    } finally {
      setLockSaving(false);
    }
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
      setInvitations((items) => {
        const remaining = items.filter((item) => item.token !== deleteInvitation.token);
        setInvitation((current) => current?.token === deleteInvitation.token ? (remaining[0] ?? null) : current);
        return remaining;
      });
      setDeleteInvitation(null);
      toast.success("Invitation deleted successfully.");
    } catch {
      toast.error("Failed to delete invitation. Please try again.");
    } finally {
      setDeleteSaving(false);
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = profileName.trim();
    const email = profileEmail.trim().toLowerCase();
    if (!name) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await fetch(`${BASE}/api/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save profile changes.");
      updateUser(data);
      toast.success("Profile changes saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile changes.");
    } finally {
      setProfileSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordValues;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please complete all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordValues),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update password.");
      setPasswordValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(data.message || "Password updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const downloadReceipt = (payment: PaymentHistoryItem) => {
    const invoiceId = payment.paymentReference || `INV-${payment.id}`;
    const invitationName = payment.invitation
      ? `${payment.invitation.groomName} & ${payment.invitation.brideName}`
      : payment.packageName || "Wedding invitation";
    const date = new Date(payment.paidAt || payment.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const receipt = [
      "WedInBytes Payment Receipt",
      "==========================",
      `Invoice ID: ${invoiceId}`,
      `Invitation: ${invitationName}`,
      `Package: ${payment.packageName || "Wedding invitation"}`,
      `Amount: RM ${Number(payment.amount || 0).toFixed(2)}`,
      `Payment date: ${date}`,
      "Status: Paid",
      payment.paymentGateway ? `Gateway: ${payment.paymentGateway}` : "",
    ].filter(Boolean).join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceId}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  const NAV_ITEMS: SiteNavItem[] = [
    { label: "HOME",       href: "/" },
    { label: "CATALOG",    href: "/weddingcards/home" },
    { label: "PRICE LIST", href: "/pricing" },
    { label: "FAQs",       href: "/faq" },
    { label: "REVIEWS",    href: "/reviews" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          <>
            <button
              onClick={() => navigate("/dashboard")}
              title={user.name}
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="text-slate-500 hover:text-slate-800 transition-colors"
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
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-700 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        }
      />

      {lockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="lock-title">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
            <div className="relative border-b border-slate-100 px-6 py-6 text-center">
              <button onClick={() => setLockModalOpen(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors" aria-label="Close">
                <X size={20} strokeWidth={2} />
              </button>
              <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="text-indigo-600" size={24} />
              </div>
              <h2 id="lock-title" className="text-xl font-bold text-slate-900 tracking-tight">Protect Your Card</h2>
              <p className="mt-2 text-sm text-slate-500">Keep Your Invitation Private with a PIN</p>
            </div>
            <div className="px-6 py-8">
              <label className="mx-auto flex max-w-xs cursor-pointer items-center justify-center gap-3 text-sm font-medium text-slate-700 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={protectCard}
                  onChange={(event) => setProtectCard(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span>Enable PIN protection</span>
              </label>
              {protectCard && (
                <div className="mx-auto mt-8 max-w-xs">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Set a 4-digit PIN</p>
                  <div className="flex overflow-hidden rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm">
                    <input
                      value={lockPin}
                      onChange={(event) => setLockPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      maxLength={4}
                      type="password"
                      placeholder="••••"
                      className="min-w-0 flex-1 px-4 py-3.5 text-center text-lg tracking-[0.5em] outline-none text-slate-900 bg-white"
                      aria-label="4-digit PIN"
                    />
                    <button
                      onClick={saveCardLock}
                      disabled={lockSaving}
                      className="bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                    >
                      {lockSaving ? "..." : "SAVE"}
                    </button>
                  </div>
                </div>
              )}
              {!protectCard && (
                <button
                  onClick={saveCardLock}
                  disabled={lockSaving}
                  className="mx-auto mt-8 block w-full max-w-xs bg-slate-900 px-6 py-3.5 rounded-full text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 shadow-md transition-all hover:-translate-y-0.5"
                >
                  {lockSaving ? "Saving..." : "Remove Lock"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteInvitation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="delete-invitation-title">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
            <div className="px-6 py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5">
                <Trash2 className="text-red-500" size={28} />
              </div>
              <h2 id="delete-invitation-title" className="text-xl font-bold text-slate-900 tracking-tight">Delete Invitation?</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">
                This action cannot be undone. Your invitation and all related data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3 bg-slate-50 px-6 py-5">
              <button onClick={() => setDeleteInvitation(null)} disabled={deleteSaving} className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm">
                Cancel
              </button>
              <button onClick={() => void confirmDeleteInvitation()} disabled={deleteSaving} className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md">
                {deleteSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col flex-1">

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.name || "User"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create, manage, and share your beautiful digital wedding invitations effortlessly.</p>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-slate-200 pb-px">
          <button onClick={() => setActiveSection('orders')} className={`pb-3 text-sm font-bold tracking-wide transition-colors ${activeSection === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            Dashboard
          </button>
          <button onClick={() => setActiveSection('profile')} className={`pb-3 text-sm font-bold tracking-wide transition-colors ${activeSection === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
            Profile Settings
          </button>
        </div>

        {/* ── Main panel ── */}
        {activeSection === "orders" && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Plus size={24} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No invitations yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm">Create your first premium digital invitation card and start sharing it with your guests.</p>
                <button
                  onClick={() => navigate("/editor?new=1")}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  <span>Create New Card</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Your Invitations</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${effectiveViewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Grid View"><LayoutGrid size={16}/></button>
                      <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${effectiveViewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'} hidden sm:block`} title="List View"><ListIcon size={16}/></button>
                    </div>
                    <button onClick={() => navigate("/editor?new=1")} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
                      <Plus size={16} /> <span className="hidden sm:inline">Create New</span>
                    </button>
                  </div>
                </div>

                {effectiveViewMode === "grid" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {invitations.map((card, index) => {
                      const cardDesign = designs.find((item) => item.designCode === card.designCode) ?? null;
                      const cardInviteLink = inviteLinkFor(card);
                      const actions = actionButtonsFor(card);
                      const expired = isExpired(card.createdAt);

                      return (
                        <motion.article
                          key={card.token}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 sm:gap-5 group"
                        >
                           <ThumbnailView card={card} design={cardDesign} width={100} height={180} scale={0.219} />

                           <div className="flex-1 min-w-0 flex flex-col">
                             <div className="flex justify-between items-start gap-2 mb-2">
                               <div className="min-w-0">
                                  <h3 className="text-lg font-bold text-slate-900 leading-tight truncate-2-lines" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {card.groomName} & {card.brideName}
                                  </h3>
                                  <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                                     <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">{card.eventType}</span>
                                     {expired ? (
                                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">Expired</span>
                                     ) : card.isPurchased ? (
                                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">Active</span>
                                     ) : (
                                        <>
                                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">Pending</span>
                                           <button onClick={() => void startPayment({ invitationId: card.id })} disabled={paymentStartingFor === card.id} className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1 disabled:cursor-wait disabled:opacity-60"><CreditCard size={10}/> {paymentStartingFor === card.id ? "..." : "Pay"}</button>
                                        </>
                                     )}
                                  </div>
                               </div>
                             </div>

                             <div className="mt-3 text-xs text-slate-500 space-y-1.5 mb-4">
                                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> <span>Created {formatCreatedDate(card)}</span></div>
                                <div className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> <span>Expires {formatExpiryDate(card)}</span></div>
                             </div>

                             <div className="mt-auto">
                               {/* Link Surface */}
                               <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 mb-4 transition-colors group-hover:bg-slate-100/75">
                                 <div className="w-6 h-6 bg-white rounded flex items-center justify-center border border-slate-100 shrink-0">
                                    <Link2 size={12} className="text-slate-400" />
                                 </div>
                                 <input readOnly value={cardInviteLink} className="flex-1 bg-transparent text-xs text-slate-600 outline-none min-w-0 font-medium px-1 cursor-text" onClick={e => e.currentTarget.select()} />
                                 <button onClick={() => copyLink(card)} className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm flex items-center gap-1.5">
                                   {copiedToken === card.token ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                   <span>Copy</span>
                                 </button>
                               </div>

                               {/* Action Row */}
                                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 overflow-x-auto">
                                 {actions.map(({ icon: Icon, label, onClick }: any) => (
                                   <button
                                     key={label}
                                     onClick={onClick}
                                     title={label}
                                     className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${label === 'Delete' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                   >
                                     <Icon size={16} />
                                   </button>
                                 ))}
                               </div>
                             </div>
                           </div>
                        </motion.article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[800px]">
                       <thead>
                         <tr className="bg-slate-50 border-b border-slate-200">
                           <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invitation</th>
                           <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                           <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                           <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Link</th>
                           <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {invitations.map(card => {
                           const cardDesign = designs.find((item) => item.designCode === card.designCode) ?? null;
                           const cardInviteLink = inviteLinkFor(card);
                           const actions = actionButtonsFor(card);
                           const expired = isExpired(card.createdAt);

                           return (
                             <tr key={card.token} className="hover:bg-slate-50/80 transition-colors group">
                               <td className="px-4 py-4">
                                  <div className="flex items-center gap-4">
                                     <ThumbnailView card={card} design={cardDesign} width={48} height={85} scale={0.105} />
                                     <div className="min-w-0 max-w-[250px]">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">{card.groomName} & {card.brideName}</h3>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider border border-slate-200">{card.eventType}</span>
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                     {expired ? (
                                        <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">Expired</span>
                                     ) : card.isPurchased ? (
                                        <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">Active</span>
                                     ) : (
                                        <>
                                          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">Pending</span>
                                           <button onClick={() => void startPayment({ invitationId: card.id })} disabled={paymentStartingFor === card.id} className="p-1 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm disabled:cursor-wait disabled:opacity-60" title="Pay Now"><CreditCard size={12}/></button>
                                        </>
                                     )}
                                  </div>
                               </td>
                               <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-xs text-slate-900 font-medium">C: {formatCreatedDate(card)}</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">E: {formatExpiryDate(card)}</div>
                               </td>
                               <td className="px-4 py-4 min-w-[200px]">
                                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200 shadow-sm transition-colors group-hover:border-slate-300">
                                     <input readOnly value={cardInviteLink} className="flex-1 bg-transparent text-[11px] text-slate-600 outline-none min-w-0 font-medium px-1 cursor-text" onClick={e => e.currentTarget.select()} />
                                     <button onClick={() => copyLink(card)} className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm" title="Copy Link">
                                       {copiedToken === card.token ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                     </button>
                                  </div>
                               </td>
                               <td className="px-4 py-4 whitespace-nowrap text-right">
                                   <div className="flex items-center justify-end gap-1 w-max ml-auto">
                                    {actions.map(({ icon: Icon, label, onClick }: any) => (
                                      <button
                                        key={label}
                                        onClick={onClick}
                                        title={label}
                                        className={`p-1.5 rounded transition-colors ${label === 'Delete' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                      >
                                        <Icon size={14} />
                                      </button>
                                    ))}
                                  </div>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "paymentHistory" && (
          <div className="space-y-6" data-testid="buyer-payment-history-page">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FileText size={13} className="text-slate-900" />
                Payment records
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="buyer-payment-history-title">Payment History</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                View your completed payments for wedding invitations.
              </p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" data-testid="buyer-payment-history-card">
              <PaymentHistoryTable
                payments={paymentHistory}
                onDownloadReceipt={downloadReceipt}
                onPayNow={(payment) => void startPayment({ orderId: payment.id })}
              />
            </div>
          </div>
        )}

        {activeSection === "profile" && (
          <div className="space-y-6" data-testid="profile-settings-page">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Profile Settings</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Update your account details, password, and payment records.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5" data-testid="personal-information-card">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><User size={19} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                    <p className="mt-1 text-sm text-slate-500">Keep your account details up to date.</p>
                  </div>
                </div>
                <form onSubmit={saveProfile} className="flex flex-1 flex-col gap-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Full Name</span>
                    <input value={profileName} onChange={(event) => setProfileName(event.target.value)} required maxLength={120} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Email Address</span>
                    <input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} required maxLength={254} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  </label>
                  <div className="mt-auto flex justify-end pt-1">
                    <button type="submit" disabled={profileSaving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                      <Save size={16} /> {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5" data-testid="change-password-card">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><KeyRound size={19} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                    <p className="mt-1 text-sm text-slate-500">Use a strong password to protect your account.</p>
                  </div>
                </div>
                <form onSubmit={updatePassword} className="flex flex-1 flex-col gap-2">
                  {([
                    ["currentPassword", "Current Password"],
                    ["newPassword", "New Password"],
                    ["confirmPassword", "Confirm New Password"],
                  ] as [PasswordField, string][]).map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
                      <span className="relative block">
                        <input
                          type={passwordVisibility[field] ? "text" : "password"}
                          value={passwordValues[field]}
                          onChange={(event) => setPasswordValues((current) => ({ ...current, [field]: event.target.value }))}
                          minLength={6}
                          required
                          autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" aria-label={passwordVisibility[field] ? `Hide ${label}` : `Show ${label}`}>
                          {passwordVisibility[field] ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </span>
                    </label>
                  ))}
                  <div className="mt-auto flex justify-end pt-1">
                    <button type="submit" disabled={passwordSaving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                      <KeyRound size={16} /> {passwordSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" data-testid="profile-payment-history-card">
              <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-7">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ReceiptText size={19} /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
                  <p className="mt-1 text-sm text-slate-500">View invoices and payment status for your invitations.</p>
                </div>
              </div>
              <PaymentHistoryTable
                payments={paymentHistory}
                onDownloadReceipt={downloadReceipt}
                onPayNow={(payment) => void startPayment({ orderId: payment.id })}
              />
            </section>
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <footer className="py-6 border-t border-slate-200 mt-auto text-center text-slate-400 text-[11px] tracking-wider uppercase font-semibold">
        <p>&copy; {new Date().getFullYear()} WedInBytes. All rights reserved.</p>
      </footer>
    </div>
  );
}
