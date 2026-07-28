import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit2, Eye, Users, Share2, Lock, LogOut,
  User, Plus, Copy, Check, QrCode, X,
} from "lucide-react";
import { toast } from "sonner";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
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
  isPurchased: boolean;
  isLocked?: boolean;
  createdAt: string;
  colorPrimary?: string;
  designCode?: string;
}

interface Design {
  cardImageUrl?: string;
  colorPrimary?: string;
  designCode?: string;
}

type Section = "orders" | "profile";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("orders");
  const [copied, setCopied] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [protectCard, setProtectCard] = useState(false);
  const [lockPin, setLockPin] = useState("");
  const [lockSaving, setLockSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [invRes, designRes, allDesRes] = await Promise.all([
          fetch(`${BASE}/api/invitation-by-user/${user.id}`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/design/active`, { credentials: "include", cache: "no-store" }),
          fetch(`${BASE}/api/design`, { credentials: "include", cache: "no-store" }),
        ]);
        const invData = invRes.ok ? await invRes.json() : null;
        const globalDesign = designRes.ok ? await designRes.json() : null;
        const allDesigns: Design[] = allDesRes.ok ? await allDesRes.json() : [];
        if (invData) setInvitation(invData);
        // Resolve the design template matching the invitation's designCode
        const tpl = allDesigns.find((d) => d.designCode === invData?.designCode);
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
    navigate("/login");
  };

  const inviteLink = invitation
    ? `${window.location.origin}${BASE}/invite/${invitation.token}`
    : "";

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const displayName = invitation
    ? `${invitation.brideName} & ${invitation.groomName}`
    : "";

  const createdDate = invitation
    ? new Date(invitation.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "";

  const expiryDate = invitation
    ? new Date(new Date(invitation.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  const cardBg = design?.cardImageUrl;
  const accentColor = invitation?.colorPrimary
    ? `hsl(${invitation.colorPrimary})`
    : design?.colorPrimary
    ? `hsl(${design.colorPrimary})`
    : "#4a8a5a";

  if (authLoading || (loading && !!user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
      </div>
    );
  }

  if (!user) return null;

  const actionButtons = [
    { icon: Edit2,  label: "Edit",  onClick: () => navigate("/editor") },
    { icon: Eye,    label: "View",  onClick: () => invitation && window.open(`${BASE}/invite/${invitation.token}`, "_blank"), disabled: !invitation },
    { icon: Users,  label: "RSVP",  onClick: () => navigate("/admin") },
    { icon: Share2, label: "Share", onClick: copyLink, disabled: !invitation },
    { icon: QrCode, label: "QR",    onClick: () => toast.info("Coming soon!"), disabled: !invitation },
    { icon: Lock,   label: "Lock",  onClick: () => {
      setProtectCard(Boolean(invitation?.isLocked));
      setLockPin("");
      setLockModalOpen(true);
    }, disabled: !invitation },
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

  const NAV_ITEMS: SiteNavItem[] = [
    { label: "HOME",       href: "/" },
    { label: "CATALOG",    href: "/weddingcards/home" },
    { label: "PRICE LIST", href: "/pricing" },
    { label: "FAQs",       href: "/faq" },
    { label: "REVIEWS",    href: "/reviews" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          <>
            <button
              onClick={() => navigate("/dashboard")}
              title={user.name}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="text-gray-500 hover:text-gray-800 transition-colors"
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
              <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-700 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        }
      />

      {lockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="lock-title">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="relative border-b border-gray-100 px-6 py-7 text-center">
              <button onClick={() => setLockModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700" aria-label="Close">
                <X size={23} strokeWidth={1.5} />
              </button>
              <h2 id="lock-title" className="text-lg font-normal text-gray-900">Protect Your Card</h2>
              <p className="mt-2 text-sm text-gray-600">Keep Your Invitation Private with a Pin</p>
            </div>
            <div className="px-6 py-6">
              <label className="mx-auto flex max-w-xs cursor-pointer items-center justify-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={protectCard}
                  onChange={(event) => setProtectCard(event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span>Protect this card</span>
              </label>
              {protectCard && (
                <div className="mx-auto mt-7 max-w-xs">
                  <p className="mb-3 text-center text-xs text-gray-700">Set a 4-digit pin code</p>
                  <div className="flex overflow-hidden rounded-lg border border-gray-300">
                    <input
                      value={lockPin}
                      onChange={(event) => setLockPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      maxLength={4}
                      type="password"
                      placeholder="••••"
                      className="min-w-0 flex-1 px-4 py-3 text-center tracking-[0.5em] outline-none"
                      aria-label="4-digit PIN"
                    />
                    <button
                      onClick={saveCardLock}
                      disabled={lockSaving}
                      className="bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
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
                  className="mx-auto mt-6 block bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {lockSaving ? "Saving..." : "REMOVE LOCK"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6 md:gap-10 flex-1">

        {/* ── Sidebar ── */}
        <aside className="md:w-32 md:shrink-0 md:pt-1">
          <div className="flex md:hidden gap-2">
            {(["orders", "profile"] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`flex-1 py-2 rounded-full text-xs font-bold tracking-wider transition-colors ${
                  activeSection === s
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-500"
                }`}
              >
                {s === "orders" ? "MY ORDERS" : "PROFILE"}
              </button>
            ))}
          </div>

          <div className="hidden md:flex md:flex-col gap-3">
            {(["orders", "profile"] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`block w-full text-left text-xs font-bold tracking-wider py-1 transition-colors ${
                  activeSection === s ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {s === "orders" ? "MY ORDERS" : "MY PROFILE"}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm min-w-0">

          {/* MY ORDERS */}
          {activeSection === "orders" && (
            <div className="p-4 sm:p-6">
              <div className="flex justify-end mb-5">
                <button
                  onClick={() => navigate("/editor")}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-xs font-bold tracking-wider hover:bg-gray-700 transition-colors"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">CREATE NEW CARD</span>
                  <span className="sm:hidden">NEW CARD</span>
                </button>
              </div>

              <hr className="border-gray-100 mb-5" />

              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                </div>
              ) : !invitation ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                  <p className="text-sm text-center">You don't have any invitation cards yet.</p>
                  <button onClick={() => navigate("/editor")} className="text-sm text-gray-700 underline">
                    Create your first card →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">

                  {/* Phone mockup */}
                  <div
                    className="shrink-0 relative bg-gray-900 shadow-lg self-center sm:self-start"
                    style={{ width: 80, height: 162, borderRadius: 14, border: "4px solid #1f2937", overflow: "hidden" }}
                  >
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
                      style={{ width: 24, height: 10, borderRadius: "0 0 8px 8px" }}
                    />
                    {cardBg ? (
                      <img src={resolveImageUrl(cardBg)} alt="Card preview" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(160deg, hsl(${design?.colorPrimary ?? "142 30% 80%"}) 0%, hsl(${design?.colorPrimary ?? "142 20% 96%"}) 100%)`,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: "none" }}>
                      <div
                        className="flex flex-col items-center justify-center text-center"
                        style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                      >
                        <span
                          className="leading-tight"
                          style={{ fontFamily: "'Poppins', sans-serif", fontSize: 8, color: accentColor, fontWeight: 700 }}
                        >
                          {invitation.brideName}<br />&amp;<br />{invitation.groomName}
                        </span>
                      </div>
                    </div>
                    {!invitation.isPurchased && (
                      <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ transform: "rotate(-45deg)" }}
                      >
                        <span
                          className="text-white/75 font-black tracking-[0.14em] select-none"
                          style={{ fontSize: 10, textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}
                        >
                          PREVIEW
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-white/40 rounded-full" style={{ width: 24, height: 3 }} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3 min-w-0 w-full">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide leading-tight">
                      {invitation.eventType} — {displayName}
                    </h2>

                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>Created: <span className="text-gray-700">{createdDate}</span></p>
                      <p>Expires: <span className="text-gray-700">{expiryDate}</span></p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Invitation Link:</p>
                      <div className="flex items-center border border-gray-200 rounded overflow-hidden w-full">
                        <input
                          type="text"
                          readOnly
                          value={inviteLink}
                          className="flex-1 text-xs px-2 py-1.5 text-gray-700 bg-white outline-none min-w-0 truncate select-all"
                        />
                        <button
                          onClick={copyLink}
                          className="px-2 py-1.5 bg-gray-50 border-l border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                          title="Copy link"
                        >
                          {copied
                            ? <Check size={12} className="text-green-600" />
                            : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {actionButtons.map(({ icon: Icon, label, onClick, disabled }) => (
                        <button
                          key={label}
                          onClick={onClick}
                          disabled={!!disabled}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Icon size={13} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      {invitation.isPurchased ? (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          ✓ PAID
                        </span>
                      ) : (
                        <button
                          onClick={() => toast.info("Payment coming soon!")}
                          className="w-full sm:w-auto px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded hover:bg-gray-700 transition-colors tracking-widest"
                        >
                          PAY NOW
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MY PROFILE */}
          {activeSection === "profile" && (
            <div className="p-4 sm:p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 tracking-wider uppercase">My Profile</h2>
              <hr className="border-gray-100" />
              <dl className="space-y-4 max-w-sm">
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Name</dt>
                  <dd className="text-sm text-gray-800 font-medium">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Email</dt>
                  <dd className="text-sm text-gray-800 break-all">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Role</dt>
                  <dd className="text-sm text-gray-800 capitalize">{user.role}</dd>
                </div>
              </dl>
            </div>
          )}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
