import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EnvelopeDoors } from "@/components/EnvelopeDoors";
import { EnvelopeAnimation } from "@/components/EnvelopeAnimation";
import { WeddingCard } from "@/components/WeddingCard";
import { BottomNav } from "@/components/BottomNav";
import { DetailPanel, type TabKey } from "@/components/DetailPanel";
import { RichTextEditor } from "@/components/RichTextEditor";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Calendar, Heart, MapPin, Phone, MessageSquare, Menu, X, User, LogOut, Loader2, Plus, Trash2 } from "lucide-react";
import { useListDesigns, useGetActiveDesign } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
import { resolveImageUrl } from "@/lib/r2-url";

const TABS = [
  { id: "muka-depan", label: "COVER" },
  { id: "utama", label: "MAIN" },
  { id: "warna", label: "COLOR" },
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

// Map legacy / custom font names to real Google Fonts so they actually render.
const FONT_ALIASES: Record<string, string> = {
  Magnolia: "Great Vibes",
  Esthetique: "Alex Brush",
};

function normalizeFont(fontName?: string | null): string {
  if (!fontName) return "Dancing Script";
  return FONT_ALIASES[fontName] || fontName;
}

function fontFamilyStack(fontName?: string | null): string {
  const normalized = normalizeFont(fontName);
  // Preserve explicit fallbacks for web-safe fonts; otherwise add a sensible fallback chain
  if (normalized.includes(",")) return normalized;
  return `'${normalized}', 'Dancing Script', cursive`;
}
// Font options split into two groups so customers can pick a script font for
// names and a classic font for body text independently.
const SCRIPT_FONTS = [
  { value: "Dancing Script", label: "Dancing Script" },
  { value: "Great Vibes", label: "Magnolia (Great Vibes)" },
  { value: "Alex Brush", label: "Esthetique (Alex Brush)" },
  { value: "Allura", label: "Allura" },
  { value: "Pinyon Script", label: "Pinyon Script" },
  { value: "Style Script", label: "Style Script" },
  { value: "Petit Formal Script", label: "Petit Formal Script" },
  { value: "Meow Script", label: "Meow Script" },
  { value: "Rouge Script", label: "Rouge Script" },
  { value: "Lily Script One", label: "Lily Script One" },
];

const CLASSIC_FONTS = [
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Poppins", label: "Poppins" },
  { value: "Lato", label: "Lato" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
];

type Contact = { name: string; phone: string };

function normalizeContacts(raw: unknown, fallbackPhone: string): Contact[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((c): c is { name?: unknown; phone?: unknown } => c && typeof c === "object")
      .map((c) => ({ name: String(c.name ?? ""), phone: String(c.phone ?? "") }))
      .filter((c) => c.name || c.phone);
  }
  if (fallbackPhone) return [{ name: "Contact", phone: fallbackPhone }];
  return [];
}

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
  contacts: Contact[];
  dresscode: string;
  message: string;
  shortCoupleName: string;
  groomShortName: string;
  brideShortName: string;
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
  // RSVP settings
  rsvpEnabled: boolean;
  rsvpAdditionalInfo: string;
  rsvpDeadline: string;
  rsvpIntroText: string;
  rsvpFormNote: string;
  rsvpMaxOverallGuests: number;
  rsvpMaxGuestsPerInvitation: number;
  rsvpTimeSlots: string;
}

interface DesignData {
  designCode: string;
  openingAnimation: string;
  openButtonText: string;
  nameFontFamily: string;
  nameFontSize: string;
  badgeFontSize: string;
  nameColor: string;
  bodyFontFamily: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorCard: string;
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  cardImageUrl: string;
  envelopeImageUrl: string;
  cardMaxWidth: string;
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

export default function EditorPage({ mode = "buyer" }: { mode?: "buyer" | "demo" }) {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("muka-depan");
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [previewOpened, setPreviewOpened] = useState(true);
  const [previewActiveTab, setPreviewActiveTab] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { data: availableDesigns = [] } = useListDesigns();
  const { data: activeDesign } = useGetActiveDesign();

  const [inv, setInv] = useState<InvData>({
    id: 0,
    token: "",
    groomName: "", brideName: "", eventType: "Walimatul Urus",
    eventDate: "", eventDay: "", eventTime: "11:00 am – 4:00 pm",
    venueName: "", venueAddress: "", venueCity: "", venueState: "",
    venueMapUrl: "", groomParents: "", brideParents: "", contactPhone: "", contacts: [],
    dresscode: "", message: "",
    shortCoupleName: "", groomShortName: "", brideShortName: "", coupleCount: 1,
    groomInitial: "", brideInitial: "",
    eventStartDateTime: "", eventEndDateTime: "", coverDateText: "",
    additionalInfo: "", showFrontText: true,
    greetingText: "Undangan Majlis Perkahwinan",
    invitationText: "Assalamualaikum wbt & salam sejahtera,\nDengan penuh kesyukuran, kami menjemput\nDato' | Datin | Tuan | Puan | Encik | Cik\nke majlis perkahwinan anakanda kami",
    hostName: "", hostCount: 1, venueHijriDate: "", schedule: "",
    rsvpEnabled: false, rsvpAdditionalInfo: "", rsvpDeadline: "",
    rsvpIntroText: "", rsvpFormNote: "",
    rsvpMaxOverallGuests: 1000, rsvpMaxGuestsPerInvitation: 10, rsvpTimeSlots: "",
  });

  const [design, setDesign] = useState<DesignData>({
    designCode: "FL001", openingAnimation: "doors", openButtonText: "BUKA",
    nameFontFamily: "Dancing Script", nameFontSize: "38", badgeFontSize: "24",
    nameColor: "0 0% 20%", bodyFontFamily: "Poppins",
    colorPrimary: "142 45% 35%", colorSecondary: "142 30% 92%",
    colorBackground: "142 20% 96%", colorCard: "0 0% 100%",
    musicUrl: "", musicTitle: "", musicArtist: "",
    cardImageUrl: "wed_card_design/20260531-041903-27796.jpg", envelopeImageUrl: "wed_card_design/20260531-041903-27796.jpg",
    cardMaxWidth: "420px",
  });

  // Inherited colours from the selected catalog design (or the global demo design as fallback).
  // Buyer overrides are only saved when they differ from these inherited values.
  const [inheritedColors, setInheritedColors] = useState<Pick<DesignData, "nameColor" | "colorPrimary" | "colorSecondary" | "colorBackground" | "colorCard">>({
    nameColor: "0 0% 20%", colorPrimary: "142 45% 35%", colorSecondary: "142 30% 92%", colorBackground: "142 20% 96%", colorCard: "0 0% 100%",
  });

  // Redirect if not logged in (buyer mode → /login; demo mode → /admin/login)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const loginPath = mode === "demo" ? "/admin/login" : "/login";
      navigate(`${loginPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (mode === "demo" && user.role !== "admin") {
      navigate("/dashboard");
      toast.error("Admin access only.");
    }
    if (mode === "buyer" && user.role !== "admin") {
      // Buyer mode is fine for any logged-in user
      return;
    }
  }, [user, authLoading, navigate, mode]);

  // Load invitation + global design (for images/music only)
  const loadData = useCallback(async (silent = false) => {
    if (mode === "buyer" && !user) return;
    if (!silent) setDataLoading(true);
    try {
      const [invRes, designRes, allDesRes] = await Promise.all([
        mode === "demo"
          ? fetch(`${BASE}/api/invitation/demo`, { credentials: "include", cache: "no-store" })
          : fetch(`${BASE}/api/invitation-by-user/${user!.id}`, { credentials: "include", cache: "no-store" }),
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
          cardMaxWidth:     tpl.cardMaxWidth     ?? gd.cardMaxWidth    ?? "420px",
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
          eventType: d.eventType ?? "Walimatul Urus",
          eventDate: d.eventDate ?? "", eventDay: d.eventDay ?? "",
          eventTime: d.eventTime ?? "11:00 am – 4:00 pm",
          venueName: d.venueName ?? "", venueAddress: d.venueAddress ?? "",
          venueCity: d.venueCity ?? "", venueState: d.venueState ?? "",
          venueMapUrl: d.venueMapUrl ?? "", groomParents: d.groomParents ?? "",
          brideParents: d.brideParents ?? "", contactPhone: d.contactPhone ?? "",
          contacts: normalizeContacts(d.contacts, d.contactPhone ?? ""),
          dresscode: d.dresscode ?? "", message: d.message ?? "",
          shortCoupleName: d.shortCoupleName ?? "",
          groomShortName: d.groomShortName ?? (d.shortCoupleName as string | undefined)?.split(" & ")[1]?.trim() ?? "",
          brideShortName: d.brideShortName ?? (d.shortCoupleName as string | undefined)?.split(" & ")[0]?.trim() ?? "",
          coupleCount: d.coupleCount ?? 1,
          groomInitial: d.groomInitial ?? "", brideInitial: d.brideInitial ?? "",
          eventStartDateTime: d.eventStartDateTime ?? "",
          eventEndDateTime: d.eventEndDateTime ?? "",
          coverDateText: d.coverDateText ?? "",
          additionalInfo: d.additionalInfo ?? "",
          showFrontText: d.showFrontText ?? true,
          greetingText: d.greetingText ?? "Undangan Majlis Perkahwinan",
          invitationText: d.invitationText ?? "Assalamualaikum wbt & salam sejahtera,\nDengan penuh kesyukuran, kami menjemput\nDato' | Datin | Tuan | Puan | Encik | Cik\nke majlis perkahwinan anakanda kami",
          hostName: d.hostName ?? "", hostCount: d.hostCount ?? 1,
          venueHijriDate: d.venueHijriDate ?? "", schedule: d.schedule ?? "",
          rsvpEnabled: d.rsvpEnabled ?? false,
          rsvpAdditionalInfo: d.rsvpAdditionalInfo ?? "",
          rsvpDeadline: d.rsvpDeadline ? new Date(d.rsvpDeadline).toISOString().slice(0, 16) : "",
          rsvpIntroText: d.rsvpIntroText ?? "",
          rsvpFormNote: d.rsvpFormNote ?? "",
          rsvpMaxOverallGuests: d.rsvpMaxOverallGuests ?? 1000,
          rsvpMaxGuestsPerInvitation: d.rsvpMaxGuestsPerInvitation ?? 10,
          rsvpTimeSlots: d.rsvpTimeSlots ?? "",
        });
        // URL param ?designCode= takes priority (user clicked "Personalise" on a specific card)
        const resolvedCode = urlDesignCode ?? d.designCode ?? gd.designCode ?? "FL001";
        const tpl = resolveTemplate(resolvedCode);
        setInheritedColors({
          nameColor:        tpl.nameColor,
          colorPrimary:     tpl.colorPrimary,
          colorSecondary:   tpl.colorSecondary,
          colorBackground:  tpl.colorBackground,
          colorCard:        tpl.colorCard,
        });
        // Buyer per-invitation overrides take priority; template values are the fallback
        setDesign({
          designCode:       resolvedCode,
          openingAnimation: d.openingAnimation ?? tpl.openingAnimation,
          openButtonText:   d.openButtonText   ?? "BUKA",
          nameFontFamily:   normalizeFont(d.nameFontFamily   ?? tpl.nameFontFamily),
          nameFontSize:     d.nameFontSize      ?? "38",
          badgeFontSize:    d.badgeFontSize     ?? "24",
          nameColor:        d.nameColor         ?? tpl.nameColor,
          cardMaxWidth:     d.cardMaxWidth      ?? tpl.cardMaxWidth,
          bodyFontFamily:   normalizeFont(d.bodyFontFamily    ?? "Poppins"),
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
        setInheritedColors({
          nameColor:        tplFallback.nameColor,
          colorPrimary:     tplFallback.colorPrimary,
          colorSecondary:   tplFallback.colorSecondary,
          colorBackground:  tplFallback.colorBackground,
          colorCard:        tplFallback.colorCard,
        });
        setDesign((prev) => ({
          ...prev,
          designCode:       resolvedCode,
          colorPrimary:     tplFallback.colorPrimary,
          colorSecondary:   tplFallback.colorSecondary,
          colorBackground:  tplFallback.colorBackground,
          colorCard:        tplFallback.colorCard,
          openingAnimation: tplFallback.openingAnimation,
          nameFontFamily:   normalizeFont(tplFallback.nameFontFamily),
          nameColor:        tplFallback.nameColor,
          cardMaxWidth:     tplFallback.cardMaxWidth,
          bodyFontFamily:   "Poppins",
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
      const token = mode === "demo" ? "demo" : inv.token;

      // If buyer has no invitation yet, create one first
      if (mode === "buyer" && !token) {
        const createRes = await fetch(`${BASE}/api/invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            groomName: inv.groomName || "Groom",
            brideName: inv.brideName || "Bride",
            eventType: inv.eventType || "Walimatul Urus",
            eventDate: inv.eventDate || "", eventDay: inv.eventDay || "",
            eventTime: inv.eventTime || "11:00 am – 4:00 pm",
            venueName: inv.venueName || "", venueAddress: inv.venueAddress || "",
            venueCity: inv.venueCity || "", venueState: inv.venueState || "",
            contactPhone: inv.contactPhone || "",
            contacts: inv.contacts.length > 0 ? inv.contacts : undefined,
          }),
        });
        if (!createRes.ok) {
          toast.error("Failed to create card. Please try again.");
          return;
        }
        const created = await createRes.json();
        const newToken = created.token as string;
        setInv((p) => ({ ...p, token: newToken }));
      }

      const saveToken = mode === "demo" ? "demo" : (token || inv.token);

      // All fields — invitation content AND buyer design overrides — go to the invitation record.
      // The global card_design table is never touched by the buyer, so the demo stays intact.
      const r = await fetch(`${BASE}/api/invitation/${saveToken}`, {
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
          contactPhone: inv.contactPhone,
          contacts: inv.contacts.length > 0 ? inv.contacts : undefined,
          dresscode: inv.dresscode || undefined,
          message: inv.message || undefined,
          shortCoupleName: inv.shortCoupleName || undefined,
          groomShortName: inv.groomShortName || undefined,
          brideShortName: inv.brideShortName || undefined,
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
          rsvpEnabled: inv.rsvpEnabled,
          rsvpAdditionalInfo: inv.rsvpAdditionalInfo || undefined,
          rsvpDeadline: inv.rsvpDeadline || undefined,
          rsvpIntroText: inv.rsvpIntroText || undefined,
          rsvpFormNote: inv.rsvpFormNote || undefined,
          rsvpMaxOverallGuests: inv.rsvpMaxOverallGuests,
          rsvpMaxGuestsPerInvitation: inv.rsvpMaxGuestsPerInvitation,
          rsvpTimeSlots: inv.rsvpTimeSlots || undefined,
          // Buyer design overrides (stored per-invitation, does NOT affect demo)
          designCode: design.designCode != null ? design.designCode : undefined,
          openingAnimation: design.openingAnimation || undefined,
          openButtonText: design.openButtonText || undefined,
          nameFontFamily: design.nameFontFamily || undefined,
          nameFontSize: design.nameFontSize || undefined,
          badgeFontSize: design.badgeFontSize || undefined,
          // Only save colour overrides when the buyer changed them from the inherited template/demo values.
          nameColor:        design.nameColor        !== inheritedColors.nameColor        ? (design.nameColor || undefined)        : undefined,
          bodyFontFamily: design.bodyFontFamily || undefined,
          colorPrimary:     design.colorPrimary     !== inheritedColors.colorPrimary     ? (design.colorPrimary || undefined)     : undefined,
          colorSecondary:   design.colorSecondary   !== inheritedColors.colorSecondary   ? (design.colorSecondary || undefined)   : undefined,
          colorBackground:  design.colorBackground  !== inheritedColors.colorBackground  ? (design.colorBackground || undefined)  : undefined,
          colorCard:        design.colorCard        !== inheritedColors.colorCard        ? (design.colorCard || undefined)        : undefined,
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
    navigate(mode === "demo" ? "/admin" : "/dashboard");
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

  const displayName =
    (inv.groomShortName && inv.brideShortName)
      ? `${inv.groomShortName} & ${inv.brideShortName}`
      : inv.shortCoupleName || `${inv.brideName} & ${inv.groomName}` || "Ain & Hidayat";
  const fontSize = Number(design.nameFontSize) || 38;
  const fontFamily = fontFamilyStack(design.nameFontFamily);
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
          <div className="flex-1 flex sm:flex-none items-center justify-center sm:justify-start gap-3">
            {mode === "demo" && (
              <button
                onClick={handleBack}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 tracking-widest transition-colors"
              >
                ← BACK TO ADMIN
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="font-serif text-xl text-gray-800 tracking-wide hover:opacity-70 transition-opacity"
            >
              WedInBytes
            </button>
            {mode === "demo" && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold tracking-wider">
                DEMO EDITOR
              </span>
            )}
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
                          const gd = activeDesign as Record<string, string> | undefined;
                          const primary = picked.colorPrimary ?? gd?.colorPrimary ?? "142 45% 35%";
                          const nextInherited = {
                            nameColor:        picked.nameColor       ?? gd?.nameColor       ?? "0 0% 20%",
                            colorPrimary:     primary,
                            colorSecondary:   picked.colorSecondary  ?? gd?.colorSecondary  ?? primary,
                            colorBackground:  picked.colorBackground ?? gd?.colorBackground ?? primary,
                            colorCard:        picked.colorCard       ?? gd?.colorCard       ?? "0 0% 100%",
                          };
                          setInheritedColors(nextInherited);
                          setDesign((p) => ({
                            ...p,
                            ...nextInherited,
                            designCode:       picked.designCode       ?? p.designCode,
                            openingAnimation: picked.openingAnimation ?? "doors",
                            openButtonText:   picked.openButtonText   ?? "BUKA",
                            nameFontFamily:   normalizeFont(picked.nameFontFamily ?? p.nameFontFamily),
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
                        // Remove the ?designCode= URL param so the user's chosen design
                        // isn't overwritten on the next reload/save.
                        const params = new URLSearchParams(window.location.search);
                        if (params.has("designCode")) {
                          params.delete("designCode");
                          const qs = params.toString();
                          navigate(window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash, { replace: true });
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
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Script Font">
                    <select
                      className={selectCls}
                      value={normalizeFont(design.nameFontFamily)}
                      style={{ fontFamily: design.nameFontFamily }}
                      onChange={(e) => setDesign((p) => ({ ...p, nameFontFamily: e.target.value }))}
                    >
                      {SCRIPT_FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">For couple names.</p>
                  </Field>
                  <Field label="Classic Font">
                    <select
                      className={selectCls}
                      value={normalizeFont(design.bodyFontFamily)}
                      style={{ fontFamily: design.bodyFontFamily }}
                      onChange={(e) => setDesign((p) => ({ ...p, bodyFontFamily: e.target.value }))}
                    >
                      {CLASSIC_FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">For greeting, address &amp; details.</p>
                  </Field>
                </div>
                <Field label={`Name Font Size — ${design.nameFontSize || 38}px`}>
                  <input
                    type="range" min={20} max={70}
                    value={Number(design.nameFontSize) || 38}
                    onChange={(e) => setDesign((p) => ({ ...p, nameFontSize: e.target.value }))}
                    className="w-full accent-blue-500"
                  />
                </Field>
                <div
                  className="w-full rounded border border-gray-200 bg-[#fdf6ee] text-center py-4 px-6 overflow-hidden"
                  style={{ fontFamily, fontSize, color: nameColorStyle, lineHeight: 1.2 }}
                >
                  {displayName}
                </div>
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

            {activeTab === "warna" && (
              <>
                <Field label="Script Font Color">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0" style={{ background: design.nameColor ? `hsl(${design.nameColor})` : "#4a3520" }} />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={hslToHex(design.nameColor || "20 50% 20%")}
                        onChange={(e) => setDesign(p => ({ ...p, nameColor: hexToHsl(e.target.value) }))}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Couple names</span>
                  </div>
                </Field>

                <Field label="Button / Open Button">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm">
                      <div className="absolute inset-0" style={{ background: `hsl(${design.colorPrimary || "142 45% 35%"})` }} />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={hslToHex(design.colorPrimary || "142 45% 35%")}
                        onChange={(e) => setDesign(p => ({ ...p, colorPrimary: hexToHsl(e.target.value) }))}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Primary button &amp; accents</span>
                  </div>
                </Field>

                <Field label="Card Panel">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm">
                      <div className="absolute inset-0" style={{ background: `hsl(${design.colorCard || "0 0% 100%"})` }} />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={hslToHex(design.colorCard || "0 0% 100%")}
                        onChange={(e) => setDesign(p => ({ ...p, colorCard: hexToHsl(e.target.value) }))}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Inner panels</span>
                  </div>
                </Field>

                <Field label="Background">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm">
                      <div className="absolute inset-0" style={{ background: `hsl(${design.colorBackground || "142 20% 96%"})` }} />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={hslToHex(design.colorBackground || "142 20% 96%")}
                        onChange={(e) => setDesign(p => ({ ...p, colorBackground: hexToHsl(e.target.value) }))}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Page background</span>
                  </div>
                </Field>

                <Field label="Accent">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm">
                      <div className="absolute inset-0" style={{ background: `hsl(${design.colorSecondary || "142 30% 92%"})` }} />
                      <input
                        type="color"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={hslToHex(design.colorSecondary || "142 30% 92%")}
                        onChange={(e) => setDesign(p => ({ ...p, colorSecondary: hexToHsl(e.target.value) }))}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Soft highlights</span>
                  </div>
                </Field>
              </>
            )}

            {activeTab === "muka-depan" && (
              <>
                <Field label="Couple Short Name (optional)">
                  <input className={inputCls} value={inv.shortCoupleName} onChange={(e) => setI("shortCoupleName")(e.target.value)} placeholder={`${inv.groomShortName || inv.groomName || "Nasser"} & ${inv.brideShortName || inv.brideName || "Alia"}`} />
                </Field>
                <Field label="Badge Font Size (px)">
                  <input
                    className={inputCls}
                    type="number"
                    min={12}
                    max={60}
                    value={design.badgeFontSize || 24}
                    onChange={(e) => setDesign((p) => ({ ...p, badgeFontSize: e.target.value }))}
                    placeholder="24"
                  />
                </Field>

                <Field label="Open Button">
                  <RichTextEditor
                    value={design.openButtonText}
                    onChange={(v) => setDesign((p) => ({ ...p, openButtonText: v }))}
                    placeholder="BUKA"
                    multiLine={false}
                    showFontSize
                  />
                </Field>
              </>
            )}
            {activeTab === "ayat-undangan" && (
              <>
                <Field label="Event Title">
                  <RichTextEditor
                    value={inv.greetingText}
                    onChange={(v) => setI("greetingText")(v)}
                    multiLine
                    showFontSize
                    inputStyle={{ fontFamily: "Poppins, sans-serif", textAlign: "center" }}
                  />
                </Field>

                <Field label="Event Type">
                  <RichTextEditor
                    value={inv.eventType}
                    onChange={(v) => setI("eventType")(v)}
                    placeholder="WEDDING RECEPTION"
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
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
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Groom Short Name*">
                    <input className={inputCls} value={inv.groomShortName} onChange={(e) => setI("groomShortName")(e.target.value)} placeholder={inv.groomName || "Nasser"} />
                  </Field>
                  <Field label="Bride Short Name*">
                    <input className={inputCls} value={inv.brideShortName} onChange={(e) => setI("brideShortName")(e.target.value)} placeholder={inv.brideName || "Alia"} />
                  </Field>
                </div>

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
                  <RichTextEditor
                    value={inv.hostName}
                    onChange={(v) => setI("hostName")(v)}
                    placeholder="James & Sarah"
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>

                <Field label="Invitation Text">
                  <RichTextEditor
                    value={inv.invitationText}
                    onChange={(v) => setI("invitationText")(v)}
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
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
                  <RichTextEditor
                    value={inv.groomParents}
                    onChange={(v) => setI("groomParents")(v)}
                    placeholder="Mr. John Smith & Mrs. Mary Smith"
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>
                <Field label="Bride's Parents' Names">
                  <RichTextEditor
                    value={inv.brideParents}
                    onChange={(v) => setI("brideParents")(v)}
                    placeholder="Mr. David Lee & Mrs. Susan Lee"
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>

                <Field label="Additional Info (if any)">
                  <RichTextEditor
                    value={inv.additionalInfo}
                    onChange={(v) => setI("additionalInfo")(v)}
                    placeholder="Forest Valley Hall,&#10;Cheras, Selangor"
                    multiLine
                    showFontSize
                    inputStyle={{ fontFamily: "Poppins, sans-serif", fontSize: 18, textAlign: "center" }}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Event Start Date & Time*">
                    <input type="datetime-local" className={inputCls} value={inv.eventStartDateTime} onChange={(e) => setI("eventStartDateTime")(e.target.value)} />
                  </Field>
                  <Field label="Event End Date & Time*">
                    <input type="datetime-local" className={inputCls} value={inv.eventEndDateTime} onChange={(e) => setI("eventEndDateTime")(e.target.value)} />
                  </Field>
                </div>
                <Field label="Cover Date*">
                  <RichTextEditor
                    value={inv.coverDateText}
                    onChange={(v) => setI("coverDateText")(v)}
                    placeholder="taurjfn"
                    multiLine
                    showFontSize
                  />
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
                  <RichTextEditor
                    value={inv.venueAddress}
                    onChange={(v) => setI("venueAddress")(v)}
                    placeholder={`Forest Valley Hall,\nJalan Permaisuri 10/6,\nBandar Mahkota Cheras,\n43200 Cheras, Selangor`}
                    multiLine
                    showFontSize
                    inputStyle={{ fontFamily: "Poppins, sans-serif", fontSize: 16, textAlign: "center" }}
                  />
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
                  <RichTextEditor
                    value={inv.schedule}
                    onChange={(v) => setI("schedule")(v)}
                    placeholder={`Dining Reception:\n11:00 am - 4:00 pm\n\nCouple's Arrival:\n12:30 pm`}
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>
              </>
            )}

            {/* ── RSVP / UCAPAN ── */}
            {activeTab === "rsvp" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">RSVP form and message settings.</p>

                <Field label="RSVP">
                  <select
                    className={inputCls}
                    value={inv.rsvpEnabled ? "Ada" : "Tiada"}
                    onChange={(e) => setInv((p) => ({ ...p, rsvpEnabled: e.target.value === "Ada" }))}
                  >
                    <option value="Ada">Ada</option>
                    <option value="Tiada">Tiada</option>
                  </select>
                </Field>

                <Field label="Maklumat Tambahan (jika ada)">
                  <RichTextEditor
                    value={inv.rsvpAdditionalInfo}
                    onChange={(v) => setInv((p) => ({ ...p, rsvpAdditionalInfo: v }))}
                    placeholder="Insert text here ..."
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "left" }}
                  />
                </Field>

                <Field label="Tarikh Akhir RSVP">
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={inv.rsvpDeadline}
                    onChange={(e) => setInv((p) => ({ ...p, rsvpDeadline: e.target.value }))}
                  />
                </Field>

                <Field label="Ayat RSVP">
                  <RichTextEditor
                    value={inv.rsvpIntroText}
                    onChange={(v) => setInv((p) => ({ ...p, rsvpIntroText: v }))}
                    placeholder="Insert text here ..."
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "left" }}
                  />
                </Field>

                <Field label="Nota RSVP (Borang)">
                  <RichTextEditor
                    value={inv.rsvpFormNote}
                    onChange={(v) => setInv((p) => ({ ...p, rsvpFormNote: v }))}
                    placeholder="Insert text here ..."
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "left" }}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Had Keseluruhan Tetamu*" required>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={inv.rsvpMaxOverallGuests}
                      onChange={(e) => setInv((p) => ({ ...p, rsvpMaxOverallGuests: Math.max(1, Number(e.target.value)) }))}
                    />
                  </Field>
                  <Field label="Had Tetamu Setiap Jemputan*" required>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={inv.rsvpMaxGuestsPerInvitation}
                      onChange={(e) => setInv((p) => ({ ...p, rsvpMaxGuestsPerInvitation: Math.max(1, Number(e.target.value)) }))}
                    />
                  </Field>
                </div>

                <Field label="Slot Masa*">
                  <input
                    type="text"
                    className={inputCls}
                    value={inv.rsvpTimeSlots}
                    onChange={(e) => setInv((p) => ({ ...p, rsvpTimeSlots: e.target.value }))}
                    placeholder="e.g. 10:00 AM, 12:00 PM"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pisahkan slot dengan koma. Biarkan kosong untuk Tiada.</p>
                </Field>
              </div>
            )}

            {/* ── HUBUNGI ── */}
            {activeTab === "hubungi" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Contacts</p>
                  {inv.contacts.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setInv((p) => ({ ...p, contacts: [...p.contacts, { name: "", phone: "" }] }))}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus size={14} /> Add contact
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">Add up to 4 contacts with name and phone number.</p>

                {inv.contacts.length === 0 && (
                  <div className="text-sm text-gray-400 italic">No contacts added yet.</div>
                )}

                {inv.contacts.map((contact, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setInv((p) => ({ ...p, contacts: p.contacts.filter((_, i) => i !== idx) }))}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <Field label="Name">
                      <input
                        className={inputCls}
                        value={contact.name}
                        onChange={(e) => setInv((p) => {
                          const next = [...p.contacts];
                          next[idx] = { ...next[idx], name: e.target.value };
                          return { ...p, contacts: next };
                        })}
                        placeholder="e.g. Ain"
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        className={inputCls}
                        value={contact.phone}
                        onChange={(e) => setInv((p) => {
                          const next = [...p.contacts];
                          next[idx] = { ...next[idx], phone: e.target.value };
                          return { ...p, contacts: next };
                        })}
                        placeholder="0123456789"
                      />
                    </Field>
                  </div>
                ))}
              </div>
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
        <div className={`${mobileView === "preview" ? "flex" : "hidden"} lg:flex lg:w-[380px] xl:w-[420px] shrink-0 items-start justify-center py-4 px-4 lg:py-6 lg:pr-6`}>
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
              className={`relative w-full rounded-xl shadow-2xl bg-background ${previewActiveTab ? "overflow-visible" : "overflow-hidden"}`}
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
                "--name-font-family":   fontFamilyStack(design.nameFontFamily),
                "--name-font-size":     `${Number(design.nameFontSize) || 38}px`,
                "--badge-font-size":    `${Number(design.badgeFontSize) || 24}px`,
                "--name-color":         design.nameColor ? `hsl(${design.nameColor})` : "hsl(20 50% 25%)",
                // Body text styling
                "--body-font-family":   fontFamilyStack(design.bodyFontFamily),
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
                  cardMaxWidth={design.cardMaxWidth}
                />
              </div>

              {/* Opening animation mirrors InvitationPage, scaled to this preview frame. */}
              {(
                design.openingAnimation === "envelope" ? (
                  <EnvelopeAnimation
                    key={`env-${activeTab}-${design.designCode}`}
                    isOpened={previewOpened}
                    onOpen={() => setPreviewOpened(true)}
                    names={inv.shortCoupleName || `${inv.groomShortName || inv.groomName || "Nasser"} & ${inv.brideShortName || inv.brideName || "Alia"}`}
                    openButtonText={design.openButtonText || "BUKA"}
                    envelopeImageUrl={resolveImageUrl(design.envelopeImageUrl || "wed_card_design/20260531-041903-27796.jpg")}
                  />
                ) : (
                  <EnvelopeDoors
                    key={`doors-${activeTab}-${design.designCode}`}
                    isOpened={previewOpened}
                    onOpen={() => setPreviewOpened(true)}
                    names={inv.shortCoupleName || `${inv.groomShortName || inv.groomName || "Nasser"} & ${inv.brideShortName || inv.brideName || "Alia"}`}
                    openButtonText={design.openButtonText || "BUKA"}
                    envelopeImageUrl={resolveImageUrl(design.envelopeImageUrl || "wed_card_design/20260531-041903-27796.jpg")}
                    cardMaxWidth={design.cardMaxWidth}
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

              {/* Bottom nav — actual component, positioned inside the preview frame */}
              {previewOpened && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-50"
                  style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
                >
                  <BottomNav
                    activeTab={previewActiveTab as TabKey | null}
                    isMuted={false}
                    onTabClick={(tab) => setPreviewActiveTab((prev) => prev === tab ? null : tab)}
                    onRsvpClick={() => toast.info("RSVP preview only")}
                    isVisible={true}
                    cardMaxWidth={design.cardMaxWidth}
                  />
                </div>
              )}

              {/* Footer dialog / detail panel preview */}
              {previewOpened && previewActiveTab && (
                <DetailPanel
                  activeTab={previewActiveTab as TabKey}
                  onClose={() => setPreviewActiveTab(null)}
                  invitation={inv}
                  isMuted={false}
                  onToggleMute={() => {}}
                  musicTitle={design.musicTitle}
                  musicArtist={design.musicArtist}
                  previewMode
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
