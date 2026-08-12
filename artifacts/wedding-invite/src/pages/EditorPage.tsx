import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EnvelopeDoors } from "@/components/EnvelopeDoors";
import { EnvelopeAnimation } from "@/components/EnvelopeAnimation";
import { WeddingCard } from "@/components/WeddingCard";
import { HexColorInput } from "@/components/HexColorInput";
import { BottomNav } from "@/components/BottomNav";
import { DetailPanel, type TabKey } from "@/components/DetailPanel";
import { RichTextEditor } from "@/components/RichTextEditor";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Calendar,
  Heart,
  MapPin,
  Phone,
  MessageSquare,

  X,
  User,
  LogOut,
  Loader2,
  Plus,
  Trash2,
  Gift,
  Lock,
} from "lucide-react";
import {
  useListDesigns,
  useGetActiveDesign,
} from "@workspace/api-client-react";
import type {
  BusinessInvitationSummary,
  PricingPackage,
} from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const PACKAGE_SUPPORT_WHATSAPP = "https://wa.me/601128134211";
import { fallbackToR2Proxy, resolveImageUrl } from "@/lib/r2-url";
import { publicInvitePath, publicInvitePathOrToken } from "@/lib/invite-url";
import { createTranslator } from "@/lib/translations";
import { extractYouTubeId } from "@/lib/youtube";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import { hexToHsl as hexToHslColor } from "@/lib/color-format";
import logo from "@assets/logo-wedinstudio.png";

const TABS = [
  { id: "reka-bentuk", label: "DESIGN" },
  { id: "muka-depan", label: "COVER" },
  { id: "ayat-undangan", label: "INVITATION TEXT" },
  { id: "tarikh-lokasi", label: "DATE & LOCATION" },
  { id: "aturcara", label: "PROGRAMME" },
  { id: "dresscode", label: "DRESS CODE" },
  { id: "doa", label: "DOA" },
  { id: "galeri", label: "GALLERY" },
  { id: "gift", label: "GIFT" },
  { id: "registry", label: "GIFT REGISTRY" },
  { id: "kehadiran", label: "RSVP" },
  { id: "hubungi", label: "CONTACT" },
  { id: "footer", label: "FOOTER" },
];

// Tabs that need a specific pricing feature to be visible.
// Everything else is always visible.
const TAB_FEATURE_MAP: Record<string, string[]> = {
  "tarikh-lokasi": ["Location & Navigation", "Calendar"],
  kehadiran: ["RSVP / Wishes"],
  hubungi: ["Contact"],
  dresscode: ["Dress Code"],
  galeri: ["Photo Gallery", "Money Gift"],
  gift: ["Money Gift"],
  registry: ["Gift Registry"],
};

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
  if (!fontName) return "Rouge Script";
  return FONT_ALIASES[fontName] || fontName;
}

function fontFamilyStack(fontName?: string | null): string {
  const normalized = normalizeFont(fontName);
  // Preserve explicit fallbacks for web-safe fonts; otherwise add a sensible fallback chain
  if (normalized.includes(",")) return normalized;
  return `'${normalized}', 'Rouge Script', cursive`;
}
// Font options split into two groups so customers can pick a script font for
// names and a classic font for body text independently.
const SCRIPT_FONTS = [
  { value: "Dancing Script", label: "Dancing Script" },
  // Used by the original FL001 catalogue template.
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Great Vibes", label: "Magnolia (Great Vibes)" },
  { value: "Alex Brush", label: "Esthetique (Alex Brush)" },
  { value: "Allura", label: "Allura" },
  { value: "Pinyon Script", label: "Pinyon Script" },
  { value: "Style Script", label: "Style Script" },
  { value: "Petit Formal Script", label: "Petit Formal Script" },
  { value: "Meow Script", label: "Meow Script" },
  { value: "Rouge Script", label: "Rouge Script" },
  { value: "Lily Script One", label: "Lily Script One" },
  { value: "Playwrite South Africa", label: "Playwrite South Africa" },
  { value: "Playwrite España", label: "Playwrite España" },
  { value: "Sacramento", label: "Sacramento" },
  { value: "Parisienne", label: "Parisienne" },
  { value: "Tangerine", label: "Tangerine" },
  { value: "Satisfy", label: "Satisfy" },
  { value: "Italianno", label: "Italianno" },
  { value: "Carattere", label: "Carattere" },
  { value: "Comforter Brush", label: "Comforter Brush" },
  { value: "Birthstone", label: "Birthstone" },
  { value: "Cinzel Decorative", label: "Cinzel Decorative" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Ephesis", label: "Ephesis" },
  { value: "Herr Von Muellerhoff", label: "Herr Von Muellerhoff" },
  { value: "Monsieur La Doulaise", label: "Monsieur La Doulaise" },
  { value: "Waterfall", label: "Waterfall" },
  { value: "Lavishly Yours", label: "Lavishly Yours" },
  { value: "Yellowtail", label: "Yellowtail" },
  { value: "Mr Dafoe", label: "Mr Dafoe" },
  { value: "Romanesco", label: "Romanesco" },
  { value: "Miss Fajardose", label: "Miss Fajardose" },
  { value: "Qwitcher Grypen", label: "Qwitcher Grypen" },
  // Added
  { value: "Playball", label: "Playball" },
  { value: "Corinthia", label: "Corinthia" },
  { value: "Mea Culpa", label: "Mea Culpa" },
  { value: "Playwrite NG Modern", label: "Playwrite Nigeria Modern" },
];

const CLASSIC_FONTS = [
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Poppins", label: "Poppins" },
  { value: "Lato", label: "Lato" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Noto Serif", label: "Noto Serif" },
  { value: "PT Serif", label: "PT Serif" },
  { value: "Inria Serif", label: "Inria Serif" },
  { value: "Google Sans Flex", label: "Google Sans Flex" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Raleway", label: "Raleway" },
  { value: "Nunito", label: "Nunito" },
  { value: "EB Garamond", label: "EB Garamond" },
  { value: "Josefin Sans", label: "Josefin Sans" },
  { value: "Cinzel", label: "Cinzel" },
  { value: "Libre Baskerville", label: "Libre Baskerville" },
  { value: "Source Serif 4", label: "Source Serif 4" },
  { value: "DM Serif Display", label: "DM Serif Display" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Jost", label: "Jost" },
  { value: "Outfit", label: "Outfit" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "Urbanist", label: "Urbanist" },
  { value: "Spectral", label: "Spectral" },
  { value: "Crimson Pro", label: "Crimson Pro" },
  { value: "Cantata One", label: "Cantata One" },
  { value: "Quattrocento", label: "Quattrocento" },
  { value: "Cormorant", label: "Cormorant" },
  { value: "Sorts Mill Goudy", label: "Sorts Mill Goudy" },
  // Added
  { value: "Libertinus Serif", label: "Libertinus Serif" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Enriqueta", label: "Enriqueta" },
  { value: "Merriweather", label: "Merriweather" },
];

type Contact = { name: string; phone: string };

function normalizeContacts(raw: unknown, fallbackPhone: string): Contact[] {
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (c): c is { name?: unknown; phone?: unknown } =>
          c && typeof c === "object",
      )
      .map((c) => ({
        name: String(c.name ?? ""),
        phone: String(c.phone ?? ""),
      }))
      .filter((c) => c.name || c.phone);
  }
  if (fallbackPhone) return [{ name: "Contact", phone: fallbackPhone }];
  return [];
}

interface InvData {
  id: number;
  token: string;
  isPurchased: boolean;
  isCustomerOrder: boolean;
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
  venueWazeUrl: string;
  groomParents: string;
  brideParents: string;
  contactPhone: string;
  contacts: Contact[];
  dresscode: string;
  dresscodeTheme: string;
  dresscodeColors: string[];
  message: string;
  shortCoupleName: string;
  groomShortName: string;
  brideShortName: string;
  coupleCount: number;
  groomInitial: string;
  brideInitial: string;
  coverGroomName: string;
  coverBrideName: string;
  envelopeInitials: string;
  envelopeInitialsSize: string;
  initialsImageUrl: string;
  initialsImageScale: number;
  page2Initials: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  eventStartTime: string;
  eventEndTime: string;
  coverDateText: string;
  additionalInfo: string;
  coverTitle: string;
  hashtag: string;
  language: "ms" | "en";
  showFrontText: boolean;
  greetingText: string;
  doaText: string;
  invitationText: string;
  hostName: string;
  hostCount: number;
  venueHijriDate: string;
  schedule: string;
  itinerary: { time: string; event: string }[];
  galleryImages: string[];
  giftDisplay: boolean;
  giftTitle: string;
  giftRecipient: string;
  giftBankName: string;
  giftAccountNumber: string;
  giftQrCodes: string[];
  registryRecipientName: string;
  registryRecipientAddress: string;
  designCode: string;
  // RSVP settings
  rsvpEnabled: boolean;
  rsvpAdditionalInfo: string;
  rsvpDeadline: string;
  rsvpIntroText: string;
  rsvpFormNote: string;
  rsvpMaxOverallGuests: number;
  rsvpMaxGuestsPerInvitation: number;
  rsvpTimeSlots: string;
  rsvpEmail: string;
  rsvpEmailNotification: boolean;
  overlayEnabled: boolean;
  showFooter: boolean;
  footerText: string;
  footerUrl: string;
  socialLinks: { platform: string; url: string }[];
  business: BusinessInvitationSummary | null;
}

interface DesignData {
  designCode: string;
  openingAnimation: string;
  openButtonText: string;
  nameFontFamily: string;
  nameFontSize: string;
  badgeFontSize: string;
  greetingFontSize: string;
  nameColor: string;
  greetingColor: string;
  colorForeground: string;
  colorHeading: string;
  colorMuted: string;
  bodyFontFamily: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorCard: string;
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  cardImageUrl: string;
  envelopeImageUrl: string;
  cardMaxWidth: string;
  waxSealId: string;
}

function getDayName(dateStr: string, lang: "ms" | "en"): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return "";
  const ms = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  const en = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return lang === "ms" ? ms[d.getDay()] : en[d.getDay()];
}

function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? "petang" : "pagi";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const eventDateMonths: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  januari: 1,
  februari: 2,
  mac: 3,
  mei: 5,
  jun: 6,
  julai: 7,
  ogos: 8,
  oktober: 10,
  disember: 12,
};

function isEventDatePassed(eventDate: string | null | undefined): boolean {
  const normalized = String(eventDate ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;

  let year = 0;
  let month = 0;
  let day = 0;
  let match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    match = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
      day = Number(match[1]);
      month = Number(match[2]);
      year = Number(match[3]);
    } else {
      match = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
      if (!match) return false;
      day = Number(match[1]);
      month = eventDateMonths[match[2]] ?? 0;
      year = Number(match[3]);
    }
  }

  const event = new Date(year, month - 1, day);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    event.getFullYear() !== year ||
    event.getMonth() !== month - 1 ||
    event.getDate() !== day
  )
    return false;
  const today = new Date();
  event.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return today.getTime() > event.getTime();
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
const selectCls =
  "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white";
const textareaCls =
  "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white resize-none";

export default function EditorPage({
  mode = "buyer",
}: {
  mode?: "buyer" | "business" | "demo" | "admin";
}) {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin" && mode === "demo") {
      navigate(dashboardPathForUser(user));
    }
  }, [user, authLoading, navigate, mode]);
  const [demoLang, setDemoLang] = useState<"ms" | "en">("ms");
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab") || "reka-bentuk";
    // Footer branding is admin-controlled, so customer editors (Buyer and
    // Business Account) should open the same tab set and landing tab.
    return (mode === "buyer" || mode === "business") &&
      requestedTab === "footer"
      ? "reka-bentuk"
      : requestedTab;
  });
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [previewOpened, setPreviewOpened] = useState(true);
  const [previewWasOpened, setPreviewWasOpened] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingInitials, setUploadingInitials] = useState(false);
  const [previewActiveTab, setPreviewActiveTab] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { data: availableDesigns = [] } = useListDesigns();
  const { data: activeDesign } = useGetActiveDesign();
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<number | null>(null);
  // Tracks the locked paid/assigned package so saves always use it even when
  // the editor is previewing a different package via ?package= URL param.
  const paidPackageIdRef = useRef<number | null>(null);

  const activePackage = packages.find((p) => p.id === activePackageId);
  const activeFeatureNames = useMemo(
    () => new Set((activePackage?.features ?? []).map((f) => f.name)),
    [activePackage],
  );
  const visibleTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.id === "footer") return mode === "admin" || mode === "demo";
      // Demo editor shows every tab so the admin can populate all premium
      // feature content that will be displayed in the public catalog preview.
      if (mode === "demo") return true;
      // No package selected yet (loading or unset) — show all tabs so the
      // buyer can explore everything while the package resolves.
      if ((mode === "buyer" || mode === "business") && activePackageId === null) return true;
      const required = TAB_FEATURE_MAP[tab.id];
      if (!required) return true; // base tab always visible
      return required.some((name) => activeFeatureNames.has(name));
    });
  }, [activeFeatureNames, activePackageId, mode]);

  const [inv, setInv] = useState<InvData>({
    id: 0,
    token: "",
    isPurchased: false,
    isCustomerOrder: false,
    groomName: "",
    brideName: "",
    eventType: "Walimatul Urus",
    eventDate: "",
    eventDay: "",
    eventTime: "11:00 pagi – 4:00 petang",
    eventStartTime: "11:00",
    eventEndTime: "16:00",
    venueName: "",
    venueAddress: "",
    venueCity: "",
    venueState: "",
    venueMapUrl: "",
    venueWazeUrl: "",
    groomParents: "",
    brideParents: "",
    contactPhone: "",
    contacts: [],
    dresscode: "",
    dresscodeTheme: "",
    dresscodeColors: [],
    message: "",
    shortCoupleName: "",
    groomShortName: "",
    brideShortName: "",
    coupleCount: 1,
    groomInitial: "",
    brideInitial: "",
    coverGroomName: "",
    coverBrideName: "",
    envelopeInitials: "",
    envelopeInitialsSize: "",
    initialsImageUrl: "",
    initialsImageScale: 100,
    page2Initials: "",
    eventStartDateTime: "",
    eventEndDateTime: "",
    coverDateText: "",
    additionalInfo: "",
    coverTitle: "",
    hashtag: "",
    language: "ms",
    showFrontText: true,
    greetingText: "Assalamualaikum wbt & salam sejahtera",
    doaText:
      "Ya Allah,\nberkatilah majlis perkahwinan kami.\nSatukanlah hati kami sebagaimana Engkau satukan hati Adam & Hawa.",
    invitationText:
      "Dengan penuh kesyukuran, kami menjemput\nDato' | Datin | Tuan | Puan | Encik | Cik\nke majlis perkahwinan anakanda kami",
    hostName: "",
    hostCount: 1,
    venueHijriDate: "",
    schedule: "",
    galleryImages: [],
    itinerary: [
      { time: "10:00 PG", event: "Ketibaan Tetamu" },
      { time: "11:00 PG", event: "Majlis Akad Nikah" },
      { time: "12:30 TGH", event: "Majlis Makan" },
      { time: "02:00 PTG", event: "Majlis Bersurai" },
    ],
    giftDisplay: true,
    giftTitle: "eGift",
    giftRecipient: "Nama Penerima",
    giftBankName: "Maybank",
    giftAccountNumber: "1234567890",
    giftQrCodes: [],
    registryRecipientName: "",
    registryRecipientAddress: "",
    designCode: "FL001",
    rsvpEnabled: true,
    rsvpAdditionalInfo: "",
    rsvpDeadline: "",
    rsvpIntroText: "",
    rsvpFormNote: "",
    rsvpMaxOverallGuests: 1000,
    rsvpMaxGuestsPerInvitation: 10,
    rsvpTimeSlots: "",
    rsvpEmail: "",
    rsvpEmailNotification: true,
    overlayEnabled: false,
    showFooter: true,
    footerText: "Dapatkan kad digital anda di:",
    footerUrl: "wedinstudio.com",
    socialLinks: [
      { platform: "website", url: "https://wedinstudio.com" },
      { platform: "tiktok", url: "https://tiktok.com/@wedinstudio" },
      { platform: "instagram", url: "https://instagram.com/wedinstudio" },
      { platform: "threads", url: "https://threads.net/@wedinstudio" },
    ],
    business: null,
  });

  const [design, setDesign] = useState<DesignData>({
    designCode: "FL001",
    openingAnimation: "doors",
    openButtonText: "BUKA",
    nameFontFamily: "Dancing Script",
    nameFontSize: "38",
    badgeFontSize: "24",
    greetingFontSize: "16",
    nameColor: "0 0% 20%",
    greetingColor: "",
    colorForeground: "0 0% 10%",
    colorHeading: "",
    colorMuted: "",
    bodyFontFamily: "Montserrat",
    colorPrimary: "142 45% 35%",
    colorSecondary: "142 30% 92%",
    colorAccent: "142 30% 92%",
    colorBackground: "142 20% 96%",
    colorCard: "0 0% 100%",
    musicUrl: "",
    musicTitle: "",
    musicArtist: "",
    cardImageUrl: "wed_card_design/20260531-041903-27796.jpg",
    envelopeImageUrl: "wed_card_design/20260531-041903-27796.jpg",
    cardMaxWidth: "420px",
    waxSealId: "",
  });
  // Wax seals — loaded once for the envelope-style picker.
  const [waxSeals, setWaxSeals] = useState<
    { id: number; name: string; imageUrl: string; isActive: boolean }[]
  >([]);
  useEffect(() => {
    fetch("/api/wax-seals")
      .then((r) => (r.ok ? r.json() : []))
      .then((seals) => {
        if (Array.isArray(seals)) setWaxSeals(seals);
      })
      .catch(() => {});
  }, []);
  const t = createTranslator(inv.language);

  // Gift Registry state — managed via direct API calls, not part of the invitation save payload.
  type RegistryItem = {
    id: number;
    name: string;
    url: string | null;
    thumbnailUrl: string | null;
    notes?: string | null;
    sortOrder: number;
  };
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [newRegName, setNewRegName] = useState("");
  const [newRegUrl, setNewRegUrl] = useState("");
  const [editingRegId, setEditingRegId] = useState<number | null>(null);
  const [editRegName, setEditRegName] = useState("");
  const [editRegUrl, setEditRegUrl] = useState("");
  const [newRegNotes, setNewRegNotes] = useState("");
  const [editRegNotes, setEditRegNotes] = useState("");
  const [uploadingRegThumb, setUploadingRegThumb] = useState<number | null>(
    null,
  );
  useEffect(() => {
    if (
      !inv.token ||
      (mode !== "demo" && !activeFeatureNames.has("Gift Registry"))
    ) {
      setRegistryItems([]);
      return;
    }
    setRegistryLoading(true);
    fetch(`${BASE}/api/registry/${inv.token}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((items: RegistryItem[]) =>
        setRegistryItems(Array.isArray(items) ? items : []),
      )
      .catch(() => {})
      .finally(() => setRegistryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.token, mode]);

  // Inherited colours from the selected catalog design (or the global demo design as fallback).
  // Buyer overrides are only saved when they differ from these inherited values.
  const [inheritedColors, setInheritedColors] = useState<
    Pick<
      DesignData,
      | "nameColor"
      | "colorForeground"
      | "colorHeading"
      | "colorMuted"
      | "colorPrimary"
      | "colorSecondary"
      | "colorAccent"
      | "colorBackground"
      | "colorCard"
    >
  >({
    nameColor: "0 0% 20%",
    colorForeground: "0 0% 10%",
    colorHeading: "",
    colorMuted: "",
    colorPrimary: "142 45% 35%",
    colorSecondary: "142 30% 92%",
    colorAccent: "142 30% 92%",
    colorBackground: "142 20% 96%",
    colorCard: "0 0% 100%",
  });

  // Redirect if not logged in (buyer mode → /login; demo mode → /admin/login)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const loginPath = mode === "demo" ? "/admin/login" : "/login";
      navigate(
        `${loginPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }
    if (mode === "demo" && user.role !== "admin") {
      navigate(dashboardPathForUser(user));
      toast.error("Admin access only.");
    }
    if ((mode === "buyer" || mode === "business") && user.role !== "admin") {
      if (mode === "business" && user.role !== "business_account") {
        navigate(dashboardPathForUser(user));
        toast.error("Business Account access only.");
        return;
      }
      // Buyer and Business Account modes are available to authenticated customers.
      return;
    }
  }, [user, authLoading, navigate, mode]);

  // Load invitation + global design (for images/music only)
  const loadData = useCallback(
    async (silent = false) => {
      if ((mode === "buyer" || mode === "business") && !user) return;
      if (!silent) setDataLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const isCustomerEditor = mode === "buyer" || mode === "business";
        const isNewCard = isCustomerEditor && params.get("new") === "1";
        const requestedToken = isCustomerEditor ? params.get("token") : null;
        const [invRes, designRes, allDesRes, pricingRes, adminFooterRes] =
          await Promise.all([
            isNewCard
              ? Promise.resolve(new Response(null, { status: 404 }))
              : mode === "demo"
                ? fetch(`${BASE}/api/invitation/${demoLang === "en" ? "demo-en" : "demo"}`, {
                    credentials: "include",
                    cache: "no-store",
                  })
                : requestedToken
                  ? fetch(
                      `${BASE}/api/invitation/${encodeURIComponent(requestedToken)}`,
                      { credentials: "include", cache: "no-store" },
                    )
                  : mode === "business"
                    ? fetch(`${BASE}/api/business/invitations`, {
                        credentials: "include",
                        cache: "no-store",
                      })
                    : fetch(`${BASE}/api/invitation-by-user/${user!.id}`, {
                        credentials: "include",
                        cache: "no-store",
                      }),
            fetch(`${BASE}/api/design/active`, {
              credentials: "include",
              cache: "no-store",
            }),
            fetch(`${BASE}/api/design`, {
              credentials: "include",
              cache: "no-store",
            }),
            mode === "buyer" || mode === "business"
              ? fetch(`${BASE}/api/pricing`, {
                  credentials: "include",
                  cache: "no-store",
                })
              : Promise.resolve(new Response("[]")),
            mode === "buyer" || mode === "business"
              ? fetch(`${BASE}/api/invitation/demo`, {
                  credentials: "include",
                  cache: "no-store",
                })
              : Promise.resolve(new Response("{}")),
          ]);
        let loadedPackages: PricingPackage[] = pricingRes.ok
          ? await pricingRes.json()
          : [];
        setPackages(loadedPackages);
        const adminDefaults = adminFooterRes.ok
          ? ((await adminFooterRes.json()) as Record<string, unknown>)
          : null;
        // Global (active) design — fallback for colours and images
        let gd: Record<string, string> = {};
        if (designRes.ok) gd = await designRes.json();
        // All available design templates — used to resolve images by designCode
        const allDesigns: Record<string, string>[] = allDesRes.ok
          ? await allDesRes.json()
          : [];

        // If the user arrived via "Personalise" from the card gallery, honour the ?designCode= param.
        const urlDesignCode =
          new URLSearchParams(window.location.search).get("designCode") ?? null;

        // Resolve ALL design properties from the matched template by designCode.
        // gd (active global) is used only as a last-resort fallback when the
        // template itself has no value set.
        const resolveTemplate = (code: string) => {
          const tpl = allDesigns.find((des) => des.designCode === code) ?? gd;
          const primary = tpl.colorPrimary ?? gd.colorPrimary ?? "142 45% 35%";
          return {
            colorPrimary: primary,
            colorSecondary: tpl.colorSecondary ?? primary,
            colorAccent: tpl.colorAccent ?? tpl.colorSecondary ?? primary,
            colorBackground: tpl.colorBackground ?? primary,
            colorCard: tpl.colorCard ?? "0 0% 100%",
            openingAnimation: tpl.openingAnimation ?? "doors",
            nameFontFamily:
              tpl.nameFontFamily ?? tpl.fontHeading ?? "Rouge Script",
            nameFontSize: tpl.nameFontSize ?? "38",
            badgeFontSize: tpl.badgeFontSize ?? "24",
            greetingFontSize: (tpl as any).greetingFontSize ?? "16",
            nameColor: tpl.nameColor ?? "0 0% 20%",
            greetingColor: (tpl as any).greetingColor ?? "",
            colorForeground: tpl.colorForeground ?? "0 0% 10%",
            colorHeading: tpl.colorHeading ?? "",
            colorMuted: tpl.colorMuted ?? "",
            bodyFontFamily: tpl.fontBody ?? "Poppins",
            cardMaxWidth: tpl.cardMaxWidth ?? gd.cardMaxWidth ?? "420px",
            cardImageUrl:
              tpl.cardImageUrl ??
              gd.cardImageUrl ??
              "wed_card_design/20260531-041903-27796.jpg",
            envelopeImageUrl:
              tpl.envelopeImageUrl ??
              gd.envelopeImageUrl ??
              "wed_card_design/20260531-041903-27796.jpg",
            musicUrl: tpl.musicUrl ?? gd.musicUrl ?? "",
            musicTitle: tpl.musicTitle ?? gd.musicTitle ?? "",
            musicArtist: tpl.musicArtist ?? gd.musicArtist ?? "",
            waxSealId: tpl.waxSealId ?? null,
          };
        };

        let loadedInv: any = null;
        if (invRes.ok) {
          const responseData = await invRes.json();
          loadedInv =
            mode === "business" && Array.isArray(responseData)
              ? requestedToken
                ? responseData.find(
                    (item: { token?: string }) => item.token === requestedToken,
                  )
                : responseData[0]
              : responseData;
          if (
            !loadedInv &&
            mode === "business" &&
            !requestedToken &&
            !isNewCard
          ) {
            setDataLoading(false);
            return;
          }
          const d = loadedInv;
          let isCustomerOrder = false;
          if (mode === "business" && d?.id) {
            const clientsRes = await fetch(`${BASE}/api/business/clients`, {
              credentials: "include",
              cache: "no-store",
            });
            if (clientsRes.ok) {
              const clients = (await clientsRes.json()) as Array<{
                invitationId?: number | null;
                invitationToken?: string | null;
              }>;
              isCustomerOrder = clients.some(
                (client) =>
                  client.invitationId === d.id ||
                  client.invitationToken === d.token,
              );
            }
          }
          // Keep a previously purchased package available even if an admin has
          // since deactivated it from the public pricing list.
          if (
            (mode === "buyer" || mode === "business") &&
            (d?.isPurchased === true || isCustomerOrder) &&
            Number.isInteger(d.packageId) &&
            !loadedPackages.some((pkg) => pkg.id === d.packageId)
          ) {
            const purchasedPackageRes = await fetch(
              `${BASE}/api/pricing?includePackageId=${encodeURIComponent(String(d.packageId))}`,
              { credentials: "include", cache: "no-store" },
            );
            if (purchasedPackageRes.ok) {
              loadedPackages =
                (await purchasedPackageRes.json()) as PricingPackage[];
            }
          }
          // Keep an assigned paid/customer-order package visible in the locked
          // selector even when it is no longer active in the public price list.
          setPackages(loadedPackages);
          setInv({
            id: d.id ?? 0,
            token: d.token ?? "",
            isPurchased: d.isPurchased === true,
            isCustomerOrder,
            groomName: d.groomName ?? "",
            brideName: d.brideName ?? "",
            eventType: d.eventType ?? "Walimatul Urus",
            eventDate: d.eventDate ?? "",
            eventDay: d.eventDay ?? "",
            eventTime: d.eventTime ?? "11:00 am – 4:00 pm",
            venueName: d.venueName ?? "",
            venueAddress: d.venueAddress ?? "",
            venueCity: d.venueCity ?? "",
            venueState: d.venueState ?? "",
            venueMapUrl: d.venueMapUrl ?? "",
            venueWazeUrl: (d as any).venueWazeUrl ?? "",
            groomParents: d.groomParents ?? "",
            brideParents: d.brideParents ?? "",
            contactPhone: d.contactPhone ?? "",
            contacts: normalizeContacts(d.contacts, d.contactPhone ?? ""),
            dresscode: d.dresscode ?? "",
            dresscodeTheme: d.dresscodeTheme ?? d.dresscode ?? "",
            dresscodeColors: Array.isArray(d.dresscodeColors)
              ? d.dresscodeColors
                  .filter(
                    (color: unknown): color is string =>
                      typeof color === "string",
                  )
                  .slice(0, 4)
              : [],
            message: d.message ?? "",
            shortCoupleName: d.shortCoupleName ?? "",
            groomShortName:
              d.groomShortName ??
              (d.shortCoupleName as string | undefined)
                ?.split(" & ")[1]
                ?.trim() ??
              "",
            brideShortName:
              d.brideShortName ??
              (d.shortCoupleName as string | undefined)
                ?.split(" & ")[0]
                ?.trim() ??
              "",
            coupleCount: d.coupleCount ?? 1,
            groomInitial: d.groomInitial ?? "",
            brideInitial: d.brideInitial ?? "",
            coverGroomName: d.coverGroomName ?? "",
            coverBrideName: d.coverBrideName ?? "",
            envelopeInitials: d.envelopeInitials ?? "",
            envelopeInitialsSize: d.envelopeInitialsSize
              ? String(d.envelopeInitialsSize)
              : "24",
            initialsImageUrl: d.initialsImageUrl ?? "",
            initialsImageScale: Number(d.initialsImageScale) || 100,
            page2Initials: d.page2Initials ?? "",
            eventStartDateTime: d.eventStartDateTime ?? "",
            eventEndDateTime: d.eventEndDateTime ?? "",
            eventStartTime: d.eventStartTime ?? "11:00",
            eventEndTime: d.eventEndTime ?? "16:00",
            coverDateText: d.coverDateText ?? "",
            additionalInfo: d.additionalInfo ?? "",
            coverTitle: d.coverTitle ?? "",
            hashtag: d.hashtag ?? "",
            language: (d.language as "ms" | "en") ?? "ms",
            showFrontText: d.showFrontText ?? true,
            greetingText:
              d.greetingText ?? "Assalamualaikum wbt & salam sejahtera",
            doaText:
              d.doaText ??
              "Ya Allah,\nberkatilah majlis perkahwinan kami.\nSatukanlah hati kami sebagaimana Engkau satukan hati Adam & Hawa.",
            invitationText:
              d.invitationText ??
              "Dengan penuh kesyukuran, kami menjemput\nDato' | Datin | Tuan | Puan | Encik | Cik\nke majlis perkahwinan anakanda kami",
            hostName: d.hostName ?? "",
            hostCount: d.hostCount ?? 1,
            venueHijriDate: d.venueHijriDate ?? "",
            schedule: d.schedule ?? "",
            itinerary: Array.isArray(d.itinerary) ? d.itinerary : [],
            galleryImages: Array.isArray(d.galleryImages)
              ? d.galleryImages.slice(0, 4)
              : [],
            giftDisplay: d.giftDisplay === true,
            giftTitle: d.giftTitle ?? "eGift",
            giftRecipient: d.giftRecipient ?? "",
            giftBankName: d.giftBankName ?? "",
            giftAccountNumber: d.giftAccountNumber ?? "",
            giftQrCodes: Array.isArray(d.giftQrCodes)
              ? d.giftQrCodes.slice(0, 2)
              : [],
            registryRecipientName: d.registryRecipientName ?? "",
            registryRecipientAddress: d.registryRecipientAddress ?? "",
            designCode: d.designCode ?? "FL001",
            rsvpEnabled: d.rsvpEnabled ?? false,
            rsvpAdditionalInfo: d.rsvpAdditionalInfo ?? "",
            rsvpDeadline: d.rsvpDeadline
              ? new Date(d.rsvpDeadline).toISOString().slice(0, 16)
              : "",
            rsvpIntroText: d.rsvpIntroText ?? "",
            rsvpFormNote: d.rsvpFormNote ?? "",
            rsvpMaxOverallGuests: d.rsvpMaxOverallGuests ?? 1000,
            rsvpMaxGuestsPerInvitation: d.rsvpMaxGuestsPerInvitation ?? 10,
            rsvpTimeSlots: d.rsvpTimeSlots ?? "",
            rsvpEmail: d.rsvpEmail ?? "",
            rsvpEmailNotification: d.rsvpEmailNotification ?? true,
            // Buyer editors always inherit the current Admin footer defaults.
            overlayEnabled: d.overlayEnabled ?? false,
            showFooter:
              mode === "buyer" || mode === "business"
                ? ((adminDefaults?.showFooter as boolean) ?? true)
                : (d.showFooter ?? false),
            footerText:
              mode === "buyer" || mode === "business"
                ? ((adminDefaults?.footerText as string) ??
                  "Dapatkan kad digital anda di:")
                : (d.footerText ?? ""),
            footerUrl:
              mode === "buyer" || mode === "business"
                ? ((adminDefaults?.footerUrl as string) ?? "wedinstudio.com")
                : (d.footerUrl ?? ""),
            socialLinks:
              mode === "buyer" || mode === "business"
                ? Array.isArray(adminDefaults?.socialLinks)
                  ? (adminDefaults.socialLinks as {
                      platform: string;
                      url: string;
                    }[])
                  : []
                : Array.isArray(d.socialLinks)
                  ? d.socialLinks
                  : [
                      { platform: "website", url: "" },
                      { platform: "tiktok", url: "" },
                      { platform: "instagram", url: "" },
                      { platform: "threads", url: "" },
                    ],
            business:
              d.business && typeof d.business === "object"
                ? (d.business as BusinessInvitationSummary)
                : null,
          });
          // URL param ?designCode= takes priority (user clicked "Personalise" on a specific card).
          // Both demo and real invitations use the active card design as the base template so that
          // admin styling changes flow through to all invitations automatically.
          // Buyer's saved overrides are still applied on top via invitationOwnsStyle below.
          const resolvedCode =
            urlDesignCode ?? d.designCode ?? gd.designCode ?? "FL001";
          const tpl = resolveTemplate(resolvedCode);
          setInheritedColors({
            nameColor: tpl.nameColor,
            colorForeground: tpl.colorForeground,
            colorHeading: tpl.colorHeading ?? "",
            colorMuted: tpl.colorMuted ?? "",
            colorPrimary: tpl.colorPrimary,
            colorSecondary: tpl.colorSecondary,
            colorAccent: tpl.colorAccent,
            colorBackground: tpl.colorBackground,
            colorCard: tpl.colorCard,
          });
          // The admin demo is the live catalogue preview. Its invitation record is
          // only sample content, so stale style values on that record must never
          // mask the currently saved Card Design template.
          const invitationOwnsStyle = mode !== "demo";
          setDesign({
            designCode: resolvedCode,
            openingAnimation: invitationOwnsStyle
              ? (d.openingAnimation ?? tpl.openingAnimation)
              : tpl.openingAnimation,
            waxSealId: invitationOwnsStyle
              ? d.waxSealId
                ? String(d.waxSealId)
                : tpl.waxSealId
                  ? String(tpl.waxSealId)
                  : ""
              : tpl.waxSealId
                ? String(tpl.waxSealId)
                : "",
            openButtonText: invitationOwnsStyle
              ? (d.openButtonText ?? "BUKA")
              : "BUKA",
            nameFontFamily: normalizeFont(
              invitationOwnsStyle
                ? (d.nameFontFamily ?? tpl.nameFontFamily)
                : tpl.nameFontFamily,
            ),
            nameFontSize: invitationOwnsStyle
              ? (d.nameFontSize ?? tpl.nameFontSize ?? "38")
              : (tpl.nameFontSize ?? "38"),
            badgeFontSize: invitationOwnsStyle
              ? (d.badgeFontSize ?? tpl.badgeFontSize ?? "24")
              : (tpl.badgeFontSize ?? "24"),
            greetingFontSize: invitationOwnsStyle
              ? (d.greetingFontSize ?? (tpl as any).greetingFontSize ?? "16")
              : ((tpl as any).greetingFontSize ?? "16"),
            greetingColor: invitationOwnsStyle
              ? (d.greetingColor ?? (tpl as any).greetingColor ?? "")
              : ((tpl as any).greetingColor ?? ""),
            nameColor: invitationOwnsStyle
              ? (d.nameColor ?? tpl.nameColor)
              : tpl.nameColor,
            colorForeground: invitationOwnsStyle
              ? (d.colorForeground ?? tpl.colorForeground)
              : tpl.colorForeground,
            cardMaxWidth: invitationOwnsStyle
              ? (d.cardMaxWidth ?? tpl.cardMaxWidth)
              : tpl.cardMaxWidth,
            bodyFontFamily: normalizeFont(
              invitationOwnsStyle
                ? (d.bodyFontFamily ?? tpl.bodyFontFamily)
                : tpl.bodyFontFamily,
            ),
            colorPrimary: invitationOwnsStyle
              ? (d.colorPrimary ?? tpl.colorPrimary)
              : tpl.colorPrimary,
            colorSecondary: invitationOwnsStyle
              ? (d.colorSecondary ?? tpl.colorSecondary)
              : tpl.colorSecondary,
            colorAccent: invitationOwnsStyle
              ? (d.colorAccent ?? tpl.colorAccent)
              : tpl.colorAccent,
            colorBackground: invitationOwnsStyle
              ? (d.colorBackground ?? tpl.colorBackground)
              : tpl.colorBackground,
            colorCard: invitationOwnsStyle
              ? (d.colorCard ?? tpl.colorCard)
              : tpl.colorCard,
            colorHeading: invitationOwnsStyle
              ? (d.colorHeading ?? tpl.colorHeading ?? "")
              : (tpl.colorHeading ?? ""),
            colorMuted: invitationOwnsStyle
              ? (d.colorMuted ?? tpl.colorMuted ?? "")
              : (tpl.colorMuted ?? ""),
            cardImageUrl: tpl.cardImageUrl,
            envelopeImageUrl: tpl.envelopeImageUrl,
            musicUrl: d.musicUrl || tpl.musicUrl,
            musicTitle: d.musicTitle || tpl.musicTitle,
            musicArtist: d.musicArtist || tpl.musicArtist,
          });
        } else {
          // No invitation yet — use URL param design (if any) or global admin design as preview defaults
          const resolvedCode = urlDesignCode ?? gd.designCode ?? "FL001";
          const tplFallback = resolveTemplate(resolvedCode);
          setInheritedColors({
            nameColor: tplFallback.nameColor,
            colorForeground: tplFallback.colorForeground,
            colorHeading: tplFallback.colorHeading ?? "",
            colorMuted: tplFallback.colorMuted ?? "",
            colorPrimary: tplFallback.colorPrimary,
            colorSecondary: tplFallback.colorSecondary,
            colorAccent: tplFallback.colorAccent,
            colorBackground: tplFallback.colorBackground,
            colorCard: tplFallback.colorCard,
          });
          setDesign((prev) => ({
            ...prev,
            designCode: resolvedCode,
            colorPrimary: tplFallback.colorPrimary,
            colorSecondary: tplFallback.colorSecondary,
            colorAccent: tplFallback.colorAccent,
            colorBackground: tplFallback.colorBackground,
            colorCard: tplFallback.colorCard,
            openingAnimation: tplFallback.openingAnimation,
            nameFontFamily: normalizeFont(tplFallback.nameFontFamily),
            nameFontSize: tplFallback.nameFontSize,
            badgeFontSize: tplFallback.badgeFontSize,
            greetingFontSize: (tplFallback as any).greetingFontSize ?? "16",
            greetingColor: (tplFallback as any).greetingColor ?? "",
            nameColor: tplFallback.nameColor,
            colorForeground: tplFallback.colorForeground,
            colorHeading: tplFallback.colorHeading ?? "",
            colorMuted: tplFallback.colorMuted ?? "",
            cardMaxWidth: tplFallback.cardMaxWidth,
            bodyFontFamily: normalizeFont(tplFallback.bodyFontFamily),
            cardImageUrl: tplFallback.cardImageUrl,
            envelopeImageUrl: tplFallback.envelopeImageUrl,
            musicUrl: tplFallback.musicUrl,
            musicTitle: tplFallback.musicTitle,
            musicArtist: tplFallback.musicArtist,
          }));

          // New customer cards use the admin demo invitation as their editable
          // content template. Customer-specific details remain blank. Buyer and
          // Business Account must start from the same editor defaults.
          if (
            (mode === "buyer" || mode === "business") &&
            isNewCard &&
            adminDefaults
          ) {
            setInv((prev) => ({
              ...prev,
              eventType:
                typeof adminDefaults.eventType === "string"
                  ? adminDefaults.eventType
                  : prev.eventType,
              eventTime:
                typeof adminDefaults.eventTime === "string"
                  ? adminDefaults.eventTime
                  : prev.eventTime,
              eventStartTime:
                typeof adminDefaults.eventStartTime === "string"
                  ? adminDefaults.eventStartTime
                  : prev.eventStartTime,
              eventEndTime:
                typeof adminDefaults.eventEndTime === "string"
                  ? adminDefaults.eventEndTime
                  : prev.eventEndTime,
              coverTitle:
                typeof adminDefaults.coverTitle === "string"
                  ? adminDefaults.coverTitle
                  : prev.coverTitle,
              additionalInfo:
                typeof adminDefaults.additionalInfo === "string"
                  ? adminDefaults.additionalInfo
                  : prev.additionalInfo,
              hashtag:
                typeof adminDefaults.hashtag === "string"
                  ? adminDefaults.hashtag
                  : prev.hashtag,
              language:
                adminDefaults.language === "en" ||
                adminDefaults.language === "ms"
                  ? adminDefaults.language
                  : prev.language,
              showFrontText:
                typeof adminDefaults.showFrontText === "boolean"
                  ? adminDefaults.showFrontText
                  : prev.showFrontText,
              greetingText:
                typeof adminDefaults.greetingText === "string"
                  ? adminDefaults.greetingText
                  : prev.greetingText,
              doaText:
                typeof adminDefaults.doaText === "string"
                  ? adminDefaults.doaText
                  : prev.doaText,
              invitationText:
                typeof adminDefaults.invitationText === "string"
                  ? adminDefaults.invitationText
                  : prev.invitationText,
              hostName:
                typeof adminDefaults.hostName === "string"
                  ? adminDefaults.hostName
                  : prev.hostName,
              hostCount:
                typeof adminDefaults.hostCount === "number"
                  ? adminDefaults.hostCount
                  : prev.hostCount,
              venueHijriDate:
                typeof adminDefaults.venueHijriDate === "string"
                  ? adminDefaults.venueHijriDate
                  : prev.venueHijriDate,
              schedule:
                typeof adminDefaults.schedule === "string"
                  ? adminDefaults.schedule
                  : prev.schedule,
              itinerary: Array.isArray(adminDefaults.itinerary)
                ? (adminDefaults.itinerary as { time: string; event: string }[])
                : prev.itinerary,
              dresscode:
                typeof adminDefaults.dresscode === "string"
                  ? adminDefaults.dresscode
                  : prev.dresscode,
              dresscodeTheme:
                typeof adminDefaults.dresscodeTheme === "string"
                  ? adminDefaults.dresscodeTheme
                  : prev.dresscodeTheme,
              dresscodeColors: Array.isArray(adminDefaults.dresscodeColors)
                ? adminDefaults.dresscodeColors
                    .filter(
                      (color): color is string => typeof color === "string",
                    )
                    .slice(0, 4)
                : prev.dresscodeColors,
              message:
                typeof adminDefaults.message === "string"
                  ? adminDefaults.message
                  : prev.message,
              rsvpEnabled:
                typeof adminDefaults.rsvpEnabled === "boolean"
                  ? adminDefaults.rsvpEnabled
                  : prev.rsvpEnabled,
              rsvpAdditionalInfo:
                typeof adminDefaults.rsvpAdditionalInfo === "string"
                  ? adminDefaults.rsvpAdditionalInfo
                  : prev.rsvpAdditionalInfo,
              rsvpIntroText:
                typeof adminDefaults.rsvpIntroText === "string"
                  ? adminDefaults.rsvpIntroText
                  : prev.rsvpIntroText,
              rsvpFormNote:
                typeof adminDefaults.rsvpFormNote === "string"
                  ? adminDefaults.rsvpFormNote
                  : prev.rsvpFormNote,
              rsvpMaxOverallGuests:
                typeof adminDefaults.rsvpMaxOverallGuests === "number"
                  ? adminDefaults.rsvpMaxOverallGuests
                  : prev.rsvpMaxOverallGuests,
              rsvpMaxGuestsPerInvitation:
                typeof adminDefaults.rsvpMaxGuestsPerInvitation === "number"
                  ? adminDefaults.rsvpMaxGuestsPerInvitation
                  : prev.rsvpMaxGuestsPerInvitation,
              rsvpTimeSlots:
                typeof adminDefaults.rsvpTimeSlots === "string"
                  ? adminDefaults.rsvpTimeSlots
                  : prev.rsvpTimeSlots,
              showFooter:
                typeof adminDefaults.showFooter === "boolean"
                  ? adminDefaults.showFooter
                  : prev.showFooter,
              footerText:
                typeof adminDefaults.footerText === "string"
                  ? adminDefaults.footerText
                  : prev.footerText,
              footerUrl:
                typeof adminDefaults.footerUrl === "string"
                  ? adminDefaults.footerUrl
                  : prev.footerUrl,
              socialLinks: Array.isArray(adminDefaults.socialLinks)
                ? (adminDefaults.socialLinks as {
                    platform: string;
                    url: string;
                  }[])
                : prev.socialLinks,
            }));
          }
        }

        // Resolve which package to display in the editor.
        // The ?package= URL param (set by the pricing page) always wins for
        // the tab display so buyers can preview any package's feature set.
        // For paid / customer-order invitations we remember the locked
        // package in a ref so that saves always use the correct package,
        // even when the editor is showing a different package for preview.
        if (
          (mode === "buyer" || mode === "business") &&
          loadedPackages.length > 0
        ) {
          const urlPackage = new URLSearchParams(window.location.search).get(
            "package",
          );
          const isPaidOrCustomer = !!(
            loadedInv?.isCustomerOrder || loadedInv?.isPurchased
          );

          // Persist the locked package so handleSave can always use it.
          if (isPaidOrCustomer && loadedInv?.packageId != null) {
            paidPackageIdRef.current = loadedInv.packageId;
          }

          // Display package: URL param > paid/saved package > first active.
          const pkgId = urlPackage
            ? parseInt(urlPackage, 10)
            : isPaidOrCustomer
              ? (loadedInv.packageId ?? null)
              : (loadedInv?.packageId ?? null);

          const resolvedPkg =
            loadedPackages.find((p) => p.id === pkgId && p.isActive) ||
            (isPaidOrCustomer && !urlPackage
              ? loadedPackages.find((p) => p.id === pkgId) // allow inactive paid pkg
              : null) ||
            (!urlPackage ? loadedPackages.find((p) => p.isActive) : null);
          setActivePackageId(resolvedPkg?.id ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setDataLoading(false);
      }
    },
    [user, demoLang, mode],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-generate day label and readable time range from date/time pickers.
  useEffect(() => {
    setInv((p) => {
      const next = { ...p };
      if (p.eventDate) {
        next.eventDay = getDayName(p.eventDate, p.language);
      }
      if (p.eventStartTime && p.eventEndTime) {
        next.eventTime = `${formatTime12h(p.eventStartTime)} – ${formatTime12h(p.eventEndTime)}`;
      }
      return next;
    });
  }, [inv.eventDate, inv.eventStartTime, inv.eventEndTime, inv.language]);

  // If the active tab is no longer visible after a package change, switch to the first visible tab.
  useEffect(() => {
    if (!visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "reka-bentuk");
    }
  }, [visibleTabs, activeTab]);

  const setI = (field: keyof InvData) => (v: string) =>
    setInv((p) => ({ ...p, [field]: v }));

  const packageLocked =
    mode !== "admin" && (inv.isCustomerOrder || inv.isPurchased);
  const customerEditLocked =
    mode !== "admin" &&
    mode !== "demo" &&
    inv.isPurchased &&
    isEventDatePassed(inv.eventDate);
  // Lock the 3 identity fields after payment so the invitation cannot be repurposed for a different event
  const identityLocked = mode !== "admin" && mode !== "demo" && inv.isPurchased;
  const coverNamesEmpty = !inv.coverGroomName?.trim() || !inv.coverBrideName?.trim();
  const publicPath = publicInvitePathOrToken(inv);
  const previewReady = Boolean(inv.token);

  async function handleSave() {
    if (customerEditLocked) {
      toast.info(
        "This paid invitation is locked because its event date has passed.",
      );
      return;
    }
    setSaving(true);
    try {
      const token = mode === "demo" ? (demoLang === "en" ? "demo-en" : "demo") : inv.token;
      let saveToken = token;

      // Buyers and Business Accounts can create their own invitation records.
      if ((mode === "buyer" || mode === "business") && !token) {
        const createRes = await fetch(`${BASE}/api/invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            groomName: inv.groomName || "Groom",
            brideName: inv.brideName || "Bride",
            eventType: inv.eventType || "Walimatul Urus",
            eventDate: inv.eventDate || "",
            eventDay: inv.eventDay || "",
            eventTime: inv.eventTime || "11:00 am – 4:00 pm",
            venueName: inv.venueName || "",
            venueAddress: inv.venueAddress || "",
            venueCity: inv.venueCity || "",
            venueState: inv.venueState || "",
            contactPhone: inv.contactPhone || "",
            contacts: inv.contacts.length > 0 ? inv.contacts : undefined,
            packageId: activePackageId ?? undefined,
          }),
        });
        if (!createRes.ok) {
          toast.error("Failed to create card. Please try again.");
          return;
        }
        const created = await createRes.json();
        const newToken = created.token as string;
        saveToken = newToken;
        setInv((p) => ({ ...p, token: newToken }));
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.delete("new");
        currentParams.set("token", newToken);
        const nextQuery = currentParams.toString();
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`,
        );
      }

      // All fields — invitation content AND buyer design overrides — go to the invitation record.
      // The global card_design table is never touched by the buyer, so the demo stays intact.
      // When the design code changes we must also persist the new template's colours, otherwise
      // stale colour overrides from the previous template keep overriding the new template.
      const designCodeChanged = inv.designCode !== design.designCode;
      const savePayload: Record<string, unknown> = {
        // Invitation content — explicit nulls clear previously saved optional values.
        groomName: inv.groomName,
        brideName: inv.brideName,
        eventType: inv.eventType,
        eventDate: inv.eventDate,
        eventDay: inv.eventDay,
        eventTime: inv.eventTime,
        eventStartTime: inv.eventStartTime || null,
        eventEndTime: inv.eventEndTime || null,
        venueName: inv.venueName,
        venueAddress: inv.venueAddress,
        venueCity: inv.venueCity,
        venueState: inv.venueState,
        venueMapUrl: inv.venueMapUrl || null,
        venueWazeUrl: (inv as any).venueWazeUrl || null,
        groomParents: inv.groomParents || null,
        brideParents: inv.brideParents || null,
        contactPhone: inv.contactPhone,
        contacts: inv.contacts,
        dresscode: inv.dresscode || null,
        dresscodeTheme: inv.dresscodeTheme || null,
        dresscodeColors: inv.dresscodeColors.slice(0, 4),
        message: inv.message || null,
        shortCoupleName: inv.shortCoupleName || null,
        groomShortName: inv.groomShortName || null,
        brideShortName: inv.brideShortName || null,
        coupleCount: inv.coupleCount,
        groomInitial: inv.groomInitial || null,
        brideInitial: inv.brideInitial || null,
        coverGroomName: inv.coverGroomName || null,
        coverBrideName: inv.coverBrideName || null,
        envelopeInitials: inv.envelopeInitials || null,
        envelopeInitialsSize: String(Number(inv.envelopeInitialsSize) || 24),
        initialsImageUrl: inv.initialsImageUrl || null,
        page2Initials: inv.page2Initials || null,
        initialsImageScale: Math.min(
          140,
          Math.max(50, Number(inv.initialsImageScale) || 100),
        ),
        eventStartDateTime: inv.eventStartDateTime || null,
        eventEndDateTime: inv.eventEndDateTime || null,
        coverDateText: inv.coverDateText || null,
        additionalInfo: inv.additionalInfo || null,
        coverTitle: inv.coverTitle || null,
        hashtag: inv.hashtag || null,
        language: inv.language,
        showFrontText: inv.showFrontText,
        greetingText: inv.greetingText || null,
        doaText: inv.doaText || null,
        invitationText: inv.invitationText || null,
        hostName: inv.hostName || null,
        hostCount: inv.hostCount,
        venueHijriDate: inv.venueHijriDate || null,
        schedule: inv.schedule || null,
        itinerary: inv.itinerary,
        galleryImages: inv.galleryImages,
        rsvpEnabled: inv.rsvpEnabled,
        rsvpAdditionalInfo: inv.rsvpAdditionalInfo || null,
        rsvpDeadline: inv.rsvpDeadline || null,
        rsvpIntroText: inv.rsvpIntroText || null,
        rsvpFormNote: inv.rsvpFormNote || null,
        rsvpMaxOverallGuests: inv.rsvpMaxOverallGuests,
        rsvpMaxGuestsPerInvitation: inv.rsvpMaxGuestsPerInvitation,
        rsvpTimeSlots: inv.rsvpTimeSlots || null,
        rsvpEmail: inv.rsvpEmail || null,
        rsvpEmailNotification: inv.rsvpEmailNotification,
        // Paid / customer-order invitations must save with their locked package,
        // even when the editor is showing a preview package via ?package= param.
        packageId: packageLocked
          ? (paidPackageIdRef.current ?? activePackageId ?? null)
          : (activePackageId ?? null),
        // Buyer design overrides are stored per invitation, never in the global template.
        designCode: design.designCode || null,
        openingAnimation: design.openingAnimation || null,
        waxSealId: design.waxSealId ? parseInt(design.waxSealId, 10) : null,
        openButtonText: design.openButtonText || null,
        nameFontFamily: design.nameFontFamily || null,
        nameFontSize: design.nameFontSize || null,
        badgeFontSize: design.badgeFontSize || null,
        greetingFontSize: design.greetingFontSize || null,
        greetingColor: design.greetingColor || null,
        bodyFontFamily: design.bodyFontFamily || null,
        // Always persist the exact resolved colour so the public invitation page
        // and the editor always show the same values, regardless of which card
        // design template is currently active in the production environment.
        nameColor: design.nameColor || null,
        colorForeground: design.colorForeground || null,
        colorPrimary: design.colorPrimary || null,
        colorSecondary: design.colorSecondary || null,
        colorAccent: design.colorAccent || null,
        colorBackground: design.colorBackground || null,
        colorCard: design.colorCard || null,
        colorHeading: design.colorHeading || null,
        colorMuted: design.colorMuted || null,
        musicUrl: design.musicUrl || null,
        musicTitle: design.musicTitle || null,
        musicArtist: design.musicArtist || null,
        overlayEnabled: inv.overlayEnabled,
      };

      // Standard invitations do not have the Money Gift feature. Do not send
      // those fields during an otherwise unrelated save, because the API
      // correctly rejects Money Gift fields for packages without the feature.
      if (
        mode === "admin" ||
        mode === "demo" ||
        activeFeatureNames.has("Money Gift")
      ) {
        Object.assign(savePayload, {
          giftDisplay: inv.giftDisplay,
          giftTitle: inv.giftTitle || null,
          giftRecipient: inv.giftRecipient || null,
          giftBankName: inv.giftBankName || null,
          giftAccountNumber: inv.giftAccountNumber || null,
          giftQrCodes: inv.giftQrCodes,
        });
      }
      if (
        mode === "admin" ||
        mode === "demo" ||
        activeFeatureNames.has("Gift Registry")
      ) {
        Object.assign(savePayload, {
          registryRecipientName: inv.registryRecipientName || null,
          registryRecipientAddress: inv.registryRecipientAddress || null,
        });
      }

      // Footer branding is admin-owned and must not be included in buyer saves.
      if (mode === "admin" || mode === "demo") {
        savePayload.showFooter = inv.showFooter;
        savePayload.footerText = inv.footerText || null;
        savePayload.footerUrl = inv.footerUrl || null;
        savePayload.socialLinks = inv.socialLinks;
      }

      const r = await fetch(`${BASE}/api/invitation/${saveToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(savePayload),
      });
      if (r.ok) {
        toast.success("Details saved successfully!");
        // Package is now persisted in DB — remove ?package= URL param so
        // loadData re-reads the saved value instead of the stale URL param.
        const savedParams = new URLSearchParams(window.location.search);
        if (savedParams.has("package")) {
          savedParams.delete("package");
          const nextQuery = savedParams.toString();
          window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`,
          );
        }
        await loadData(true);
      } else {
        const errorData = await r.json().catch(() => ({}));
        toast.error(
          typeof errorData.error === "string"
            ? errorData.error
            : "Save failed. Please try again.",
        );
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate(
      mode === "demo"
        ? "/admin"
        : mode === "business"
          ? "/business/dashboard"
          : "/dashboard",
    );
  }

  async function handleLogout() {
    await logout();
    navigate(mode === "demo" ? "/login" : "/");
  }

  async function uploadGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, 4 - inv.galleryImages.length);
    if (remainingSlots === 0) {
      toast.info("Gallery maksimum 4 gambar.");
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.info(
        `Gallery hanya boleh 4 gambar. ${remainingSlots} gambar pertama sahaja akan dimuat naik.`,
      );
    }
    setUploadingGallery(true);
    try {
      const uploadedKeys: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
          `${BASE}/api/gallery-upload?invitationToken=${encodeURIComponent(inv.token || mode || "demo")}`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }
        const data = await res.json();
        if (data.key) uploadedKeys.push(data.key);
      }
      if (uploadedKeys.length > 0) {
        setInv((p) => ({
          ...p,
          galleryImages: [...p.galleryImages, ...uploadedKeys].slice(0, 4),
        }));
        toast.success(`${uploadedKeys.length} image(s) uploaded`);
      }
    } catch {
      toast.error("Network error during upload.");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function uploadInitialsFile(file: File | null) {
    if (!file) return;
    if (file.type !== "image/png") {
      toast.error("Initial artwork mesti PNG dengan transparent background.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Initial artwork maksimum 2 MB.");
      return;
    }
    if (!inv.token) {
      toast.error("Simpan kad dahulu sebelum upload artwork initials.");
      return;
    }
    setUploadingInitials(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationToken", inv.token);
      const res = await fetch(`${BASE}/api/order-initials-upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Initial artwork upload gagal.");
        return;
      }
      setInv((p) => ({ ...p, initialsImageUrl: data.key || "" }));
      toast.success("Initial artwork berjaya disimpan.");
    } catch {
      toast.error("Network error semasa upload artwork initials.");
    } finally {
      setUploadingInitials(false);
    }
  }

  async function uploadGiftQrFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, 2 - inv.giftQrCodes.length);
    if (remainingSlots === 0) {
      toast.info("Gift hanya boleh 2 QR.");
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploadingGallery(true);
    try {
      const uploadedKeys: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("invitationToken", inv.token);
        const response = await fetch(`${BASE}/api/gift-qr-upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }
        if (data.key) uploadedKeys.push(data.key);
      }
      if (uploadedKeys.length > 0) {
        setInv((current) => ({
          ...current,
          giftQrCodes: [...current.giftQrCodes, ...uploadedKeys].slice(0, 2),
        }));
        toast.success(`${uploadedKeys.length} gift QR uploaded`);
      }
    } catch {
      toast.error("Network error during QR upload.");
    } finally {
      setUploadingGallery(false);
    }
  }

  // ── Gift Registry CRUD ──────────────────────────────────────────────────────
  async function addRegistryItem() {
    if (!newRegName.trim() || !inv.token) return;
    try {
      const res = await fetch(`${BASE}/api/registry/${inv.token}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRegName.trim(),
          url: newRegUrl.trim() || null,
          notes: newRegNotes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to add item.");
        return;
      }
      setRegistryItems((prev) => [...prev, data]);
      setNewRegName("");
      setNewRegUrl("");
      setNewRegNotes("");
    } catch {
      toast.error("Network error.");
    }
  }

  async function saveRegistryItem(id: number) {
    if (!editRegName.trim() || !inv.token) return;
    try {
      const res = await fetch(`${BASE}/api/registry/${inv.token}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editRegName.trim(),
          url: editRegUrl.trim() || null,
          notes: editRegNotes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to save.");
        return;
      }
      setRegistryItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      setEditingRegId(null);
    } catch {
      toast.error("Network error.");
    }
  }

  async function deleteRegistryItem(id: number) {
    if (!inv.token) return;
    try {
      const res = await fetch(`${BASE}/api/registry/${inv.token}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Failed to delete.");
        return;
      }
      setRegistryItems((prev) => prev.filter((i) => i.id !== id));
      if (editingRegId === id) setEditingRegId(null);
    } catch {
      toast.error("Network error.");
    }
  }

  async function uploadRegistryThumb(id: number, file: File) {
    if (!inv.token) return;
    setUploadingRegThumb(id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationToken", inv.token);
      formData.append("itemId", String(id));
      const res = await fetch(`${BASE}/api/registry-thumbnail-upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Upload failed.");
        return;
      }
      setRegistryItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, thumbnailUrl: data.key } : i)),
      );
    } catch {
      toast.error("Network error.");
    } finally {
      setUploadingRegThumb(null);
    }
  }

  async function moveRegistryItem(id: number, direction: "up" | "down") {
    if (!inv.token) return;
    const idx = registryItems.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= registryItems.length) return;
    const reordered = [...registryItems];
    [reordered[idx], reordered[swapIdx]] = [
      reordered[swapIdx]!,
      reordered[idx]!,
    ];
    const updated = reordered.map((item, order) => ({
      ...item,
      sortOrder: order,
    }));
    setRegistryItems(updated);
    // Persist new order in background
    await Promise.all(
      updated.map((item) =>
        fetch(`${BASE}/api/registry/${inv.token}/${item.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: item.sortOrder }),
        }),
      ),
    ).catch(() => {});
  }


  const displayName =
    inv.groomShortName && inv.brideShortName
      ? `${inv.groomShortName} & ${inv.brideShortName}`
      : inv.shortCoupleName ||
        `${inv.coverGroomName} & ${inv.coverBrideName}` ||
        "Ain & Hidayat";
  const fontSize = Number(design.nameFontSize) || 38;
  const fontFamily = fontFamilyStack(design.nameFontFamily);
  const nameColorStyle = design.nameColor
    ? `hsl(${design.nameColor})`
    : "#6b4c2a";

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
          {/* Left: logo + demo back button */}
          <div className="flex items-center gap-3 shrink-0">
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
              className="hover:opacity-70 transition-opacity"
              aria-label="Wedinstudio logo"
            >
              <img
                src={logo}
                alt="Wedinstudio logo"
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
              />
            </button>
            {mode === "demo" && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-green-100 text-[#3d5a3e] text-[10px] font-bold tracking-wider">
                DEMO EDITOR
              </span>
            )}
          </div>

          {/* Centre: invitation name */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate tracking-wide">
              {displayName}
            </p>
          </div>

          {/* Right: dashboard + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(dashboardPathForUser(user))}
              title="Dashboard"
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
          </div>
        </div>
      </header>

      {/* ── Demo language toggle banner ── */}
      {mode === "demo" && (
        <div className="bg-green-50 border-b border-green-100 flex items-center justify-center gap-3 py-1.5 px-4">
          <span className="text-[11px] text-[#3d5a3e] font-semibold tracking-wide uppercase">Demo Language:</span>
          <div className="flex rounded-full bg-white border border-green-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setDemoLang("ms")}
              className={`px-4 py-1 text-[11px] font-bold tracking-wider transition-colors ${
                demoLang === "ms"
                  ? "bg-[#3d5a3e] text-white"
                  : "text-[#3d5a3e] hover:bg-green-50"
              }`}
            >
              BM
            </button>
            <button
              onClick={() => setDemoLang("en")}
              className={`px-4 py-1 text-[11px] font-bold tracking-wider transition-colors ${
                demoLang === "en"
                  ? "bg-[#3d5a3e] text-white"
                  : "text-[#3d5a3e] hover:bg-green-50"
              }`}
            >
              EN
            </button>
          </div>
          <span className="text-[10px] text-green-400">
            {demoLang === "ms" ? "Kandungan Bahasa Melayu" : "English Content"}
          </span>
        </div>
      )}


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
        <div
          className={`flex-1 min-w-0 px-4 lg:px-8 py-6 ${mobileView === "preview" ? "hidden lg:block" : ""}`}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Digital Card Details
          </h2>

          {/* Tabs */}
          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
                style={
                  activeTab === tab.id
                    ? {
                        backgroundColor: "#3d5a3e",
                        color: "#fff",
                        borderColor: "#3d5a3e",
                      }
                    : {
                        backgroundColor: "#fff",
                        color: "#4b5563",
                        borderColor: "#e5e7eb",
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 italic mb-5">
            *Make sure your browser is not in <strong>dark mode</strong>
            <br />
            *This preview may not be an exact match of the final product
          </p>

          {customerEditLocked && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This paid invitation is locked because its event date has passed.
              You can still view the invitation and preview, but editing is no
              longer available.
            </div>
          )}

          <fieldset disabled={customerEditLocked} className="space-y-5 min-w-0">
            {/* ── MUKA DEPAN ── */}
            {activeTab === "muka-depan" && (
              <>
                <Field label="Tajuk Majlis">
                  <input
                    className={inputCls}
                    value={inv.coverTitle}
                    onChange={(e) => setI("coverTitle")(e.target.value)}
                    placeholder={t("placeholders.eventTitle")}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nama Penuh Pengantin Lelaki">
                    <input
                      className={inputCls}
                      value={inv.groomName}
                      onChange={(e) => setI("groomName")(e.target.value)}
                      placeholder={t("placeholders.groomFullName")}
                    />
                  </Field>
                  <Field label="Nama Penuh Pengantin Perempuan">
                    <input
                      className={inputCls}
                      value={inv.brideName}
                      onChange={(e) => setI("brideName")(e.target.value)}
                      placeholder={t("placeholders.brideFullName")}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nama Cover Pengantin Lelaki">
                    <input
                      className={inputCls}
                      value={inv.coverGroomName}
                      onChange={(e) => setI("coverGroomName")(e.target.value)}
                      placeholder="Contoh: M"
                    />
                  </Field>
                  <Field label="Nama Cover Pengantin Perempuan">
                    <input
                      className={inputCls}
                      value={inv.coverBrideName}
                      onChange={(e) => setI("coverBrideName")(e.target.value)}
                      placeholder="Contoh: F"
                    />
                  </Field>
                </div>
                {identityLocked ? (
                  <p className="flex items-center gap-1.5 -mt-2 text-xs text-blue-600"><Lock size={11} />URL link jemputan anda telah dikunci selepas pembayaran. Nama Cover boleh ditukar tetapi URL kekal sama.</p>
                ) : (
                  <p className={`-mt-2 text-xs leading-relaxed ${coverNamesEmpty ? "text-red-500 font-medium" : "text-gray-500"}`}>
                    {coverNamesEmpty ? "⚠ " : ""}URL jemputan anda dijana daripada Nama Cover Pengantin Lelaki dan
                    Nama Cover Pengantin Perempuan di atas.{" "}
                    {coverNamesEmpty
                      ? "Kedua-dua nama wajib diisi sebelum boleh simpan."
                      : "Pastikan kedua-dua nama diisi dengan betul sebelum berkongsi link."}
                  </p>
                )}
                <Field label="Inisial Cover (Pilihan)">
                  <input
                    className={inputCls}
                    value={inv.envelopeInitials}
                    onChange={(e) => setI("envelopeInitials")(e.target.value)}
                    placeholder="Contoh: S & H"
                  />
                  <p className="text-xs text-gray-400">
                    Teks ini dipaparkan dalam bulatan jika tiada artwork
                    initials.
                  </p>
                  <label className="mt-3 block text-xs text-gray-500">
                    Saiz inisial cover: {Number(inv.envelopeInitialsSize) || 24}
                    px
                    <input
                      type="range"
                      min="12"
                      max="48"
                      step="1"
                      value={Number(inv.envelopeInitialsSize) || 24}
                      onChange={(e) =>
                        setInv((p) => ({
                          ...p,
                          envelopeInitialsSize: e.target.value,
                        }))
                      }
                      className="mt-1 w-full accent-gray-700"
                    />
                  </label>
                </Field>
                <Field label="Upload Logo (Pilihan)">
                  <label className="flex cursor-pointer items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <span>
                      {uploadingInitials
                        ? "Memuat naik..."
                        : inv.initialsImageUrl
                          ? "Tukar logo"
                          : "Muat naik logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/png"
                      className="hidden"
                      disabled={uploadingInitials}
                      onChange={(e) => {
                        void uploadInitialsFile(e.target.files?.[0] ?? null);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs text-gray-400">
                    Optional. Sila gunakan PNG dengan transparent background.
                    Maksimum 2 MB.
                  </p>
                  {inv.initialsImageUrl && (
                    <>
                      <img
                        src={resolveImageUrl(inv.initialsImageUrl)}
                        alt="Uploaded logo preview"
                        className="mt-2 h-24 w-24 object-contain"
                        style={{
                          transform: `scale(${inv.initialsImageScale / 100})`,
                        }}
                      />
                      <label className="mt-3 block text-xs text-gray-500">
                        Saiz logo: {inv.initialsImageScale}%
                        <input
                          type="range"
                          min="50"
                          max="140"
                          step="5"
                          value={inv.initialsImageScale}
                          onChange={(e) =>
                            setInv((p) => ({
                              ...p,
                              initialsImageScale: Number(e.target.value),
                            }))
                          }
                          className="mt-1 w-full accent-gray-700"
                        />
                      </label>
                      <button
                        type="button"
                        className="mt-3 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setInv((p) => ({ ...p, initialsImageUrl: "" }))
                        }
                      >
                        Buang logo
                      </button>
                    </>
                  )}
                </Field>
                <Field label="Hashtag">
                  <input
                    className={inputCls}
                    value={inv.hashtag}
                    onChange={(e) => setI("hashtag")(e.target.value)}
                    placeholder={t("placeholders.hashtag")}
                  />
                </Field>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showFrontText"
                    checked={inv.showFrontText}
                    onChange={(e) =>
                      setInv((p) => ({ ...p, showFrontText: e.target.checked }))
                    }
                    className="w-4 h-4 accent-gray-700 rounded"
                  />
                  <label
                    htmlFor="showFrontText"
                    className="text-sm text-gray-700 font-medium cursor-pointer"
                  >
                    Show front page
                  </label>
                </div>
              </>
            )}

            {/* ── AYAT JEMPUTAN ── */}
            {activeTab === "ayat-undangan" && (
              <>
                <Field label="Teks Greeting">
                  <RichTextEditor
                    value={inv.greetingText}
                    onChange={(v) => setI("greetingText")(v)}
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>
                <Field label="Nama Ibu Bapa Pengantin Lelaki" helperText="Dipaparkan di bahagian detail kad">
                  <RichTextEditor
                    value={inv.groomParents}
                    onChange={(v) => setI("groomParents")(v)}
                    placeholder={t("placeholders.groomParents")}
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>
                <Field label="Nama Ibu Bapa Pengantin Perempuan" helperText="Dipaparkan di bahagian detail kad">
                  <RichTextEditor
                    value={inv.brideParents}
                    onChange={(v) => setI("brideParents")(v)}
                    placeholder={t("placeholders.brideParents")}
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>
                <Field label="Teks Jemputan">
                  <RichTextEditor
                    value={inv.invitationText}
                    onChange={(v) => setI("invitationText")(v)}
                    multiLine
                    showFontSize
                    inputStyle={{ textAlign: "center" }}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nama Penuh Pengantin Lelaki">
                    <input
                      className={inputCls}
                      value={inv.groomName}
                      onChange={(e) => setI("groomName")(e.target.value)}
                      placeholder={t("placeholders.groomFullName")}
                      disabled={identityLocked}
                      title={identityLocked ? "Cannot change after payment" : undefined}
                    />
                  </Field>
                  <Field label="Nama Penuh Pengantin Perempuan">
                    <input
                      className={inputCls}
                      value={inv.brideName}
                      onChange={(e) => setI("brideName")(e.target.value)}
                      placeholder={t("placeholders.brideFullName")}
                      disabled={identityLocked}
                      title={identityLocked ? "Cannot change after payment" : undefined}
                    />
                  </Field>
                </div>
                {identityLocked && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600"><Lock size={11} />Nama pengantin tidak boleh ditukar selepas pembayaran.</p>
                )}
                <Field label="Inisial Halaman 2">
                  <input
                    className={inputCls}
                    value={inv.page2Initials}
                    onChange={(e) => setI("page2Initials")(e.target.value)}
                    placeholder="Contoh: M & F"
                  />
                </Field>
              </>
            )}

            {/* ── TARIKH & LOKASI ── */}
            {activeTab === "tarikh-lokasi" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tarikh">
                    <input
                      type="date"
                      className={inputCls}
                      value={inv.eventDate}
                      onChange={(e) => setI("eventDate")(e.target.value)}
                      disabled={identityLocked}
                      title={identityLocked ? "Cannot change after payment" : undefined}
                    />
                    {identityLocked && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-600"><Lock size={11} />Tarikh tidak boleh ditukar selepas pembayaran.</p>
                    )}
                  </Field>
                  <Field label="Hari (auto)">
                    <input
                      className={inputCls}
                      value={inv.eventDay}
                      readOnly
                      placeholder={t("placeholders.dayFromDate")}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Masa Mula">
                    <input
                      type="time"
                      className={inputCls}
                      value={inv.eventStartTime}
                      onChange={(e) => setI("eventStartTime")(e.target.value)}
                    />
                  </Field>
                  <Field label="Masa Tamat">
                    <input
                      type="time"
                      className={inputCls}
                      value={inv.eventEndTime}
                      onChange={(e) => setI("eventEndTime")(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Masa (Teks)">
                  <input
                    className={inputCls}
                    value={inv.eventTime}
                    readOnly
                    placeholder={t("placeholders.timeFromStartEnd")}
                  />
                </Field>
                <Field label="Nama Tempat Majlis">
                  <input
                    className={inputCls}
                    value={inv.venueName}
                    onChange={(e) => setI("venueName")(e.target.value)}
                    placeholder={t("placeholders.venueName")}
                  />
                </Field>
                <Field label="Alamat Majlis">
                  <RichTextEditor
                    value={inv.venueAddress}
                    onChange={(v) => setI("venueAddress")(v)}
                    placeholder={t("placeholders.venueAddress")}
                    multiLine
                    showFontSize
                    inputStyle={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  />
                </Field>
                <Field label="Tarikh Hijri">
                  <input
                    className={inputCls}
                    value={inv.venueHijriDate}
                    onChange={(e) => setI("venueHijriDate")(e.target.value)}
                    placeholder={t("placeholders.islamicDate")}
                  />
                </Field>
                <Field label="Link Google Maps">
                  <input
                    className={inputCls}
                    value={inv.venueMapUrl}
                    onChange={(e) => setI("venueMapUrl")(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </Field>
                <Field label="Link Waze">
                  <input
                    className={inputCls}
                    value={(inv as any).venueWazeUrl}
                    onChange={(e) => setI("venueWazeUrl" as any)(e.target.value)}
                    placeholder="https://waze.com/ul?ll=..."
                  />
                </Field>
              </>
            )}

            {/* ── ATURCARA ── */}
            {activeTab === "aturcara" && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Event Programme
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setInv((p) => ({
                          ...p,
                          itinerary: [...p.itinerary, { time: "", event: "" }],
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                    >
                      <Plus size={14} /> Add item
                    </button>
                  </div>
                  {inv.itinerary.length === 0 && (
                    <p className="text-xs text-gray-400">
                      No programme items yet. Click “Add item” to start.
                    </p>
                  )}
                  <div className="space-y-2">
                    {inv.itinerary.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[1fr_2fr_auto] gap-2 items-start"
                      >
                        <input
                          type="time"
                          className={inputCls}
                          value={item.time}
                          onChange={(e) =>
                            setInv((p) => {
                              const next = [...p.itinerary];
                              next[idx] = {
                                ...next[idx],
                                time: e.target.value,
                              };
                              return { ...p, itinerary: next };
                            })
                          }
                        />
                        <input
                          className={inputCls}
                          value={item.event}
                          onChange={(e) =>
                            setInv((p) => {
                              const next = [...p.itinerary];
                              next[idx] = {
                                ...next[idx],
                                event: e.target.value,
                              };
                              return { ...p, itinerary: next };
                            })
                          }
                          placeholder={t("placeholders.eventName")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setInv((p) => ({
                              ...p,
                              itinerary: p.itinerary.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── DRESS CODE ── */}
            {activeTab === "dresscode" && (
              <div className="space-y-5">
                <Field label="Theme">
                  <input
                    className={inputCls}
                    value={inv.dresscodeTheme}
                    onChange={(e) => setI("dresscodeTheme")(e.target.value)}
                    placeholder="Contoh: Melayu Klasik, Corporate"
                    maxLength={120}
                    data-testid="input-dresscode-theme"
                  />
                  <input
                    type="hidden"
                    value={inv.dresscode}
                    readOnly
                    aria-hidden="true"
                  />
                  <p className="text-xs text-gray-500">
                    Tema pakaian yang akan dipaparkan kepada tetamu.
                  </p>
                </Field>

                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">
                      {inv.dresscodeColors.length}/4
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Pilih sehingga empat warna untuk dipaparkan dalam
                    invitation.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {inv.dresscodeColors.map((color, index) => (
                      <div key={index} className="relative">
                        <HexColorInput
                          value={color}
                          compact
                          label={`Colour ${index + 1}`}
                          testId={`input-dresscode-color-${index}`}
                          onChange={(hex) =>
                            setInv((current) => ({
                              ...current,
                              dresscodeColors: current.dresscodeColors.map(
                                (item, itemIndex) =>
                                  itemIndex === index ? hex : item,
                              ),
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setInv((current) => ({
                              ...current,
                              dresscodeColors: current.dresscodeColors.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs leading-none text-white shadow"
                          aria-label={`Remove dress code colour ${index + 1}`}
                          data-testid={`button-remove-dresscode-color-${index}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {inv.dresscodeColors.length < 4 && (
                      <button
                        type="button"
                        onClick={() =>
                          setInv((current) => ({
                            ...current,
                            dresscodeColors: [
                              ...current.dresscodeColors,
                              "#d8c7a1",
                            ].slice(0, 4),
                          }))
                        }
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-xl text-gray-400 transition hover:border-gray-500 hover:text-gray-700"
                        aria-label="Add dress code colour"
                        data-testid="button-add-dresscode-color"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── DOA ── */}
            {activeTab === "doa" && (
              <Field label="Doa">
                <RichTextEditor
                  value={inv.doaText}
                  onChange={(v) => setI("doaText")(v)}
                  multiLine
                  showFontSize
                  inputStyle={{ textAlign: "center" }}
                />
              </Field>
            )}

            {/* ── GALERI ── */}
            {activeTab === "galeri" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Upload up to 4 images.</p>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={(e) => uploadGalleryFiles(e.target.files)}
                      disabled={uploadingGallery}
                    />
                    {uploadingGallery
                      ? "Uploading..."
                      : inv.galleryImages.length >= 4
                        ? "Gallery Full"
                        : "Upload Images"}
                  </label>
                  <span className="text-xs text-gray-400">
                    {inv.galleryImages.length}/4 images · Max 10 MB each
                  </span>
                </div>
                {inv.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {inv.galleryImages.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={resolveImageUrl(url)}
                          alt={`Gallery preview ${idx + 1}`}
                          onError={(e) => {
                            fallbackToR2Proxy(e, url);
                          }}
                          className="w-full h-24 object-cover rounded border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setInv((p) => ({
                              ...p,
                              galleryImages: p.galleryImages.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── GIFT ── */}
            {activeTab === "gift" && (
              <div className="space-y-4">
                <Field label="Display Gift">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inv.giftDisplay}
                    aria-label="Display Gift"
                    onClick={() =>
                      setInv((current) => ({
                        ...current,
                        giftDisplay: !current.giftDisplay,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                      inv.giftDisplay ? "bg-[#2f8f5b]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        inv.giftDisplay ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </Field>
                <Field label="Recipient Name">
                  <input
                    className={inputCls}
                    value={inv.giftRecipient}
                    onChange={(event) =>
                      setInv((current) => ({
                        ...current,
                        giftRecipient: event.target.value,
                      }))
                    }
                    placeholder="SH AHRUDIN BIN AHMAD"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bank">
                    <input
                      className={inputCls}
                      value={inv.giftBankName}
                      onChange={(event) =>
                        setInv((current) => ({
                          ...current,
                          giftBankName: event.target.value,
                        }))
                      }
                      placeholder="Maybank"
                    />
                  </Field>
                  <Field label="Account Number">
                    <input
                      className={inputCls}
                      value={inv.giftAccountNumber}
                      onChange={(event) =>
                        setInv((current) => ({
                          ...current,
                          giftAccountNumber: event.target.value,
                        }))
                      }
                      placeholder="562375471612"
                    />
                  </Field>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        QR Code
                      </p>
                      <p className="text-xs text-gray-500">
                        Upload up to 2 QR images, max 5 MB each.
                      </p>
                    </div>
                    <label
                      className={`inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-xs font-medium ${inv.giftQrCodes.length >= 2 || !inv.token ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50"}`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        disabled={
                          inv.giftQrCodes.length >= 2 ||
                          !inv.token ||
                          uploadingGallery
                        }
                        onChange={(event) =>
                          uploadGiftQrFiles(event.target.files)
                        }
                      />
                      {inv.giftQrCodes.length >= 2
                        ? "QR Full"
                        : !inv.token
                          ? "Save card first"
                          : "Upload QR"}
                    </label>
                  </div>
                  {inv.giftQrCodes.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {inv.giftQrCodes.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative group">
                          <img
                            src={resolveImageUrl(url)}
                            alt={`Gift QR ${index + 1}`}
                            onError={(event) => fallbackToR2Proxy(event, url)}
                            className="h-32 w-full rounded border border-gray-200 bg-white object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setInv((current) => ({
                                ...current,
                                giftQrCodes: current.giftQrCodes.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── GIFT REGISTRY ── */}
            {activeTab === "registry" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Gift Registry
                  </p>
                  <p className="text-xs text-gray-500">
                    Add products your guests can gift you. Max 20 items.
                  </p>
                </div>

                {/* Delivery address — shown to guests in Tempah Hadiah */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Delivery Info (shown to guests)
                  </p>
                  <input
                    className={inputCls}
                    value={inv.registryRecipientName}
                    onChange={(e) =>
                      setInv((c) => ({
                        ...c,
                        registryRecipientName: e.target.value,
                      }))
                    }
                    placeholder="Nama penerima (e.g. Ahmad Bin Zakaria)"
                  />
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={inv.registryRecipientAddress}
                    onChange={(e) =>
                      setInv((c) => ({
                        ...c,
                        registryRecipientAddress: e.target.value,
                      }))
                    }
                    placeholder={
                      "Alamat Penerima\nNo 56, Taman Melur Cempaka\n86200 Simpang Renggam, Johor"
                    }
                  />
                  <p className="text-xs text-gray-400">
                    Guests see this address when tapping "Tempah" on a product.
                  </p>
                </div>

                {/* Item list */}
                {registryLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : registryItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No items yet. Add your first product below.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {registryItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-white p-3 space-y-2"
                      >
                        {editingRegId === item.id ? (
                          <div className="space-y-2">
                            <input
                              className={inputCls}
                              value={editRegName}
                              onChange={(e) => setEditRegName(e.target.value)}
                              placeholder="Product name *"
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  void saveRegistryItem(item.id);
                              }}
                            />
                            <input
                              className={inputCls}
                              value={editRegUrl}
                              onChange={(e) => setEditRegUrl(e.target.value)}
                              placeholder="Purchase link (optional)"
                            />
                            <input
                              className={inputCls}
                              value={editRegNotes}
                              onChange={(e) => setEditRegNotes(e.target.value)}
                              placeholder="Nota Tambahan (e.g. Nak yg warna aesthetic)"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void saveRegistryItem(item.id)}
                                className="flex-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRegId(null)}
                                className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="relative shrink-0">
                              {item.thumbnailUrl ? (
                                <img
                                  src={resolveImageUrl(item.thumbnailUrl)}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xl">
                                  🎁
                                </div>
                              )}
                              <label
                                className="absolute -bottom-1 -right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-900"
                                title="Upload thumbnail"
                              >
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  disabled={
                                    uploadingRegThumb === item.id || !inv.token
                                  }
                                  onChange={(e) => {
                                    if (e.target.files?.[0])
                                      void uploadRegistryThumb(
                                        item.id,
                                        e.target.files[0],
                                      );
                                  }}
                                />
                                {uploadingRegThumb === item.id ? "…" : "+"}
                              </label>
                            </div>
                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {item.name}
                              </p>
                              {item.url && (
                                <p className="truncate text-xs text-gray-400">
                                  {item.url}
                                </p>
                              )}
                              {item.notes && (
                                <p className="truncate text-xs text-gray-500 italic">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>
                            {/* Actions */}
                            <div className="flex shrink-0 flex-col gap-1">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() =>
                                    void moveRegistryItem(item.id, "up")
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                  title="Move up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === registryItems.length - 1}
                                  onClick={() =>
                                    void moveRegistryItem(item.id, "down")
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                  title="Move down"
                                >
                                  ▼
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRegId(item.id);
                                    setEditRegName(item.name);
                                    setEditRegUrl(item.url ?? "");
                                    setEditRegNotes(item.notes ?? "");
                                  }}
                                  className="flex h-5 w-5 items-center justify-center rounded text-xs text-gray-400 hover:text-blue-600"
                                  title="Edit"
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteRegistryItem(item.id)
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded text-xs text-gray-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new item */}
                {registryItems.length < 20 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">
                      Add Product
                    </p>
                    <input
                      className={inputCls}
                      value={newRegName}
                      onChange={(e) => setNewRegName(e.target.value)}
                      placeholder="Product name *"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newRegName.trim())
                          void addRegistryItem();
                      }}
                    />
                    <input
                      className={inputCls}
                      value={newRegUrl}
                      onChange={(e) => setNewRegUrl(e.target.value)}
                      placeholder="Purchase link (optional)"
                    />
                    <input
                      className={inputCls}
                      value={newRegNotes}
                      onChange={(e) => setNewRegNotes(e.target.value)}
                      placeholder="Nota Tambahan (e.g. Nak yg warna aesthetic)"
                    />
                    <button
                      type="button"
                      disabled={!newRegName.trim() || !inv.token}
                      onClick={() => void addRegistryItem()}
                      className="w-full rounded bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      + Add to Registry
                    </button>
                    {!inv.token && (
                      <p className="text-xs text-amber-600">
                        Save your invitation first to enable Gift Registry.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── KEHADIRAN ── */}
            {activeTab === "kehadiran" && (
              <div className="space-y-4">
                <Field label="RSVP - Yes / No">
                  <select
                    className={inputCls}
                    value={inv.rsvpEnabled ? "yes" : "no"}
                    onChange={(e) =>
                      setInv((p) => ({
                        ...p,
                        rsvpEnabled: e.target.value === "yes",
                      }))
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
                <Field label="Ayat RSVP">
                  <RichTextEditor
                    value={inv.rsvpIntroText}
                    onChange={(v) =>
                      setInv((p) => ({ ...p, rsvpIntroText: v }))
                    }
                    placeholder={t("placeholders.rsvpMessage")}
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
                    onChange={(e) =>
                      setInv((p) => ({ ...p, rsvpDeadline: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Had Keseluruhan Tetamu*">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={inv.rsvpMaxOverallGuests}
                    onChange={(e) =>
                      setInv((p) => ({
                        ...p,
                        rsvpMaxOverallGuests: Math.max(
                          1,
                          Number(e.target.value) || 1,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Had Tetamu Setiap Jemputan*">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={inv.rsvpMaxGuestsPerInvitation}
                    onChange={(e) =>
                      setInv((p) => ({
                        ...p,
                        rsvpMaxGuestsPerInvitation: Math.max(
                          1,
                          Number(e.target.value) || 1,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Email Notifikasi RSVP"
                  hint="Salinan RSVP akan dihantar ke email ini"
                >
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="contoh@email.com"
                    value={inv.rsvpEmail}
                    onChange={(e) =>
                      setInv((p) => ({ ...p, rsvpEmail: e.target.value }))
                    }
                  />
                </Field>
                {inv.rsvpEmail && (
                  <Field
                    label="Hantar Email Notifikasi"
                    hint="Nyahaktif untuk berhenti terima email apabila tetamu RSVP"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setInv((p) => ({
                            ...p,
                            rsvpEmailNotification: !p.rsvpEmailNotification,
                          }))
                        }
                        className={[
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                          inv.rsvpEmailNotification ? "bg-[#3d5a3e]" : "bg-gray-200",
                        ].join(" ")}
                        role="switch"
                        aria-checked={inv.rsvpEmailNotification}
                      >
                        <span
                          className={[
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200",
                            inv.rsvpEmailNotification ? "translate-x-5" : "translate-x-0",
                          ].join(" ")}
                        />
                      </button>
                      <span className="text-xs text-gray-500">
                        {inv.rsvpEmailNotification ? "Aktif" : "Tidak aktif"}
                      </span>
                    </div>
                  </Field>
                )}
              </div>
            )}

            {/* ── CONTACT ── */}
            {activeTab === "hubungi" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Contact persons
                    </p>
                    <p className="text-xs text-gray-500">
                      Add the people guests can contact for this invitation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setInv((p) => ({
                        ...p,
                        contacts: [...p.contacts, { name: "", phone: "" }],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  >
                    <Plus size={14} /> Add contact
                  </button>
                </div>

                {inv.contacts.length === 0 && (
                  <Field label="Nombor Telefon">
                    <input
                      className={inputCls}
                      value={inv.contactPhone}
                      onChange={(e) => setI("contactPhone")(e.target.value)}
                      placeholder="0123456789"
                      type="tel"
                    />
                  </Field>
                )}

                <div className="space-y-3">
                  {inv.contacts.map((contact, index) => (
                    <div
                      key={`contact-${index}`}
                      className="rounded border border-gray-200 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600">
                          Contact {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setInv((p) => ({
                              ...p,
                              contacts: p.contacts.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <Field label="Name">
                        <input
                          className={inputCls}
                          value={contact.name}
                          onChange={(e) =>
                            setInv((p) => ({
                              ...p,
                              contacts: p.contacts.map((item, i) =>
                                i === index
                                  ? { ...item, name: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="Contact name"
                        />
                      </Field>
                      <Field label="Phone number">
                        <input
                          className={inputCls}
                          value={contact.phone}
                          onChange={(e) =>
                            setInv((p) => ({
                              ...p,
                              contacts: p.contacts.map((item, i) =>
                                i === index
                                  ? { ...item, phone: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="0123456789"
                          type="tel"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FOOTER / BRANDING ── */}
            {activeTab === "footer" && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    id="showFooter"
                    type="checkbox"
                    checked={inv.showFooter}
                    onChange={(e) =>
                      setInv((p) => ({ ...p, showFooter: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor="showFooter"
                    className="text-sm font-medium text-gray-700"
                  >
                    Show footer branding
                  </label>
                </div>
                <Field label="Teks Footer">
                  <input
                    className={inputCls}
                    value={inv.footerText}
                    onChange={(e) => setI("footerText")(e.target.value)}
                    placeholder={t("placeholders.footerText")}
                  />
                </Field>
                <Field label="URL Footer">
                  <input
                    className={inputCls}
                    value={inv.footerUrl}
                    onChange={(e) => setI("footerUrl")(e.target.value)}
                    placeholder={t("placeholders.footerUrl")}
                  />
                </Field>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Social Links
                  </label>
                  {(inv.socialLinks || []).map((link, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-2 items-center"
                    >
                      <select
                        className={selectCls}
                        value={link.platform}
                        onChange={(e) => {
                          const next = [...inv.socialLinks];
                          next[idx] = { ...next[idx]!, platform: e.target.value };
                          setInv((p) => ({ ...p, socialLinks: next }));
                        }}
                      >
                        <option value="">-- Platform --</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="threads">Threads</option>
                        <option value="website">Website</option>
                      </select>
                      <input
                        className={inputCls}
                        value={link.url}
                        onChange={(e) => {
                          const next = [...inv.socialLinks];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setInv((p) => ({ ...p, socialLinks: next }));
                        }}
                        placeholder={t("placeholders.url")}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setInv((p) => ({
                        ...p,
                        socialLinks: [
                          ...(p.socialLinks || []),
                          { platform: "", url: "" },
                        ],
                      }))
                    }
                    className="text-xs px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    + Add social link
                  </button>
                </div>
              </>
            )}

            {/* ── DESIGN ── */}
            {activeTab === "reka-bentuk" && (
              <>
                {packages.length > 0 && (
                  <Field label="Package">
                    <select
                      className={`${selectCls} ${
                        packageLocked
                          ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 opacity-75"
                          : ""
                      }`}
                      value={activePackageId ?? ""}
                      disabled={packageLocked}
                      title={
                        packageLocked
                          ? inv.isCustomerOrder && !inv.isPurchased
                            ? "The package assigned to a customer order cannot be changed."
                            : "Package changes are not available for paid invitations. For further assistance, please contact us on WhatsApp."
                          : undefined
                      }
                      onChange={(e) => {
                        const id = e.target.value
                          ? parseInt(e.target.value, 10)
                          : null;
                        setActivePackageId(id);
                      }}
                    >
                      <option value="">{t("placeholders.package")}</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.price ? `– RM ${p.price}` : ""}
                        </option>
                      ))}
                    </select>
                    {packageLocked && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                        <p>
                          {inv.isCustomerOrder && !inv.isPurchased
                            ? "Package assigned by customer order cannot be changed."
                            : "Package changes are not available for paid invitations."}
                        </p>
                        <p className="mt-1">
                          For further assistance, please contact us on WhatsApp.
                        </p>
                        <a
                          href={PACKAGE_SUPPORT_WHATSAPP}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center rounded-md bg-[#25D366] px-3 py-1.5 font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
                        >
                          Contact us on WhatsApp
                        </a>
                      </div>
                    )}
                  </Field>
                )}
                <Field label="Card Language">
                  <select
                    className={selectCls}
                    value={inv.language}
                    onChange={async (e) => {
                      const newLang = e.target.value as "ms" | "en";
                      const oldLang = inv.language;
                      if (newLang === oldLang) return;

                      const TEMPLATE_FIELDS = [
                        "coverTitle", "greetingText", "invitationText",
                        "doaText", "rsvpIntroText", "rsvpFormNote", "message",
                        "eventType", "hostName", "hostCount",
                      ] as const;

                      // Fetch both demo templates in parallel so we know what
                      // the old defaults were (to detect unmodified fields) and
                      // what the new defaults should be.
                      const [oldRes, newRes] = await Promise.all([
                        fetch(`${BASE}/api/invitation/${oldLang === "en" ? "demo-en" : "demo"}`, { credentials: "include" }),
                        fetch(`${BASE}/api/invitation/${newLang === "en" ? "demo-en" : "demo"}`, { credentials: "include" }),
                      ]);
                      const oldTemplate = oldRes.ok ? await oldRes.json() : {};
                      const newTemplate = newRes.ok ? await newRes.json() : {};

                      setInv((p) => {
                        const next: InvData = { ...p, language: newLang };
                        for (const key of TEMPLATE_FIELDS) {
                          const k = key as keyof InvData;
                          const oldVal = oldTemplate[key];
                          const newVal = newTemplate[key];
                          if (newVal == null) continue;
                          // Only replace if the field still matches the old
                          // demo value or is blank — preserve custom edits.
                          if (p[k] === oldVal || p[k] === "" || p[k] == null) {
                            (next[k] as unknown) = newVal;
                          }
                        }
                        return next;
                      });
                    }}
                  >
                    <option value="ms">Malay</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  {mode !== "demo" && (
                    <Field label="Design Code*">
                      <select
                        className={selectCls}
                        value={design.designCode}
                        onChange={(e) => {
                          const picked = availableDesigns.find(
                            (d) => d.designCode === e.target.value,
                          );
                          if (picked) {
                            const gd = activeDesign as
                              | Record<string, string>
                              | undefined;
                            const primary =
                              picked.colorPrimary ??
                              gd?.colorPrimary ??
                              "142 45% 35%";
                            const nextInherited = {
                              nameColor:
                                picked.nameColor ?? gd?.nameColor ?? "0 0% 20%",
                              colorForeground:
                                picked.colorForeground ??
                                gd?.colorForeground ??
                                "0 0% 10%",
                              colorPrimary: primary,
                              colorSecondary:
                                picked.colorSecondary ??
                                gd?.colorSecondary ??
                                primary,
                              colorAccent:
                                picked.colorAccent ??
                                gd?.colorAccent ??
                                picked.colorSecondary ??
                                gd?.colorSecondary ??
                                primary,
                              colorBackground:
                                picked.colorBackground ??
                                gd?.colorBackground ??
                                primary,
                              colorCard:
                                picked.colorCard ??
                                gd?.colorCard ??
                                "0 0% 100%",
                            };
                            setInheritedColors(nextInherited);
                            setDesign((p) => ({
                              ...p,
                              ...nextInherited,
                              designCode: picked.designCode ?? p.designCode,
                              openingAnimation:
                                picked.openingAnimation ?? "doors",
                              openButtonText: picked.openButtonText ?? "BUKA",
                              nameFontFamily: normalizeFont(
                                picked.nameFontFamily ??
                                  picked.fontHeading ??
                                  p.nameFontFamily,
                              ),
                              nameFontSize:
                                picked.nameFontSize ?? p.nameFontSize,
                              badgeFontSize:
                                picked.badgeFontSize ?? p.badgeFontSize,
                              greetingFontSize:
                                (picked as any).greetingFontSize ?? p.greetingFontSize,
                              greetingColor:
                                (picked as any).greetingColor ?? p.greetingColor,
                              bodyFontFamily: normalizeFont(
                                picked.fontBody ?? p.bodyFontFamily,
                              ),
                              cardImageUrl:
                                picked.cardImageUrl ??
                                "wed_card_design/20260531-041903-27796.jpg",
                              envelopeImageUrl:
                                picked.envelopeImageUrl ??
                                "wed_card_design/20260531-041903-27796.jpg",
                              musicUrl: picked.musicUrl ?? "",
                              musicTitle: picked.musicTitle ?? "",
                              musicArtist: picked.musicArtist ?? "",
                            }));
                            setPreviewOpened(true);
                            setPreviewWasOpened(false);
                          } else {
                            setDesign((p) => ({
                              ...p,
                              designCode: e.target.value,
                            }));
                          }
                          const params = new URLSearchParams(
                            window.location.search,
                          );
                          if (params.has("designCode")) {
                            params.delete("designCode");
                            const qs = params.toString();
                            navigate(
                              window.location.pathname +
                                (qs ? `?${qs}` : "") +
                                window.location.hash,
                              { replace: true },
                            );
                          }
                        }}
                      >
                        {availableDesigns.length === 0 && (
                          <option value={design.designCode}>
                            {design.designCode}
                          </option>
                        )}
                        {availableDesigns.map((d) => (
                          <option key={d.id} value={d.designCode ?? ""}>
                            {d.designCode
                              ? `${d.designCode} – ${d.name}`
                              : d.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Opening Style">
                    <select
                      className={selectCls}
                      value={design.openingAnimation}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          openingAnimation: e.target.value,
                        }))
                      }
                    >
                      {OPENING_ANIMS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                {/* Overlay toggle — available in all modes */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={inv.overlayEnabled}
                    onChange={(e) =>
                      setInv((p) => ({
                        ...p,
                        overlayEnabled: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm font-medium text-foreground">
                    Show background overlay
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (translucent layer + cloud effect behind content)
                  </span>
                </label>

                {/* Wax seal is per card-design (set in Admin → Edit Design), not per demo invitation */}
                <div className="space-y-2">
                  {mode !== "demo" && (
                    <Field label="Wax Seal">
                      <select
                        className={selectCls}
                        value={design.waxSealId}
                        onChange={(e) =>
                          setDesign((p) => ({
                            ...p,
                            waxSealId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Default (initials circle)</option>
                        {waxSeals.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  {design.waxSealId &&
                    (() => {
                      const sel = waxSeals.find(
                        (s) => String(s.id) === design.waxSealId,
                      );
                      return sel ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={resolveImageUrl(sel.imageUrl)}
                            alt={sel.name}
                            className="h-14 w-14 rounded-full border border-border object-contain bg-muted"
                          />
                          <span className="text-xs text-muted-foreground">
                            {sel.name}
                          </span>
                        </div>
                      ) : null;
                    })()}
                </div>
                {/* Colors, fonts, sizes — buyer & business only; admin uses card design settings */}
                {(mode === "buyer" || mode === "business") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Font Nama">
                        <select
                          className={selectCls}
                          value={normalizeFont(design.nameFontFamily)}
                          style={{ fontFamily: design.nameFontFamily }}
                          onChange={(e) =>
                            setDesign((p) => ({
                              ...p,
                              nameFontFamily: e.target.value,
                            }))
                          }
                        >
                          {SCRIPT_FONTS.map((f) => (
                            <option
                              key={f.value}
                              value={f.value}
                              style={{ fontFamily: f.value }}
                            >
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Font Kandungan">
                        <select
                          className={selectCls}
                          value={normalizeFont(design.bodyFontFamily)}
                          style={{ fontFamily: design.bodyFontFamily }}
                          onChange={(e) =>
                            setDesign((p) => ({
                              ...p,
                              bodyFontFamily: e.target.value,
                            }))
                          }
                        >
                          {CLASSIC_FONTS.map((f) => (
                            <option
                              key={f.value}
                              value={f.value}
                              style={{ fontFamily: f.value }}
                            >
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field
                      label={`Saiz Name Font — ${design.nameFontSize || 38}px`}
                    >
                      <input
                        type="range"
                        min={20}
                        max={70}
                        value={Number(design.nameFontSize) || 38}
                        onChange={(e) =>
                          setDesign((p) => ({
                            ...p,
                            nameFontSize: e.target.value,
                          }))
                        }
                        className="w-full accent-blue-500"
                      />
                    </Field>
                    <Field
                      label={`Saiz Tajuk Section — ${design.badgeFontSize || 24}px`}
                    >
                      <input
                        type="range"
                        min={12}
                        max={60}
                        step={1}
                        value={design.badgeFontSize || 24}
                        onChange={(e) =>
                          setDesign((p) => ({
                            ...p,
                            badgeFontSize: e.target.value,
                          }))
                        }
                        className="w-full accent-blue-500"
                      />
                    </Field>
                    <Field
                      label={`Saiz Greeting & Nama Detail — ${design.greetingFontSize || 16}px`}
                    >
                      <input
                        type="range"
                        min={10}
                        max={40}
                        step={1}
                        value={Number(design.greetingFontSize) || 16}
                        onChange={(e) =>
                          setDesign((p) => ({
                            ...p,
                            greetingFontSize: e.target.value,
                          }))
                        }
                        className="w-full accent-blue-500"
                      />
                    </Field>
                    {/* Theme Colours — grouped to match Admin design editor */}
                    <p className="text-xs font-semibold text-foreground pt-1">
                      Warna Tema
                    </p>

                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      1 · Teks
                    </p>
                    <HexColorInput
                      value={design.nameColor || "20 50% 20%"}
                      label="Nama Utama"
                      helperText="Nama pasangan & teks script"
                      preview={{
                        type: "text",
                        sample: "Ahmad & Siti",
                        font: "script",
                      }}
                      testId="editor-name-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          nameColor: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={design.greetingColor || ""}
                      label="Greeting, Nama Parents & Nama Detail"
                      helperText="Assalamualaikum & nama pasangan dalam bahagian detail"
                      preview={{
                        type: "text",
                        sample: "Assalamualaikum",
                        font: "script",
                      }}
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          greetingColor: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={
                        design.colorHeading ||
                        inheritedColors.colorHeading ||
                        ""
                      }
                      label="Tajuk Section"
                      helperText="Tajuk setiap bahagian jemputan"
                      preview={{
                        type: "text",
                        sample: "ATUR CARA",
                        font: "heading",
                      }}
                      testId="editor-heading-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorHeading: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={design.colorForeground || "0 0% 10%"}
                      label="Teks Kandungan"
                      helperText="Butiran, tarikh & kandungan utama"
                      preview={{
                        type: "text",
                        sample: "11:00 AM  Ketibaan Tetamu",
                      }}
                      testId="editor-foreground-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorForeground: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={
                        design.colorMuted || inheritedColors.colorMuted || ""
                      }
                      label="Teks Kecil"
                      helperText="Nota, kapsyen & teks sampingan"
                      preview={{
                        type: "text",
                        sample: "Sila tiba 15 min awal",
                        font: "muted",
                      }}
                      testId="editor-muted-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorMuted: hexToHslColor(hex),
                        }))
                      }
                    />

                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-1">
                      2 · Butang &amp; Hiasan
                    </p>
                    <HexColorInput
                      value={design.colorPrimary || "142 45% 35%"}
                      label="Butang Utama"
                      helperText="RSVP, Buka Jemputan & tindakan utama"
                      preview={{ type: "button", sample: "RSVP" }}
                      testId="editor-primary-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorPrimary: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={design.colorSecondary || "142 30% 92%"}
                      label="Butang Kedua"
                      helperText="Maps & tindakan sokongan"
                      preview={{ type: "button", sample: "Maps" }}
                      testId="editor-secondary-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorSecondary: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={design.colorAccent || "142 30% 92%"}
                      label="Hiasan / Accent"
                      helperText="Garisan, ikon & ornamen"
                      preview={{ type: "ornament", sample: "— ✦ —" }}
                      testId="editor-accent-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorAccent: hexToHslColor(hex),
                        }))
                      }
                    />

                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-1">
                      3 · Latar Belakang
                    </p>
                    <HexColorInput
                      value={design.colorBackground || "142 20% 96%"}
                      label="Latar Halaman"
                      helperText="Latar belakang utama jemputan"
                      preview={{ type: "surface", sample: "Page" }}
                      testId="editor-background-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorBackground: hexToHslColor(hex),
                        }))
                      }
                    />
                    <HexColorInput
                      value={design.colorCard || "0 0% 100%"}
                      label="Latar Kad / Popup"
                      helperText="Kad, popup & panel dalam"
                      preview={{ type: "surface", sample: "Card" }}
                      testId="editor-card-color"
                      onChange={(hex) =>
                        setDesign((p) => ({
                          ...p,
                          colorCard: hexToHslColor(hex),
                        }))
                      }
                    />
                  </>
                )}
                <Field label="Link Lagu (YouTube)">
                  <input
                    className={inputCls}
                    value={design.musicUrl}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, musicUrl: e.target.value }))
                    }
                    placeholder={t("placeholders.musicUrl")}
                  />
                </Field>
                {extractYouTubeId(design.musicUrl) && (
                  <div className="rounded overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(design.musicUrl)}`}
                      allow="autoplay"
                      className="block"
                    />
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-700 space-y-1">
                  <p>Autoplay support depends on device & browser.</p>
                  <p>
                    <strong>Supported:</strong> Chrome, Safari, Firefox, Opera,
                    Brave, Edge & latest UC Browser.
                  </p>
                  <p>
                    <strong>Tidak Supported:</strong>{" "}
                    Facebook/Instagram/Telegram Browser & less popular browsers.
                  </p>
                </div>
              </>
            )}
          </fieldset>

          {/* Action buttons */}
          <div className="mt-8 pt-4 border-t border-gray-100 space-y-2">
            {coverNamesEmpty && !customerEditLocked && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <Lock size={11} /> Sila isi <strong>Nama Cover Pengantin Lelaki</strong> dan <strong>Nama Cover Pengantin Perempuan</strong> untuk simpan.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || customerEditLocked || coverNamesEmpty}
                className="text-white px-6 py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#3d5a3e" }}
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
        </div>

        {/* Right: Card Preview — always shown on mobile when preview tab active */}
        <div
          className={`${mobileView === "preview" ? "flex" : "hidden"} lg:flex lg:w-[380px] xl:w-[420px] shrink-0 items-start justify-center py-4 px-4 lg:py-6 lg:pr-6`}
        >
          <div className="sticky top-6 w-full space-y-2">
            {/* Full preview + reset row */}
            <div className="flex items-center justify-between px-1">
              {(() => {
                const previewPath = publicInvitePathOrToken(inv);
                const previewUrl = previewPath ? `${BASE}${previewPath}` : undefined;
                const label = saving ? "Saving…" : customerEditLocked ? "↗ View Preview" : "↗ Full Preview";
                return previewUrl && !saving && previewReady ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => { if (!customerEditLocked) void handleSave(); }}
                    className="text-xs text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-full px-3 py-1 font-medium transition-colors"
                  >
                    {label}
                  </a>
                ) : (
                  <button
                    disabled
                    className="text-xs text-emerald-700 border border-emerald-300 bg-emerald-50 rounded-full px-3 py-1 font-medium opacity-50 cursor-not-allowed"
                  >
                    {label}
                  </button>
                );
              })()}
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
              style={
                {
                  aspectRatio: "9/16",
                  maxHeight: "80vh",
                  "--card-viewport-height": "100%",
                  "--primary": design.colorPrimary || "142 45% 35%",
                  "--primary-foreground": "0 0% 100%",
                  "--secondary": design.colorSecondary || "142 30% 92%",
                  "--accent": design.colorAccent || "142 30% 92%",
                  "--background": design.colorBackground || "142 20% 96%",
                  "--card": design.colorCard || "0 0% 100%",
                  "--popover": design.colorCard || "0 0% 100%",
                  "--foreground": design.colorForeground || "0 0% 10%",
                  "--border": "142 20% 80%",
                  "--muted": "142 15% 94%",
                  "--muted-foreground": "142 10% 45%",
                  // Name styling — picked up by WeddingCard via CSS custom properties
                  "--name-font-family": fontFamilyStack(design.nameFontFamily),
                  "--name-font-size": `${Number(design.nameFontSize) || 38}px`,
                  "--badge-font-size": `${Number(design.badgeFontSize) || 24}px`,
                  "--section-title-font-size": `${Number(design.badgeFontSize) || 24}px`,
                  "--greeting-font-size": `${Number(design.greetingFontSize) || 16}px`,
                  "--greeting-color": design.greetingColor ? `hsl(${design.greetingColor})` : undefined,
                  "--name-color": design.nameColor
                    ? `hsl(${design.nameColor})`
                    : "hsl(20 50% 25%)",
                  "--color-heading": design.colorHeading
                    ? `hsl(${design.colorHeading})`
                    : undefined,
                  "--color-muted": design.colorMuted
                    ? `hsl(${design.colorMuted})`
                    : undefined,
                  // Body text styling
                  "--body-font-family": fontFamilyStack(design.bodyFontFamily),
                } as React.CSSProperties
              }
            >
              <div
                className={`absolute inset-0 z-10 transition-all duration-700 ${
                  previewOpened
                    ? "overflow-y-auto overflow-x-hidden"
                    : "overflow-hidden pointer-events-none"
                }`}
                style={
                  { WebkitOverflowScrolling: "touch" } as React.CSSProperties
                }
              >
                <WeddingCard
                  invitation={
                    mode !== "demo" && activePackageId !== null && !activeFeatureNames.has("Dress Code")
                      ? { ...inv, dresscode: "", dresscodeTheme: "", dresscodeColors: [] }
                      : inv
                  }
                  cardImageUrl={resolveImageUrl(
                    design.cardImageUrl ||
                      "wed_card_design/20260531-041903-27796.jpg",
                  )}
                  envelopeImageUrl={resolveImageUrl(
                    design.envelopeImageUrl ||
                      "wed_card_design/20260531-041903-27796.jpg",
                  )}
                  cardMaxWidth={design.cardMaxWidth}
                  rsvpCount={{ attending: 0, notAttending: 0, totalGuests: 0 }}
                  onRsvpClick={() =>
                    toast.info(
                      "RSVP form is functional in the public card preview only.",
                    )
                  }
                  overlayEnabled={inv.overlayEnabled}
                />
              </div>

              {/* Opening animation mirrors InvitationPage, scaled to this preview frame. */}
              {design.openingAnimation === "envelope" ? (
                <EnvelopeAnimation
                  key={`env-${activeTab}-${design.designCode}`}
                  isOpened={previewOpened}
                  onOpen={() => {
                    setPreviewWasOpened(true);
                    setPreviewOpened(true);
                  }}
                  names={inv.envelopeInitials}
                  initialsSize={inv.envelopeInitialsSize}
                  initialsImageUrl={
                    resolveImageUrl(inv.initialsImageUrl) || undefined
                  }
                  initialsImageScale={inv.initialsImageScale}
                  envelopeImageUrl={resolveImageUrl(
                    design.envelopeImageUrl ||
                      "wed_card_design/20260531-041903-27796.jpg",
                  )}
                  waxSealImageUrl={
                    design.waxSealId
                      ? resolveImageUrl(
                          waxSeals.find(
                            (s) => String(s.id) === design.waxSealId,
                          )?.imageUrl || "",
                        ) || undefined
                      : undefined
                  }
                />
              ) : (
                <EnvelopeDoors
                  key={`doors-${activeTab}-${design.designCode}`}
                  isOpened={previewOpened}
                  onOpen={() => {
                    setPreviewWasOpened(true);
                    setPreviewOpened(true);
                  }}
                  names={inv.envelopeInitials}
                  initialsSize={inv.envelopeInitialsSize}
                  initialsImageUrl={
                    resolveImageUrl(inv.initialsImageUrl) || undefined
                  }
                  initialsImageScale={inv.initialsImageScale}
                  envelopeImageUrl={resolveImageUrl(
                    design.envelopeImageUrl ||
                      "wed_card_design/20260531-041903-27796.jpg",
                  )}
                  waxSealImageUrl={
                    design.waxSealId
                      ? resolveImageUrl(
                          waxSeals.find(
                            (s) => String(s.id) === design.waxSealId,
                          )?.imageUrl || "",
                        ) || undefined
                      : undefined
                  }
                  cardMaxWidth={design.cardMaxWidth}
                />
              )}

              {/* Unpaid cards are clearly marked as previews. The editor remains
                  interactive so buyers can continue preparing their invitation. */}
              {previewWasOpened && !inv.isPurchased && (
                <div
                  className="absolute inset-x-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center pointer-events-none"
                  style={{ background: "rgba(80, 80, 80, 0.28)", height: 26 }}
                >
                  <span className="select-none text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
                    PREVIEW
                  </span>
                </div>
              )}

              {/* Bottom nav — actual component, positioned inside the preview frame.
                  overflow-hidden + rounded-b-xl clips the nav bar corners to match
                  the card frame even when the parent is overflow-visible. */}
              {previewOpened && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-50 overflow-hidden rounded-b-xl"
                >
                  <div
                    className="w-full mx-auto"
                    style={{ maxWidth: design.cardMaxWidth || "420px" }}
                  >
                    <BottomNav
                      activeTab={previewActiveTab as TabKey | null}
                      isMuted={false}
                      onTabClick={(tab) =>
                        setPreviewActiveTab((prev) =>
                          prev === tab ? null : tab,
                        )
                      }
                      onRsvpClick={() => toast.info("RSVP preview only")}
                      isVisible={true}
                      cardMaxWidth="100%"
                      showGift={inv.giftDisplay}
                    />
                  </div>
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
                  registryItems={registryItems}
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
