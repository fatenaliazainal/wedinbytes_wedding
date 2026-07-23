import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EnvelopeDoors } from "@/components/EnvelopeDoors";
import { EnvelopeAnimation } from "@/components/EnvelopeAnimation";
import { WeddingCard } from "@/components/WeddingCard";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Calendar, Heart, MapPin, Phone, MessageSquare, Menu, X, User, LogOut, Loader2 } from "lucide-react";
import { useListDesigns } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
import { resolveImageUrl } from "@/lib/r2-url";

const TABS = [
  { id: "utama", label: "MAIN" },
  { id: "muka-depan", label: "COVER" },
  { id: "ayat-undangan", label: "INVITATION" },
  { id: "lokasi", label: "VENUE & PROGRAMME" },
  { id: "rsvp", label: "RSVP / MESSAGE" },
  { id: "hubungi", label: "CONTACT" },
  { id: "lagu", label: "MUSIC" },
  { id: "galeri", label: "GALLERY & GIFTS" },
  { id: "lain", label: "OTHER" },
];

const OPENING_ANIMS = [
  { value: "doors", label: "Doors" },
  { value: "envelope", label: "Envelope" },
  { value: "window", label: "Window" },
];
const FONT_OPTIONS = [
  { value: "Dancing Script", label: "Nova Quinta (Dancing Script)" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Esthetique", label: "Esthetique" },
  { value: "Magnolia", label: "Magnolia" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
];

interface InvData {
  id: number;
  token: string;
  groomName: string;
  brideName: string;
  eventType: string;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venueMapUrl: string;
  groomParents: string;
  brideParents: string;
  contactPhone: string;
  dresscode: string;
  message: string;
  shortCoupleName: string;
  coupleCount: number;
  groomInitial: string;
  brideInitial: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  coverDateText: string;
  additionalInfo: string;
  showFrontText: boolean;
  greetingText: string;
  invitationText: string;
  hostName: string;
  hostCount: number;
  venueHijriDate: string;
  schedule: string;
}

interface DesignData {
  designCode: string;
  openingAnimation: string;
  openButtonText: string;
  nameFontFamily: string;
  nameFontSize: string;
  nameColor: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorCard: string;
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  cardImageUrl: string;
  envelopeImageUrl: string;
}

function hslToHex(hslStr: string): string {
  const parts = (hslStr || "0 0% 0%").trim().split(/\s+/);
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat((parts[1] || "0").replace("%", "")) / 100;
  const l = parseFloat((parts[2] || "0").replace("%", "")) / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  return `#${[r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const l = (max+min)/2;
  const s = max===min ? 0 : l>0.5 ? (max-min)/(2-max-min) : (max-min)/(max+min);
  let h = 0;
  if (max!==min) {
    if (max===r) h=((g-b)/(max-min)+6)%6;
    else if (max===g) h=(b-r)/(max-min)+2;
    else h=(r-g)/(max-min)+4;
    h*=60;
  }
  return `${Math.round(h)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white";
const selectCls = "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white";
const textareaCls = "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white resize-none";

export default function EditorPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("utama");
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [previewOpened, setPreviewOpened] = useState(true);
  const [previewActiveTab, setPreviewActiveTab] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { data: availableDesigns = [] } = useListDesigns();

  const [inv, setInv] = useState<InvData>({
    id: 0,
    token: "",
    groomName: "", brideName: "", eventType: "Wedding Ceremony",
    eventDate: "", eventDay: "", eventTime: "11:00 am – 4:00 pm",
    venueName: "", venueAddress: "", venueCity: "", venueState: "",
    venueMapUrl: "", groomParents: "", brideParents: "", contactPhone: "",
    dresscode: "", message: "",
    shortCoupleName: "", coupleCount: 1,
    groomInitial: "", brideInitial: "",
    eventStartDateTime: "", eventEndDateTime: "", coverDateText: "",
    additionalInfo: "", showFrontText: true,
    greetingText: "Wedding Invitation\n\nAssalamualaikum & greetings",
    invitationText: "With heartfelt gratitude, we joyfully invite\nyou to celebrate the wedding of our beloved child",
    hostName: "", hostCount: 1, venueHijriDate: "", schedule: "",
  });

  const [design, setDesign] = useState<DesignData>({
    designCode: "FL001", openingAnimation: "doors", openButtonText: "BUKA",
    nameFontFamily: "Dancing Script", nameFontSize: "38",
    nameColor: "0 0% 20%", colorPrimary: "142 45% 35%", colorSecondary: "142 30% 92%",
    colorBackground: "142 20% 96%", colorCard: "0 0% 100%",
    musicUrl: "", musicTitle: "", musicArtist: "",
    cardImageUrl: "wed_card_design/20260531-041903-27796.jpg", envelopeImageUrl: "wed_card_design/20260531-041903-27796.jpg",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Load buyer's invitation + global design (for images/music only)
  const loadData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setDataLoading(true);
    try {
      const [invRes, designRes, allDesRes] = await Promise.all([
        fetch(`${BASE}/api/invitation-by-user/${user.id}`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/design/active`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/design`, { credentials: "include", cache: "no-store" }),
      ]);
      // Global (active) design — fallback for colours and images
      let gd: Record<string, string> = {};
      if (designRes.ok) gd = await designRes.json();
      // All available design templates — used to resolve images by designCode
      const allDesigns: Record<string, string>[] = allDesRes.ok ? await allDesRes.json() : [];

      // If the user arrived via "Personalise" from the card gallery, honour the ?designCode= param.
      const urlDesignCode = new URLSearchParams(window.location.search).get("designCode") ?? null;

      // Resolve ALL design properties from the matched template by designCode.
      // gd (active global) is used only as a last-resort fallback when the
      // template itself has no value set.
      const resolveTemplate = (code: string) => {
        const tpl = allDesigns.find((des) => des.designCode === code) ?? gd;
        const primary = tpl.colorPrimary ?? gd.colorPrimary ?? "142 45% 35%";
        return {
          colorPrimary:     primary,
          colorSecondary:   tpl.colorSecondary   ?? primary,
          colorBackground:  tpl.colorBackground  ?? primary,
          colorCard:        tpl.colorCard        ?? "0 0% 100%",
          openingAnimation: tpl.openingAnimation ?? "doors",
          nameFontFamily:   tpl.nameFontFamily   ?? "Dancing Script",
          nameColor:        tpl.nameColor        ?? "0 0% 20%",
          cardImageUrl:     tpl.cardImageUrl     ?? gd.cardImageUrl     ?? "wed_card_design/20260531-041903-27796.jpg",
          envelopeImageUrl: tpl.envelopeImageUrl ?? gd.envelopeImageUrl ?? "wed_card_design/20260531-041903-27796.jpg",
          musicUrl:         tpl.musicUrl         ?? gd.musicUrl         ?? "",
          musicTitle:       tpl.musicTitle       ?? gd.musicTitle       ?? "",
          musicArtist:      tpl.musicArtist      ?? gd.musicArtist      ?? "",
        };
      };

      if (invRes.ok) {
        const d = await invRes.json();
        setInv({
          id: d.id ?? 0,
          token: d.token ?? "",
          groomName: d.groomName ?? "", brideName: d.brideName ?? "",
          eventType: d.eventType ?? "Wedding Ceremony",
          eventDate: d.eventDate ?? "", eventDay: d.eventDay ?? "",
          eventTime: d.eventTime ?? "11:00 am – 4:00 pm",
          venueName: d.venueName ?? "", venueAddress: d.venueAddress ?? "",
          venueCity: d.venueCity ?? "", venueState: d.venueState ?? "",
          venueMapUrl: d.venueMapUrl ?? "", groomParents: d.groomParents ?? "",
          brideParents: d.brideParents ?? "", contactPhone: d.contactPhone ?? "",
          dresscode: d.dresscode ?? "", message: d.message ?? "",
          shortCoupleName: d.shortCoupleName ?? "", coupleCount: d.coupleCount ?? 1,
          groomInitial: d.groomInitial ?? "", brideInitial: d.brideInitial ?? "",
          eventStartDateTime: d.eventStartDateTime ?? "",
          eventEndDateTime: d.eventEndDateTime ?? "",
          coverDateText: d.coverDateText ?? "",
          additionalInfo: d.additionalInfo ?? "",
          showFrontText: d.showFrontText ?? true,
          greetingText: d.greetingText ?? "Wedding Invitation\n\nAssalamualaikum & greetings",
          invitationText: d.invitationText ?? "With heartfelt gratitude, we joyfully invite\nyou to celebrate the wedding of our beloved child",
          hostName: d.hostName ?? "", hostCount: d.hostCount ?? 1,
          venueHijriDate: d.venueHijriDate ?? "", schedule: d.schedule ?? "",
        });
        // URL param ?designCode= takes priority (user clicked "Personalise" on a specific card)
        const resolvedCode = urlDesignCode ?? d.designCode ?? gd.designCode ?? "FL001";
        const tpl = resolveTemplate(resolvedCode);
        // Buyer per-invitation overrides take priority; template values are the fallback
        setDesign({
          designCode:       resolvedCode,
          openingAnimation: d.openingAnimation ?? tpl.openingAnimation,
          openButtonText:   d.openButtonText   ?? "BUKA",
          nameFontFamily:   d.nameFontFamily   ?? tpl.nameFontFamily,
          nameFontSize:     d.nameFontSize      ?? "38",
          nameColor:        d.nameColor         ?? tpl.nameColor,
          colorPrimary:     d.colorPrimary      ?? tpl.colorPrimary,
          colorSecondary:   d.colorSecondary    ?? tpl.colorSecondary,
          colorBackground:  d.colorBackground   ?? tpl.colorBackground,
          colorCard:        d.colorCard         ?? tpl.colorCard,
          cardImageUrl:     tpl.cardImageUrl,
          envelopeImageUrl: tpl.envelopeImageUrl,
          musicUrl:         tpl.musicUrl,
          musicTitle:       tpl.musicTitle,
          musicArtist:      tpl.musicArtist,
        });
      } else {
        // No invitation yet — use URL param design (if any) or global admin design as preview defaults
        const resolvedCode = urlDesignCode ?? gd.designCode ?? "FL001";
        const tplFallback = resolveTemplate(resolvedCode);
        setDesign((prev) => ({
          ...prev,
          designCode:       resolvedCode,
          colorPrimary:     tplFallback.colorPrimary,
          colorSecondary:   tplFallback.colorSecondary,
          colorBackground:  tplFallback.colorBackground,
          colorCard:        tplFallback.colorCard,
          openingAnimation: tplFallback.openingAnimation,
          nameFontFamily:   tplFallback.nameFontFamily,
          nameColor:        tplFallback.nameColor,
          cardImageUrl:     tplFallback.cardImageUrl,
          envelopeImageUrl: tplFallback.envelopeImageUrl,
          musicUrl:         tplFallback.musicUrl,
          musicTitle:       tplFallback.musicTitle,
          musicArtist:      tplFallback.musicArtist,
        }));
      }
    } catch { /* ignore */ }
    finally { setDataLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const setI = (field: keyof InvData) => (v: string) =>
    setInv((p) => ({ ...p, [field]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      let token = inv.token;

      // If buyer has no invitation yet, create one first
      if (!token) {
        const createRes = await fetch(`${BASE}/api/invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            groomName: inv.groomName || "Groom",
            brideName: inv.brideName || "Bride",
            eventType: inv.eventType || "Wedding Ceremony",
            eventDate: inv.eventDate || "", eventDay: inv.eventDay || "",
            eventTime: inv.eventTime || "11:00 am – 4:00 pm",
            venueName: inv.venueName || "", venueAddress: inv.venueAddress || "",
            venueCity: inv.venueCity || "", venueState: inv.venueState || "",
            contactPhone: inv.contactPhone || "",
          }),
        });
        if (!createRes.ok) {
          toast.error("Failed to create card. Please try again.");
          return;
        }
        const created = await createRes.json();
        token = created.token as string;
        setInv((p) => ({ ...p, token }));
      }

      // All fields — invitation content AND buyer design overrides — go to the invitation record.
      // The global card_design table is never touched by the buyer, so the demo stays intact.
      const r = await fetch(`${BASE}/api/invitation/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // Invitation content
          groomName: inv.groomName, brideName: inv.brideName,
          eventType: inv.eventType, eventDate: inv.eventDate,
          eventDay: inv.eventDay, eventTime: inv.eventTime,
          venueName: inv.venueName, venueAddress: inv.venueAddress,
          venueCity: inv.venueCity, venueState: inv.venueState,
          venueMapUrl: inv.venueMapUrl || undefined,
          groomParents: inv.groomParents || undefined,
          brideParents: inv.brideParents || undefined,
          contactPhone: inv.contactPhone, dresscode: inv.dresscode || undefined,
          message: inv.message || undefined,
          shortCoupleName: inv.shortCoupleName || undefined,
          coupleCount: inv.coupleCount,
          groomInitial: inv.groomInitial || undefined,
          brideInitial: inv.brideInitial || undefined,
          eventStartDateTime: inv.eventStartDateTime || undefined,
          eventEndDateTime: inv.eventEndDateTime || undefined,
          coverDateText: inv.coverDateText || undefined,
          additionalInfo: inv.additionalInfo || undefined,
          showFrontText: inv.showFrontText,
          greetingText: inv.greetingText || undefined,
          invitationText: inv.invitationText || undefined,
          hostName: inv.hostName || undefined,
          hostCount: inv.hostCount,
          venueHijriDate: inv.venueHijriDate || undefined,
          schedule: inv.schedule || undefined,
          // Buyer design overrides (stored per-invitation, does NOT affect demo)
          designCode: design.designCode != null ? design.designCode : undefined,
          openingAnimation: design.openingAnimation || undefined,
          openButtonText: design.openButtonText || undefined,
          nameFontFamily: design.nameFontFamily || undefined,
          nameFontSize: design.nameFontSize || undefined,
          nameColor: design.nameColor || undefined,
          colorPrimary: design.colorPrimary || undefined,
          colorSecondary: design.colorSecondary || undefined,
          colorBackground: design.colorBackground || undefined,
          colorCard: design.colorCard || undefined,
        }),
      });
      if (r.ok) {
        toast.success("Details saved successfully!");
        await loadData(true);
      } else {
        toast.error("Save failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate("/dashboard");
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navItems = [
    { label: "HOME",       onClick: () => { navigate("/dashboard"); setNavOpen(false); } },
    { label: "CATALOG",    onClick: () => { toast.info("Coming soon!"); setNavOpen(false); } },
    { label: "PRICE LIST", onClick: () => { toast.info("Coming soon!"); setNavOpen(false); } },
    { label: "INFO",       onClick: () => { toast.info("Coming soon!"); setNavOpen(false); } },
    { label: "FAQs",       onClick: () => { toast.info("Coming soon!"); setNavOpen(false); } },
  ];

  const displayName = inv.shortCoupleName || `${inv.brideName} & ${inv.groomName}` || "Ain & Hidayat";
  const fontSize = Number(design.nameFontSize) || 38;
  const fontFamily = design.nameFontFamily || "Dancing Script, cursive";
  const nameColorStyle = design.nameColor ? `hsl(${design.nameColor})` : "#6b4c2a";

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#faf9f7]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const primaryHsl = design.colorPrimary || "142 45% 35%";
  const primaryCss = `hsl(${primaryHsl})`;

  return (
    <div className="min-h-[100dvh] bg-[#faf9f7] flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-gray-500 hover:text-gray-800 transition-colors"
            onClick={() => setNavOpen((o) => !o)}
            aria-label="Menu"
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo — centred on mobile, left on desktop */}
          <div className="flex-1 flex sm:flex-none items-center justify-center sm:justify-start">
            <button
              onClick={() => navigate("/")}
              className="font-serif text-xl text-gray-800 tracking-wide hover:opacity-70 transition-opacity"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              WedInBytes
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6 flex-1">
            {navItems.map(({ label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 tracking-widest transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              title={user?.name}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              title="Log Keluar"
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {navOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setNavOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="sm:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
                <button
                  onClick={() => { navigate("/"); setNavOpen(false); }}
                  className="font-serif text-lg text-gray-800 tracking-wide hover:opacity-70 transition-opacity"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  WedInBytes
                </button>
                <button onClick={() => setNavOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
                {navItems.map(({ label, onClick }, i) => (
                  <motion.button
                    key={label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    onClick={onClick}
                    className="text-left text-sm font-semibold text-gray-600 hover:text-gray-900 tracking-widest py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    {label}
                  </motion.button>
                ))}
              </nav>
              <div className="px-5 py-5 border-t border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <LogOut size={15} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Edit / Preview toggle */}
      <div className="lg:hidden flex border-b border-gray-100 bg-white">
        {(["edit", "preview"] as const).map((view) => (
          <button
            key={view}
            onClick={() => setMobileView(view)}
            className="flex-1 py-2.5 text-xs font-semibold tracking-widest uppercase transition-colors"
            style={
              mobileView === view
                ? { color: primaryCss, borderBottom: `2px solid ${primaryCss}` }
                : { color: "#9ca3af", borderBottom: "2px solid transparent" }
            }
          >
            {view === "edit" ? "✏ Edit" : "👁 Preview"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 max-w-7xl mx-auto w-full">
        {/* Left: Editor — hidden on mobile when preview is active */}
        <div className={`flex-1 min-w-0 px-4 lg:px-8 py-6 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Digital Card Details</h2>

          {/* Tabs */}
          <div ref={tabsRef} className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
                style={
                  activeTab === tab.id
                    ? { backgroundColor: primaryCss, color: "#fff", borderColor: primaryCss }
                    : { backgroundColor: "#fff", color: "#4b5563", borderColor: "#e5e7eb" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 italic mb-5">
            *Make sure your browser is not in <strong>dark mode</strong><br />
            *This preview may not be an exact match of the final product
          </p>

          <div className="space-y-5">
            {/* ── UTAMA ── */}
            {activeTab === "utama" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Package">
                    <select className={selectCls}>
                      <option>Premium (RM65)</option>
                      <option>Basic (RM35)</option>
                    </select>
                  </Field>
                  <Field label="Language">
                    <select className={selectCls}>
                      <option>Malay</option>
                      <option>English</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Design Code*">
                    <select
                      className={selectCls}
                      value={design.designCode}
                      onChange={(e) => {
                        const picked = availableDesigns.find((d) => d.designCode === e.target.value);
                        if (picked) {
                          // Switch to the picked design's own values.
                          // Secondary/background fall back to primary so every
                          // design stays visually consistent even if not fully configured.
                          const primary = picked.colorPrimary ?? "142 45% 35%";
                          setDesign((p) => ({
                            ...p,
                            designCode:       picked.designCode       ?? p.designCode,
                            openingAnimation: picked.openingAnimation ?? "doors",
                            openButtonText:   picked.openButtonText   ?? "BUKA",
                            nameFontFamily:   picked.nameFontFamily   ?? p.nameFontFamily,
                            nameColor:        picked.nameColor        ?? p.nameColor,
                            colorPrimary:     primary,
                            colorSecondary:   picked.colorSecondary   ?? primary,
                            colorBackground:  picked.colorBackground  ?? primary,
                            colorCard:        picked.colorCard        ?? "0 0% 100%",
                            cardImageUrl:     picked.cardImageUrl     ?? "wed_card_design/20260531-041903-27796.jpg",
                            envelopeImageUrl: picked.envelopeImageUrl ?? "wed_card_design/20260531-041903-27796.jpg",
                            musicUrl:         picked.musicUrl         ?? "",
                            musicTitle:       picked.musicTitle       ?? "",
                            musicArtist:      picked.musicArtist      ?? "",
                          }));
                          setPreviewOpened(true);
                        } else {
                          setDesign((p) => ({ ...p, designCode: e.target.value }));
                        }
                      }}
                    >
                      {availableDesigns.length === 0 && (
                        <option value={design.designCode}>{design.designCode}</option>
                      )}
                      {availableDesigns.map((d) => (
                        <option key={d.id} value={d.designCode ?? ""}>
                          {d.designCode ? `${d.designCode} – ${d.name}` : d.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Opening Style">
                    <select
                      className={selectCls}
                      value={design.openingAnimation}
                      onChange={(e) => setDesign((p) => ({ ...p, openingAnimation: e.target.value }))}
                    >
                      {OPENING_ANIMS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Initials for display */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Groom's Initial">
                    <input
                      className={inputCls}
                      value={inv.groomInitial}
                      onChange={(e) => setI("groomInitial")(e.target.value)}
                      placeholder={inv.groomName ? inv.groomName.charAt(0).toUpperCase() : "H"}
                    />
                  </Field>
                  <Field label="Bride's Initial">
                    <input
                      className={inputCls}
                      value={inv.brideInitial}
                      onChange={(e) => setI("brideInitial")(e.target.value)}
                      placeholder={inv.brideName ? inv.brideName.charAt(0).toUpperCase() : "A"}
                    />
                  </Field>
                </div>

                <Field label="Open Button">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1.5 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                      <button className="font-bold px-1 hover:bg-gray-100 rounded">B</button>
                      <button className="italic px-1 hover:bg-gray-100 rounded">I</button>
                      <button className="underline px-1 hover:bg-gray-100 rounded">U</button>
                      <button className="line-through px-1 hover:bg-gray-100 rounded">S</button>
                      <span className="px-1 text-gray-300">|</span>
                      <span className="px-1">10px</span>
                      <span className="px-1 text-gray-300">|</span>
                      <span className="px-1">A</span>
                      <span className="px-1 text-gray-300">|</span>
                      <span className="px-1">Default</span>
                    </div>
                    <input
                      className="w-full px-3 py-2.5 text-sm focus:outline-none bg-transparent text-center"
                      value={design.openButtonText}
                      onChange={(e) => setDesign((p) => ({ ...p, openButtonText: e.target.value }))}
                      placeholder="BUKA"
                    />
                  </div>
                </Field>

                {/* Color swatches */}
                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { label: "Open Button",   field: "colorPrimary"    as const, def: "142 45% 35%" },
                    { label: "Card Panel",    field: "colorCard"       as const, def: "0 0% 100%" },
                    { label: "Background",    field: "colorBackground" as const, def: "142 20% 96%" },
                    { label: "Accent",        field: "colorSecondary"  as const, def: "142 30% 92%" },
                  ].map(({ label, field, def }) => (
                    <label key={field} className="flex items-center gap-1.5 cursor-pointer group">
                      <div className="relative w-6 h-6 rounded-full border border-gray-200 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                        <div className="absolute inset-0" style={{ background: `hsl(${design[field] || def})` }} />
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          value={hslToHex(design[field] || def)}
                          onChange={(e) => setDesign(p => ({ ...p, [field]: hexToHsl(e.target.value) }))}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* ── MUKA DEPAN ── */}
            {activeTab === "muka-depan" && (
              <>
                <Field label="Event Type">
                  <textarea className={textareaCls} rows={2} value={inv.eventType} onChange={(e) => setI("eventType")(e.target.value)} placeholder="WEDDING RECEPTION" />
                </Field>
                <Field label="Couple Count*">
                  <select
                    className={selectCls}
                    value={String(inv.coupleCount)}
                    onChange={(e) => setInv((p) => ({ ...p, coupleCount: Number(e.target.value) }))}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </Field>
                <Field label="Short Name*">
                  <input className={inputCls} value={inv.shortCoupleName} onChange={(e) => setI("shortCoupleName")(e.target.value)} placeholder={`${inv.brideName || "Ain"} & ${inv.groomName || "Hidayat"}`} />
                </Field>

                {/* Font + size */}
                <Field label="">
                  <div className="flex gap-2 items-center">
                    <select
                      className={`${selectCls} flex-1`}
                      value={design.nameFontFamily}
                      style={{ fontFamily: design.nameFontFamily }}
                      onChange={(e) => setDesign((p) => ({ ...p, nameFontFamily: e.target.value }))}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 border border-gray-200 rounded px-2 py-2 bg-white cursor-pointer group">
                      <div className="relative w-4 h-4 rounded-full border border-gray-300 overflow-hidden group-hover:scale-110 transition-transform">
                        <div className="absolute inset-0" style={{ background: design.nameColor ? `hsl(${design.nameColor})` : "#4a3520" }} />
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          value={hslToHex(design.nameColor || "20 50% 20%")}
                          onChange={(e) => setDesign(p => ({ ...p, nameColor: hexToHsl(e.target.value) }))}
                        />
                      </div>
                      <span className="text-xs text-gray-500">Colour</span>
                    </label>
                  </div>
                </Field>

                <Field label={`Font Size — ${design.nameFontSize || 38}px`}>
                  <input
                    type="range" min={20} max={70}
                    value={Number(design.nameFontSize) || 38}
                    onChange={(e) => setDesign((p) => ({ ...p, nameFontSize: e.target.value }))}
                    className="w-full accent-blue-500"
                  />
                </Field>

                {/* Live name preview */}
                <div
                  className="w-full rounded border border-gray-200 bg-[#fdf6ee] text-center py-4 px-6 overflow-hidden"
                  style={{ fontFamily, fontSize, color: nameColorStyle, lineHeight: 1.2 }}
                >
                  {displayName}
                </div>

                <Field label="Additional Info (if any)">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                      <button className="font-bold px-1">B</button>
                      <button className="italic px-1">I</button>
                      <button className="underline px-1">U</button>
                      <span className="px-1 text-gray-300">|</span>
                      <span>18px</span>
                      <span className="px-1 text-gray-300">|</span>
                      <span style={{ fontFamily: "Dancing Script" }}>Nova Quinta</span>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-transparent"
                      rows={3}
                      value={inv.additionalInfo}
                      onChange={(e) => setI("additionalInfo")(e.target.value)}
                      placeholder="Forest Valley Hall,&#10;Cheras, Selangor"
                      style={{ fontFamily: "Dancing Script, cursive", fontSize: 18, textAlign: "center" }}
                    />
                  </div>
                </Field>

                <Field label="Event Start Date & Time*">
                  <input type="datetime-local" className={inputCls} value={inv.eventStartDateTime} onChange={(e) => setI("eventStartDateTime")(e.target.value)} />
                </Field>
                <Field label="Event End Date & Time*">
                  <input type="datetime-local" className={inputCls} value={inv.eventEndDateTime} onChange={(e) => setI("eventEndDateTime")(e.target.value)} />
                </Field>
                <Field label="Cover Date*">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500">
                      <button className="font-bold px-1">B</button>
                      <button className="italic px-1">I</button>
                      <button className="underline px-1">U</button>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-transparent"
                      rows={2}
                      value={inv.coverDateText}
                      onChange={(e) => setI("coverDateText")(e.target.value)}
                      placeholder="taurjfn"
                    />
                  </div>
                </Field>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox" id="showFrontText"
                    checked={inv.showFrontText}
                    onChange={(e) => setInv((p) => ({ ...p, showFrontText: e.target.checked }))}
                    className="w-4 h-4 accent-gray-700 rounded"
                  />
                  <label htmlFor="showFrontText" className="text-sm text-gray-700 font-medium cursor-pointer">
                    Show Front Text
                  </label>
                </div>
              </>
            )}

            {/* ── AYAT UNDANGAN ── */}
            {activeTab === "ayat-undangan" && (
              <>
                <Field label="Welcome Message">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                      <button className="font-bold px-1">B</button><button className="italic px-1">I</button>
                      <button className="underline px-1">U</button><span className="px-1 text-gray-300">|</span>
                      <span>16px</span><span className="px-1 text-gray-300">|</span>
                      <span style={{ fontFamily: "Dancing Script" }}>Nova Quinta</span>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-transparent"
                      rows={4}
                      value={inv.greetingText}
                      onChange={(e) => setI("greetingText")(e.target.value)}
                      style={{ fontFamily: "Dancing Script, cursive", textAlign: "center" }}
                    />
                  </div>
                </Field>

                <Field label="Number of Hosts*">
                  <select
                    className={selectCls}
                    value={String(inv.hostCount)}
                    onChange={(e) => setInv((p) => ({ ...p, hostCount: Number(e.target.value) }))}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </Field>

                <Field label="Host Names">
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={inv.hostName}
                    onChange={(e) => setI("hostName")(e.target.value)}
                    placeholder="James & Sarah"
                  />
                </Field>

                <Field label="Invitation Text">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                      <button className="font-bold px-1">B</button><button className="italic px-1">I</button>
                      <button className="underline px-1">U</button><span className="px-1 text-gray-300">|</span>
                      <span>10px</span>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-transparent"
                      rows={4}
                      value={inv.invitationText}
                      onChange={(e) => setI("invitationText")(e.target.value)}
                      style={{ textAlign: "center" }}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Groom's Name">
                    <input className={inputCls} value={inv.groomName} onChange={(e) => setI("groomName")(e.target.value)} placeholder="Groom's name" />
                  </Field>
                  <Field label="Bride's Name">
                    <input className={inputCls} value={inv.brideName} onChange={(e) => setI("brideName")(e.target.value)} placeholder="Bride's name" />
                  </Field>
                </div>

                <Field label="Groom's Parents' Names">
                  <textarea className={textareaCls} rows={2} value={inv.groomParents} onChange={(e) => setI("groomParents")(e.target.value)} placeholder="Mr. John Smith & Mrs. Mary Smith" />
                </Field>
                <Field label="Bride's Parents' Names">
                  <textarea className={textareaCls} rows={2} value={inv.brideParents} onChange={(e) => setI("brideParents")(e.target.value)} placeholder="Mr. David Lee & Mrs. Susan Lee" />
                </Field>
              </>
            )}

            {/* ── LOKASI & ATUR CARA ── */}
            {activeTab === "lokasi" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Event Day*">
                    <input className={inputCls} value={inv.eventDay} onChange={(e) => setI("eventDay")(e.target.value)} placeholder="SABTU" />
                  </Field>
                  <Field label="Event Date*">
                    <input className={inputCls} value={inv.eventDate} onChange={(e) => setI("eventDate")(e.target.value)} placeholder="15 November 2025" />
                  </Field>
                  <Field label="Event Time*">
                    <input className={inputCls} value={inv.eventTime} onChange={(e) => setI("eventTime")(e.target.value)} placeholder="11:00 am – 4:00 pm" />
                  </Field>
                </div>
                <Field label="Venue Name*">
                  <input className={inputCls} value={inv.venueName} onChange={(e) => setI("venueName")(e.target.value)} placeholder="Grand Ballroom, Hilton" />
                </Field>
                <Field label="Hijri Date (if applicable)">
                  <input className={inputCls} value={inv.venueHijriDate} onChange={(e) => setI("venueHijriDate")(e.target.value)} placeholder="-" />
                </Field>
                <Field label="Venue Address*">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                      <button className="font-bold px-1">B</button><button className="italic px-1">I</button>
                      <button className="underline px-1">U</button><span className="px-1 text-gray-300">|</span>
                      <span>18px</span><span className="px-1 text-gray-300">|</span>
                      <span style={{ fontFamily: "Dancing Script" }}>Nova Quinta</span>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-transparent"
                      rows={4}
                      value={inv.venueAddress}
                      onChange={(e) => setI("venueAddress")(e.target.value)}
                      placeholder={`Forest Valley Hall,\nJalan Permaisuri 10/6,\nBandar Mahkota Cheras,\n43200 Cheras, Selangor`}
                      style={{ fontFamily: "Dancing Script, cursive", fontSize: 16, textAlign: "center" }}
                    />
                  </div>
                </Field>
                <Field label="GPS Coordinates*">
                  <input className={inputCls} value={inv.venueMapUrl} onChange={(e) => setI("venueMapUrl")(e.target.value)} placeholder="3.05064,101.79395" />
                </Field>
                <Field label="City / State">
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputCls} value={inv.venueCity} onChange={(e) => setI("venueCity")(e.target.value)} placeholder="Cheras" />
                    <input className={inputCls} value={inv.venueState} onChange={(e) => setI("venueState")(e.target.value)} placeholder="Selangor" />
                  </div>
                </Field>
                <Field label="Dress Code">
                  <input className={inputCls} value={inv.dresscode} onChange={(e) => setI("dresscode")(e.target.value)} placeholder="Pastel / Formal" />
                </Field>
                <Field label="Event Programme*">
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="flex gap-1 items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500 flex-wrap">
                      <button className="font-bold px-1">B</button><button className="italic px-1">I</button>
                      <button className="underline px-1">U</button>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-transparent"
                      rows={5}
                      value={inv.schedule}
                      onChange={(e) => setI("schedule")(e.target.value)}
                      placeholder={`Dining Reception:\n11:00 am - 4:00 pm\n\nCouple's Arrival:\n12:30 pm`}
                      style={{ textAlign: "center" }}
                    />
                  </div>
                </Field>
              </>
            )}

            {/* ── RSVP / UCAPAN ── */}
            {activeTab === "rsvp" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">RSVP form and message settings.</p>
                <Field label="Invitation Message">
                  <textarea className={textareaCls} rows={4} value={inv.message} onChange={(e) => setI("message")(e.target.value)} placeholder="With heartfelt gratitude, we joyfully invite you to celebrate our wedding." />
                </Field>
              </div>
            )}

            {/* ── HUBUNGI ── */}
            {activeTab === "hubungi" && (
              <>
                <Field label="Phone Number*">
                  <input className={inputCls} value={inv.contactPhone} onChange={(e) => setI("contactPhone")(e.target.value)} placeholder="0123456789" />
                </Field>
              </>
            )}

            {/* ── LAGU ── */}
            {activeTab === "lagu" && (
              <>
                <Field label="Song Link (YouTube only)">
                  <input
                    className={inputCls}
                    value={design.musicUrl}
                    onChange={(e) => setDesign((p) => ({ ...p, musicUrl: e.target.value }))}
                    placeholder="cth: https://www.youtube.com/watch?v=viW0M5R2BLo1"
                  />
                </Field>
                {design.musicUrl && design.musicUrl.includes("youtube") && (
                  <div className="rounded overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${design.musicUrl.split("v=")[1]?.split("&")[0]}`}
                      allow="autoplay"
                      className="block"
                    />
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-700 space-y-1">
                  <p>Sokongan autoplay bergantung kepada peranti & pelayar.</p>
                  <p><strong>Menyokong:</strong> Chrome, Safari, Firefox, Opera, Brave, Edge & UC Browser versi terkini.</p>
                  <p><strong>Tidak Menyokong:</strong> Facebook/Instagram/Telegram Browser & pelayar kurang popular.</p>
                </div>
              </>
            )}

            {/* ── GALERI & HADIAH ── */}
            {activeTab === "galeri" && (
              <p className="text-sm text-gray-500">Gallery &amp; gifts feature coming soon.</p>
            )}

            {/* ── LAIN-LAIN ── */}
            {activeTab === "lain" && (
              <p className="text-sm text-gray-500">Other settings coming soon.</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-white px-6 py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: primaryCss }}
            >
              {saving ? "Saving..." : "SAVE"}
            </button>
            <button
              onClick={handleBack}
              className="bg-white text-gray-700 px-6 py-2.5 rounded text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              BACK
            </button>
          </div>
        </div>

        {/* Right: Card Preview — always shown on mobile when preview tab active */}
        <div className={`${mobileView === "preview" ? "flex" : "hidden"} lg:flex lg:w-[340px] xl:w-[380px] shrink-0 items-start justify-center py-4 px-4 lg:py-6 lg:pr-6`}>
          <div className="sticky top-6 w-full space-y-2">

            {/* Full preview + reset row */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={async () => {
                  await handleSave();
                  const token = inv.token;
                  if (token) window.open(`${BASE}/invite/${token}`, "_blank");
                }}
                className="text-xs text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-full px-3 py-1 font-medium transition-colors disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving…" : "↗ Full Preview"}
              </button>
              {previewOpened && (
                <button
                  onClick={() => setPreviewOpened(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full px-3 py-1 ml-auto"
                >
                  ↩ Close
                </button>
              )}
            </div>

            {/* Scoped design-token container — keyed on designCode so it fully
                remounts when the user switches designs, guaranteeing fresh CSS vars */}
            <div
              key={design.designCode}
              className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-background"
              style={{
                aspectRatio: "9/16",
                maxHeight: "80vh",
                "--card-viewport-height": "100%",
                "--primary":            design.colorPrimary     || "142 45% 35%",
                "--primary-foreground": "0 0% 100%",
                "--secondary":          design.colorSecondary   || "142 30% 92%",
                "--background":         design.colorBackground  || "142 20% 96%",
                "--card":               design.colorCard        || "0 0% 100%",
                "--popover":            design.colorCard        || "0 0% 100%",
                "--border":             "142 20% 80%",
                "--muted":              "142 15% 94%",
                "--muted-foreground":   "142 10% 45%",
                // Name styling — picked up by WeddingCard via CSS custom properties
                "--name-font-family":   design.nameFontFamily   || "Dancing Script, cursive",
                "--name-font-size":     `${Number(design.nameFontSize) || 38}px`,
                "--name-color":         design.nameColor ? `hsl(${design.nameColor})` : "hsl(20 50% 25%)",
              } as React.CSSProperties}
            >
              <div
                className={`absolute inset-0 z-10 transition-all duration-700 ${
                  previewOpened ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden pointer-events-none"
                }`}
                style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
              >
                <WeddingCard
                  invitation={inv}
                  cardImageUrl={resolveImageUrl(design.cardImageUrl || "wed_card_design/20260531-041903-27796.jpg")}
                  envelopeImageUrl={resolveImageUrl(design.envelopeImageUrl || "wed_card_design/20260531-041903-27796.jpg")}
                  cardMaxWidth="100%"
                />
              </div>

              {/* Opening animation mirrors InvitationPage, scaled to this preview frame. */}
              {(
                design.openingAnimation === "envelope" ? (
                  <EnvelopeAnimation
                    key={`env-${activeTab}-${design.designCode}`}
                    isOpened={previewOpened}
                    onOpen={() => setPreviewOpened(true)}
                    names={inv.shortCoupleName || `${inv.brideInitial || inv.brideName || "Ain"} & ${inv.groomInitial || inv.groomName || "Hidayat"}`}
                    openButtonText={design.openButtonText || "BUKA"}
                    envelopeImageUrl={resolveImageUrl(design.envelopeImageUrl || "wed_card_design/20260531-041903-27796.jpg")}
                  />
                ) : (
                  <EnvelopeDoors
                    key={`doors-${activeTab}-${design.designCode}`}
                    isOpened={previewOpened}
                    onOpen={() => setPreviewOpened(true)}
                    names={inv.shortCoupleName || `${inv.brideInitial || inv.brideName || "Ain"} & ${inv.groomInitial || inv.groomName || "Hidayat"}`}
                    openButtonText={design.openButtonText || "BUKA"}
                    envelopeImageUrl={resolveImageUrl(design.envelopeImageUrl || "wed_card_design/20260531-041903-27796.jpg")}
                    cardMaxWidth="100%"
                  />
                )
              )}

              {/* PREVIU watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: "rotate(-30deg)", zIndex: 40 }}
              >
                <span className="text-white/20 font-black tracking-[0.3em] select-none" style={{ fontSize: 52 }}>
                  PREVIEW
                </span>
              </div>

              {/* Bottom nav — solid bar matching BottomNav component style */}
              {previewOpened && (
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-1 py-1"
                  style={{ zIndex: 60, backgroundColor: primaryCss }}
                >
                  {([
                    { icon: Music,          label: "Music",       tab: "muzik" },
                    { icon: Calendar,       label: "Calendar",    tab: "kalendar" },
                    { icon: Heart,          label: "With Love",   tab: "salam" },
                    { icon: MapPin,         label: "Location",    tab: "lokasi" },
                    { icon: Phone,          label: "Contact",     tab: "hubungi" },
                    { icon: MessageSquare,  label: "RSVP",        tab: "rsvp" },
                  ] as { icon: React.ElementType; label: string; tab: string }[]).map(({ icon: Icon, label, tab }) => {
                    const isActive = previewActiveTab === tab;
                    return (
                      <button
                        key={label}
                        onClick={() => setPreviewActiveTab((prev) => prev === tab ? null : tab)}
                        className="flex flex-col items-center gap-0.5 px-0.5 py-0.5 transition-all active:scale-90"
                      >
                        <div
                          className="flex items-center justify-center w-5 h-5 rounded-full transition-colors"
                          style={{ backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "transparent" }}
                        >
                          <Icon size={10} strokeWidth={isActive ? 2.5 : 1.8} color="white" />
                        </div>
                        <span className="text-[6px] font-medium leading-tight text-white" style={{ opacity: isActive ? 1 : 0.85 }}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
