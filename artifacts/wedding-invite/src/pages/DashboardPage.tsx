import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit2, Eye, Users, Share2, Lock, LogOut,
  User, Plus, Copy, Check, QrCode, X, Trash2,
  Calendar, Clock, CreditCard, Link2
} from "lucide-react";
import { toast } from "sonner";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import { WeddingCard } from "@/components/WeddingCard";
import type { SiteNavItem } from "@/components/SiteHeader";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
// Todo: move this to a helper since it's also used in InvitationPage, and ensure it's consistent with the URL used in the email template
import { resolveImageUrl } from "@/lib/r2-url";

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

type Section = "orders" | "profile";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [design, setDesign] = useState<Design | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("orders");
  const [copied, setCopied] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [protectCard, setProtectCard] = useState(false);
  const [lockPin, setLockPin] = useState("");
  const [lockSaving, setLockSaving] = useState(false);
  const [deleteInvitation, setDeleteInvitation] = useState<Invitation | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [invRes, designRes, allDesRes] = await Promise.all([
          fetch(`${BASE}/api/invitations-by-user/${user.id}`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/design/active`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/design`, { credentials: "include", cache: "no-store" }),
        ]);
        const invData = invRes.ok ? await invRes.json() as Invitation[] : [];
        const globalDesign = designRes.ok ? await designRes.json() : null;
        const allDesigns: Design[] = allDesRes.ok ? await allDesRes.json() : [];
        setInvitations(invData);
        setInvitation(invData[0] ?? null);
         setDesigns(allDesigns);
        // Resolve the design template matching the invitation's designCode
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Use the invitation token for dashboard actions. The readable date/name
  // route is intentionally public-facing, but it is ambiguous when a buyer
  // has multiple cards with the same names or event date.
  const inviteLinkFor = (card: Invitation) =>
    `${window.location.origin}${BASE}/invite/${encodeURIComponent(card.token)}`;

  const copyLink = (card: Invitation) => {
    navigator.clipboard.writeText(inviteLinkFor(card));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8 lg:gap-12 flex-1">

        {/* ── Sidebar ── */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="flex md:hidden gap-2 bg-slate-100 p-1 rounded-2xl mb-6">
            {(["orders", "profile"] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
                  activeSection === s
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "orders" ? "My Orders" : "Profile"}
              </button>
            ))}
          </div>

          <nav className="hidden md:flex flex-col gap-1">
            {(["orders", "profile"] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                  activeSection === s
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {s === "orders" ? "My Orders" : "My Profile"}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 min-w-0">
          {/* MY ORDERS */}
          {activeSection === "orders" && (
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 px-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Invitations</h1>
                {invitations.length > 0 && (
                  <button
                    onClick={() => navigate("/editor?new=1")}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 shrink-0"
                  >
                    <Plus size={16} />
                    <span>Create New</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900" />
                </div>
              ) : !invitation ? (
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
                <div className="space-y-8">
                  {invitations.map((card) => {
                    const cardDesign = designs.find((item) => item.designCode === card.designCode) ?? null;
                    const cardInviteLink = inviteLinkFor(card);
                    const cardDisplayName = `${card.groomName} & ${card.brideName}`;
                    const cardActionButtons = actionButtonsFor(card);

                    return (
                      <article key={card.token} className="relative bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row gap-8 md:gap-12">

                          {/* Phone Mockup Column */}
                          <div className="flex-shrink-0 flex justify-center md:justify-start">
                            <div
                              className="relative bg-slate-900 shadow-xl mx-auto md:mx-0 group-hover:-translate-y-1 transition-transform duration-500"
                              style={{ width: 140, height: 284, borderRadius: 24, border: "6px solid #0f172a", overflow: "hidden" }}
                            >
                              <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-slate-900"
                                style={{ width: 40, height: 14, borderRadius: "0 0 12px 12px" }}
                              />
                              <div
                                className="absolute left-0 top-0"
                                style={{
                                  width: 420,
                                  transform: "scale(0.3047619)",
                                  transformOrigin: "top left",
                                  "--card-viewport-height": "892px",
                                  "--primary": cardDesign?.colorPrimary || "221 83% 53%",
                                  "--primary-foreground": "0 0% 100%",
                                  "--secondary": cardDesign?.colorSecondary || "210 40% 96.1%",
                                  "--background": cardDesign?.colorBackground || "0 0% 100%",
                                  "--card": cardDesign?.colorCard || "0 0% 100%",
                                  "--popover": cardDesign?.colorCard || "0 0% 100%",
                                  "--border": "214.3 31.8% 91.4%",
                                  "--muted": "210 40% 96.1%",
                                  "--muted-foreground": "215.4 16.3% 46.9%",
                                  "--name-font-family": `'${cardDesign?.nameFontFamily || "Dancing Script"}', cursive`,
                                  "--name-font-size": `${Number(cardDesign?.nameFontSize) || 38}px`,
                                  "--name-color": cardDesign?.nameColor ? `hsl(${cardDesign.nameColor})` : "hsl(221 83% 53%)",
                                  "--body-font-family": `'${cardDesign?.bodyFontFamily || "Dancing Script"}', cursive`,
                                } as React.CSSProperties}
                              >
                                <WeddingCard
                                  invitation={card as any}
                                  cardImageUrl={resolveImageUrl(cardDesign?.cardImageUrl || "")}
                                  envelopeImageUrl={resolveImageUrl(cardDesign?.envelopeImageUrl || cardDesign?.cardImageUrl || "")}
                                  cardMaxWidth={cardDesign?.cardMaxWidth || "420px"}
                                  rsvpCount={{ attending: 0, notAttending: 0, totalGuests: 0 }}
                                />
                              </div>
                              {!card.isPurchased && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-900/10 backdrop-blur-[1px]">
                                  <div
                                    style={{ transform: "rotate(-45deg)" }}
                                    className="bg-white/95 px-6 py-2 shadow-lg border border-white/50 backdrop-blur-md"
                                  >
                                    <span
                                      className="text-slate-900 font-bold tracking-[0.2em] select-none uppercase"
                                      style={{ fontSize: 11 }}
                                    >
                                      PREVIEW
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/30 rounded-full" style={{ width: 36, height: 4 }} />
                            </div>
                          </div>

                          {/* Details Column */}
                          <div className="flex-1 min-w-0 flex flex-col">
                            {/* Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                              <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-1">
                                  {cardDisplayName}
                                </h2>
                                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">
                                  {card.eventType}
                                </p>
                              </div>
                              <div className="shrink-0">
                                {card.isPurchased ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full tracking-wide border border-green-200">
                                    <Check size={12} strokeWidth={3} />
                                    <span>PAID</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => toast.info("Payment coming soon!")}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                  >
                                    <CreditCard size={14} />
                                    <span>PAY NOW</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar size={16} className="text-slate-400" />
                                <span>Created <strong className="font-medium text-slate-700">{formatCreatedDate(card)}</strong></span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock size={16} className="text-slate-400" />
                                <span>Expires <strong className="font-medium text-slate-700">{formatExpiryDate(card)}</strong></span>
                              </div>
                            </div>

                            {/* Link Surface */}
                            <div className="mb-8">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Invitation Link</p>
                              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2 pr-3 border border-slate-100 transition-colors hover:bg-slate-100/75">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                                  <Link2 size={16} className="text-indigo-500" />
                                </div>
                                <input
                                  type="text"
                                  readOnly
                                  value={cardInviteLink}
                                  className="flex-1 text-sm text-slate-700 bg-transparent outline-none min-w-0 truncate select-all font-medium"
                                />
                                <button
                                  onClick={() => copyLink(card)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all shrink-0"
                                >
                                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100 mt-auto">
                              {cardActionButtons.map(({ icon: Icon, label, onClick }) => (
                                <button
                                  key={label}
                                  onClick={onClick}
                                  title={label}
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group/btn"
                                >
                                  <Icon size={16} className="text-slate-400 group-hover/btn:text-indigo-500 transition-colors" />
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MY PROFILE */}
          {activeSection === "profile" && (
            <div className="w-full">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 max-w-2xl">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">My Profile</h2>
                <dl className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 pb-6 border-b border-slate-100">
                    <dt className="text-sm font-semibold text-slate-500 w-32 shrink-0">Full Name</dt>
                    <dd className="text-base text-slate-900 font-medium">{user.name}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 pb-6 border-b border-slate-100">
                    <dt className="text-sm font-semibold text-slate-500 w-32 shrink-0">Email Address</dt>
                    <dd className="text-base text-slate-900 break-all">{user.email}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <dt className="text-sm font-semibold text-slate-500 w-32 shrink-0">Account Role</dt>
                    <dd className="text-base text-slate-900 capitalize inline-flex items-center px-3 py-1 bg-slate-100 rounded-full font-medium">{user.role}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
