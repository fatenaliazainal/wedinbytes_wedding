import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useListDesigns,
  useActivateDesign,
  CardDesign,
} from "@workspace/api-client-react";
import {
  Loader2, RefreshCw,
  PaintBucket, Plus, CheckCircle2, Circle, Trash2, X, Upload,
  Pencil, Copy, Check, Star, MessageSquare,
  Search, ExternalLink, Ban, UserRound, DollarSign, ShoppingBag, Home, LogOut,
  BarChart3, TrendingUp, CalendarDays,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetActiveDesignQueryKey, getListDesignsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForUser } from "@/lib/dashboard-path";
import PricingTab from "@/components/PricingTab";
import { publicInvitePath } from "@/lib/invite-url";
import { hexToHsl } from "@/lib/color-format";
import { HexColorInput } from "@/components/HexColorInput";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
import { resolveImageUrl } from "@/lib/r2-url";

type Tab = "designs" | "reviews" | "demo" | "pricing" | "orders" | "customers" | "revenue";

type RawCard = {
  id: number;
  name: string;
  path: string;
  category: string;
  publicUrl?: string;
};

type AdminOrder = {
  id: number;
  paymentStatus: string;
  paymentReference?: string | null;
  paymentGateway?: string | null;
  amount: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: number; name: string; email: string; createdAt: string } | null;
  package?: { id: number; name: string; price: string } | null;
  invitation?: {
    id: number; token: string; brideName: string; groomName: string;
    coverBrideName?: string | null; coverGroomName?: string | null;
    eventDate: string; venueName: string; websiteStatus: string; isPurchased: boolean;
  } | null;
};

type AdminOrderStats = {
  totalOrders: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  activeWebsites: number;
  recentOrders: AdminOrder[];
  packageOrderStats: Array<{
    packageId: number | null;
    packageName: string;
    totalOrders: number;
    successfulOrders: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    label: string;
    totalOrders: number;
    successfulOrders: number;
    revenue: number;
    dailyRevenue: Array<{
      date: string;
      label: string;
      totalOrders: number;
      successfulOrders: number;
      revenue: number;
    }>;
  }>;
};

type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalPaid: number;
  websites: Array<{ id: number; token: string; websiteStatus: string; brideName: string; groomName: string }>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Image Upload Field ────────────────────────────────────────────────────────

function ImageUploadField({
  label,
  value,
  previewUrl,
  onChange,
  onFileSelect,
}: {
  label: string;
  value: string;
  previewUrl?: string;
  onChange: (url: string) => void;
  onFileSelect: (file: File | null, previewUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("");
  const displayUrl =  previewUrl || localPreviewUrl || value;

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  function clearLocalPreview() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl("");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>

      {/* Preview */}
      {displayUrl && (
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border bg-muted">
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              onChange("");
              onFileSelect(null, "");
              clearLocalPreview();
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Upload button + URL input */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          <Upload size={13} />
          Choose File
        </button>
        <input
          className="flex-1 rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 bg-background"
          placeholder="or paste a URL here..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value) {
              onFileSelect(null, "");
              clearLocalPreview();
            }
          }}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              clearLocalPreview();
              const preview = URL.createObjectURL(f);
              setLocalPreviewUrl(preview);
              onFileSelect(f, preview);
            }
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function ImageScaleControl({
  label,
  previewUrl,
  scale,
  onScaleChange,
}: {
  label: string;
  previewUrl?: string;
  scale: number;
  onScaleChange: (scale: number) => void;
}) {
  if (!previewUrl) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label} scale before saving</span>
        <span className="font-mono text-foreground">{scale}%</span>
      </div>
      <input
        type="range"
        min="25"
        max="200"
        step="1"
        value={scale}
        onChange={(e) => onScaleChange(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
        aria-label="Image scale before saving"
      />
      <div className="mt-3 flex justify-center overflow-hidden rounded-xl border border-border bg-[#e9e9e5] p-5 sm:p-8">
        <div className="relative aspect-[9/16] w-[min(360px,72vw)] overflow-hidden border-[4px] border-gray-800 bg-white shadow-lg">
          <img
            src={previewUrl}
            alt="Scaled image preview"
            className="absolute inset-0 h-full w-full object-contain transition-transform"
            style={{
              transform: `scale(${scale / 100})`,
              transformOrigin: "center",
            }}
          />
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute inset-x-0 top-0 h-[18%] border-b border-dashed border-amber-500/80 bg-amber-300/10">
              <span className="absolute left-2 top-2 rounded bg-amber-600 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
                Warning · Top
              </span>
            </div>
            <div className="absolute inset-x-[8%] top-[18%] h-[64%] border border-dashed border-emerald-600/90 bg-emerald-300/10">
              <span className="absolute left-2 top-2 rounded bg-emerald-700 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
                Safe Area
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[18%] border-t border-dashed border-amber-500/80 bg-amber-300/10">
              <span className="absolute bottom-2 left-2 rounded bg-amber-600 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
                Warning · Bottom
              </span>
            </div>
            <div className="absolute inset-0 border-[5px] border-rose-500/20">
              <span className="absolute right-1 top-1/2 -rotate-90 rounded bg-rose-700 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
                Bleed
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
        100% keeps the uploaded image unchanged. Keep text, faces, and decorations inside the green Safe Area.
      </p>
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] leading-4 text-emerald-900">
        <p className="font-semibold">Recommended artwork size: 900 × 1600 px (9:16)</p>
        <p>Safe Area: approximately 756 × 1024 px, starting 72 px from the left/right and 288 px from the top.</p>
        <p className="mt-1">Create your artwork on this full canvas. The image will not be cropped before scaling.</p>
      </div>
    </div>
  );
}

async function uploadFile(file: File, designCode: string, assetType: "card" | "envelope" | "thumbnail") {
  const fd = new FormData();
  fd.append("designCode", designCode);
  fd.append("assetType", assetType);
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json() as { key?: string; url?: string };
  const key = data.key ?? data.url;
  if (!key) throw new Error("Upload response did not include an image key");
  return key;
}

async function scaleImageFile(file: File, scale: number): Promise<File> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to read image"));
      element.src = sourceUrl;
    });
    // The invitation artwork uses a 9:16 mobile canvas.
    // Bake the same frame into the uploaded file so the renderer cannot
    // re-fit a small scaled image back to full size.
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1600;
    const context = canvas.getContext("2d");
    if (!context) return file;

    const containScale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const coveredWidth = image.naturalWidth * containScale * (scale / 100);
    const coveredHeight = image.naturalHeight * containScale * (scale / 100);
    context.drawImage(
      image,
      (canvas.width - coveredWidth) / 2,
      (canvas.height - coveredHeight) / 2,
      coveredWidth,
      coveredHeight,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.png`, { type: blob.type }) : file;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

// ── Colour Picker Row ─────────────────────────────────────────────────────────

function ColorRow({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-3">
      <HexColorInput
        value={value}
        label={label}
        testId={`admin-color-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        onChange={(hex) => onChange(hexToHsl(hex))}
      />
    </div>
  );
}

// ── Auto Code Badge ────────────────────────────────────────────────────────────

function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/60 border border-border px-4 py-2.5">
      <div>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Design Code (Auto)</p>
        <p className="text-lg font-bold font-mono text-foreground tracking-widest">{code}</p>
      </div>
      <button type="button" onClick={copy} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

// ── Design Form (Add / Edit) ───────────────────────────────────────────────────

const ANIMATION_OPTIONS = ["doors", "envelope", "fade", "none"];

const SCRIPT_FONT_OPTIONS = [
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
];

const BODY_FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Poppins", label: "Poppins" },
  { value: "Lato", label: "Lato" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
];

interface DesignFormData {
  name: string;
  designCode: string;
  cardImageUrl: string;
  cardImageFile?: File | null;
  cardImagePreviewUrl?: string;
  thumbnailImageUrl: string;
  thumbnailImageFile?: File | null;
  thumbnailImagePreviewUrl?: string;
  thumbnailImageChanged?: boolean;
  envelopeImageUrl: string;
  envelopeImageFile?: File | null;
  envelopeImagePreviewUrl?: string;
  openingAnimation: string;
  nameFontFamily: string;
  bodyFontFamily: string;
  nameFontSize: string;
  badgeFontSize: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorCard: string;
  nameColor: string;
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  openButtonText: string;
}

const EMPTY_FORM: DesignFormData = {
  name: "", designCode: "", cardImageUrl: "", thumbnailImageUrl: "", envelopeImageUrl: "",
  openingAnimation: "doors", colorPrimary: "", colorSecondary: "",
  colorAccent: "", colorBackground: "", colorCard: "", nameColor: "",
  nameFontFamily: "Dancing Script", bodyFontFamily: "Poppins",
  nameFontSize: "38", badgeFontSize: "24",
  musicUrl: "", musicTitle: "",
  musicArtist: "", openButtonText: "OPEN",
};

function DesignForm({
  initial, autoCode, mode, onClose,
}: {
  initial: DesignFormData;
  autoCode: string;
  mode: "add" | "edit";
  editId?: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DesignFormData>({ ...initial });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const [rawCards, setRawCards] = useState<RawCard[]>([]);
  const [cardPickerId, setCardPickerId] = useState("");
  const [envelopePickerId, setEnvelopePickerId] = useState("");
  const [cardImageScale, setCardImageScale] = useState(100);
  const [envelopeImageScale, setEnvelopeImageScale] = useState(100);

  useEffect(() => {
    fetch(`${BASE}/api/cards`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: RawCard[]) => setRawCards(data))
      .catch(() => {});
  }, []);

  const set = (key: keyof DesignFormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const buildR2Url = (path: string) => {
    return resolveImageUrl(path) ?? "";
  };

  const findPickerIdByPath = (path: string) => rawCards.find((c) => c.path === path)?.id;

  const selectedCard = cardPickerId ? rawCards.find((c) => String(c.id) === cardPickerId) : undefined;
  const selectedCardPreviewUrl = selectedCard?.path ? buildR2Url(selectedCard.path) : "";

  const selectedEnvelope = envelopePickerId ? rawCards.find((c) => String(c.id) === envelopePickerId) : undefined;
  const selectedEnvelopePreviewUrl = selectedEnvelope?.path ? buildR2Url(selectedEnvelope.path) : "";

  useEffect(() => {
    if (!cardPickerId && form.cardImageUrl) {
      const cardId = findPickerIdByPath(form.cardImageUrl);
      if (cardId !== undefined) {
        setCardPickerId(String(cardId));
      }
    }
  }, [rawCards, form.cardImageUrl, cardPickerId]);

  useEffect(() => {
    if (!envelopePickerId && form.envelopeImageUrl) {
      const cardId = findPickerIdByPath(form.envelopeImageUrl);
      if (cardId !== undefined) {
        setEnvelopePickerId(String(cardId));
      }
    }
  }, [rawCards, form.envelopeImageUrl, envelopePickerId]);

  function handleCardPickerChange(value: string) {
    setCardPickerId(value);
    const card = rawCards.find((c) => String(c.id) === value);
    setForm((f) => ({
      ...f,
      cardImageUrl: card?.path ?? "",
      cardImageFile: null,
      cardImagePreviewUrl: "",
    }));
  }

  function handleEnvelopePickerChange(value: string) {
    setEnvelopePickerId(value);
    const card = rawCards.find((c) => String(c.id) === value);
    setForm((f) => ({
      ...f,
      envelopeImageUrl: card?.path ?? "",
      envelopeImageFile: null,
      envelopeImagePreviewUrl: "",
    }));
  }

  const displayCode = form.designCode.trim() || autoCode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Design name is required."); return; }
    setSaving(true);
    try {
      let cardImageUrl = form.cardImageUrl;
      if (form.cardImageFile) {
        cardImageUrl = await uploadFile(await scaleImageFile(form.cardImageFile, cardImageScale), displayCode, "card");
      }
      let envelopeImageUrl = form.envelopeImageUrl;
      if (form.envelopeImageFile) {
        envelopeImageUrl = await uploadFile(await scaleImageFile(form.envelopeImageFile, envelopeImageScale), displayCode, "envelope");
      }
      let thumbnailImageUrl = form.thumbnailImageUrl;
      if (form.thumbnailImageFile) {
        thumbnailImageUrl = await uploadFile(form.thumbnailImageFile, displayCode, "thumbnail");
      }

      const payload = {
        name: form.name,
        designCode: displayCode,
        cardImageUrl,
        envelopeImageUrl,
        ...(mode === "add" || form.thumbnailImageChanged || form.thumbnailImageFile
          ? { thumbnailImageUrl }
          : {}),
        openingAnimation: form.openingAnimation,
        nameFontFamily: form.nameFontFamily,
        // Card catalogue thumbnails use fontHeading, while the live editor
        // uses nameFontFamily for the couple names. Keep both in sync.
        fontHeading: form.nameFontFamily,
        fontBody: form.bodyFontFamily,
        nameFontSize: form.nameFontSize,
        badgeFontSize: form.badgeFontSize,
        colorPrimary: form.colorPrimary,
        colorSecondary: form.colorSecondary,
        colorAccent: form.colorAccent,
        colorBackground: form.colorBackground,
        colorCard: form.colorCard,
        nameColor: form.nameColor,
        musicUrl: form.musicUrl,
        musicTitle: form.musicTitle,
        musicArtist: form.musicArtist,
        openButtonText: form.openButtonText,
      };
      const url = mode === "add"
        ? `${BASE}/api/design`
        : `${BASE}/api/design/${(initial as DesignFormData & { id?: number }).id}`;
      const method = mode === "add" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to save.");
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListDesignsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetActiveDesignQueryKey() }),
      ]);
      toast.success(mode === "add" ? "Design added successfully!" : "Design updated!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] px-4 py-6 sm:px-6 lg:px-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-8">
          <h2 className="text-base font-semibold">
            {mode === "add" ? "Add New Design" : "Edit Design"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-visible px-6 py-6 sm:px-8 lg:px-12">

          {/* Auto code */}
          <CodeBadge code={displayCode} />

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Design Name *</label>
            <input
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Garden Floral Premium"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              required
            />
          </div>

          {/* Custom code override */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Custom Code <span className="text-muted-foreground/60">(optional — leave blank for auto)</span>
            </label>
            <input
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono uppercase"
              placeholder={autoCode}
              value={form.designCode}
              onChange={(e) => set("designCode")(e.target.value.toUpperCase())}
            />
          </div>

          {/* Card picker from library */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Card Picker</label>
            <select
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              value={cardPickerId}
              onChange={(e) => handleCardPickerChange(e.target.value)}
            >
              <option value="">— Select card —</option>
              {rawCards.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            {selectedCardPreviewUrl ? (
              <div className="mt-3 flex justify-center">
                <img
                  src={selectedCardPreviewUrl}
                  alt={selectedCard?.name}
                  className="max-h-52 rounded-xl object-contain border border-border shadow-sm"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ) : null}
          </div>

          {/* Envelope picker from library */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Envelope Picker</label>
            <select
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              value={envelopePickerId}
              onChange={(e) => handleEnvelopePickerChange(e.target.value)}
            >
              <option value="">— Select envelope —</option>
              {rawCards.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            {selectedEnvelopePreviewUrl ? (
              <div className="mt-3 flex justify-center">
                <img
                  src={selectedEnvelopePreviewUrl}
                  alt={selectedEnvelope?.name}
                  className="max-h-52 rounded-xl object-contain border border-border shadow-sm"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ) : null}
          </div>

          {/* Card image — front of invitation */}
          <ImageUploadField
            label="Card Image (Front)"
            value={form.cardImageUrl}
            previewUrl={form.cardImagePreviewUrl}
            onChange={(url) => setForm((f) => ({ ...f, cardImageUrl: url, cardImageFile: null, cardImagePreviewUrl: "" }))}
            onFileSelect={(file, previewUrl) => {
              setCardImageScale(100);
              setForm((f) => ({ ...f, cardImageFile: file, cardImagePreviewUrl: previewUrl, cardImageUrl: file ? "" : f.cardImageUrl }));
            }}
          />
          <ImageScaleControl
            label="Card Image"
            previewUrl={form.cardImagePreviewUrl}
            scale={cardImageScale}
            onScaleChange={setCardImageScale}
          />

          {/* Envelope image — background */}
          <ImageUploadField
            label="Background / Envelope Image"
            value={form.envelopeImageUrl}
            previewUrl={form.envelopeImagePreviewUrl}
            onChange={(url) => setForm((f) => ({ ...f, envelopeImageUrl: url, envelopeImageFile: null, envelopeImagePreviewUrl: "" }))}
            onFileSelect={(file, previewUrl) => {
              setEnvelopeImageScale(100);
              setForm((f) => ({ ...f, envelopeImageFile: file, envelopeImagePreviewUrl: previewUrl, envelopeImageUrl: file ? "" : f.envelopeImageUrl }));
            }}
          />
          <ImageScaleControl
            label="Background Image"
            previewUrl={form.envelopeImagePreviewUrl}
            scale={envelopeImageScale}
            onScaleChange={setEnvelopeImageScale}
          />

          {/* Catalog thumbnail — shown on the public catalog and home page */}
          <ImageUploadField
            label="Catalog Thumbnail (shown on catalog / home page)"
            value={form.thumbnailImageUrl}
            previewUrl={form.thumbnailImagePreviewUrl}
            onChange={(url) => setForm((f) => ({
              ...f,
              thumbnailImageUrl: url,
              thumbnailImageFile: null,
              thumbnailImagePreviewUrl: "",
              thumbnailImageChanged: true,
            }))}
            onFileSelect={(file, previewUrl) => {
              setForm((f) => ({
                ...f,
                thumbnailImageFile: file,
                thumbnailImagePreviewUrl: previewUrl,
                thumbnailImageUrl: file ? "" : f.thumbnailImageUrl,
                thumbnailImageChanged: true,
              }));
            }}
          />

          {/* Opening animation */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Opening Animation</label>
            <select
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              value={form.openingAnimation}
              onChange={(e) => set("openingAnimation")(e.target.value)}
            >
              {ANIMATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Open button text */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Open Button Text</label>
            <input
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-center font-medium"
              placeholder="OPEN"
              value={form.openButtonText}
              onChange={(e) => set("openButtonText")(e.target.value)}
            />
          </div>

          {/* Typography */}
          <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div>
              <p className="text-xs font-semibold text-foreground">Typography</p>
              <p className="mt-1 text-xs text-muted-foreground">
                These values control the couple names and invitation body text in the editor and live invitation.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name Font</label>
                <select
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  value={form.nameFontFamily}
                  style={{ fontFamily: form.nameFontFamily }}
                  onChange={(e) => set("nameFontFamily")(e.target.value)}
                >
                  {SCRIPT_FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Body Font</label>
                <select
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  value={form.bodyFontFamily}
                  style={{ fontFamily: form.bodyFontFamily }}
                  onChange={(e) => set("bodyFontFamily")(e.target.value)}
                >
                  {BODY_FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Name Font Size — {form.nameFontSize || 38}px
                <input
                  type="range"
                  min="20"
                  max="70"
                  value={Number(form.nameFontSize) || 38}
                  onChange={(e) => set("nameFontSize")(e.target.value)}
                  className="mt-2 w-full accent-primary"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Section Title Size — {form.badgeFontSize || 24}px
                <input
                  type="range"
                  min="12"
                  max="60"
                  value={Number(form.badgeFontSize) || 24}
                  onChange={(e) => set("badgeFontSize")(e.target.value)}
                  className="mt-2 w-full accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Colours */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-foreground">Theme Colours</p>
            <ColorRow label="Script Font Color — Couple names" value={form.nameColor} onChange={set("nameColor")} />
            <ColorRow label="Button / Open Button — Primary button & accents" value={form.colorPrimary} onChange={set("colorPrimary")} />
            <ColorRow label="Secondary — Supporting controls and highlights" value={form.colorSecondary} onChange={set("colorSecondary")} />
            <ColorRow label="Card Panel — Inner panels" value={form.colorCard} onChange={set("colorCard")} />
            <ColorRow label="Background — Page background" value={form.colorBackground} onChange={set("colorBackground")} />
            <ColorRow label="Accent — Soft highlights" value={form.colorAccent} onChange={set("colorAccent")} />
          </div>

          {/* Music */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-foreground">Background Music</p>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Music URL</label>
              <input className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="/music/spb.mp3" value={form.musicUrl} onChange={(e) => set("musicUrl")(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Song Title</label>
                <input className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Song Title" value={form.musicTitle} onChange={(e) => set("musicTitle")(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Artis</label>
                <input className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Exist" value={form.musicArtist} onChange={(e) => set("musicArtist")(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-border px-6 py-5 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving..." : mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Designs Tab ───────────────────────────────────────────────────────────────

function DesignsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<(DesignFormData & { id: number }) | null>(null);
  const qc = useQueryClient();
  const { data: designs = [], isLoading, isError, refetch } = useListDesigns();
  const { mutate: activate, isPending: activating } = useActivateDesign({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDesignsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetActiveDesignQueryKey() });
        toast.success("Active design updated.");
      },
      onError: () => toast.error("Failed to activate design."),
    },
  });

  const nextCode = `FL${String(designs.length + 1).padStart(3, "0")}`;

  if (showAdd) {
    return (
      <DesignForm
        mode="add"
        initial={EMPTY_FORM}
        autoCode={nextCode}
        onClose={() => setShowAdd(false)}
      />
    );
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this design?")) return;
    try {
      const res = await fetch(`${BASE}/api/design/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: getListDesignsQueryKey() });
      toast.success("Design deleted.");
    } catch {
      toast.error("Failed to delete design.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{designs.length} designs in system</p>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          <Plus size={15} />
          Add Design
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )}
      {isError && !isLoading && (
        <div className="py-12 text-center text-sm text-destructive">
          Failed to load.{" "}
          <button onClick={() => refetch()} className="underline">Try again</button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-card">
          {designs.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No designs yet. Add the first one!
            </div>
          )}
          {designs.map((d: CardDesign) => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-4">
              {/* Thumbnail */}
              <div className="h-20 w-14 shrink-0 rounded-lg overflow-hidden border border-border bg-muted relative">
                {(d.thumbnailImageUrl ?? d.cardImageUrl) ? (
                  <img
                    src={resolveImageUrl(d.thumbnailImageUrl ?? d.cardImageUrl)}
                    alt={d.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <PaintBucket size={16} className="text-muted-foreground" />
                  </div>
                )}
                {/* Color dot */}
                {d.colorPrimary && (
                  <div
                    className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow"
                    style={{ background: `hsl(${d.colorPrimary})` }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                  {d.designCode && (
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                      {d.designCode}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d.openingAnimation ?? "—"} · {d.envelopeImageUrl ? "✓ envelope" : "no envelope"}
                </p>
                {d.isActive && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={10} /> Active
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!d.isActive && (
                  <button
                    type="button"
                    disabled={activating}
                    onClick={() => activate({ id: d.id })}
                    className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    <Circle size={10} /> Activate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditTarget({
                    id: d.id,
                    name: d.name ?? "",
                    designCode: d.designCode ?? "",
                    cardImageUrl: d.cardImageUrl ?? "",
                    thumbnailImageUrl: d.thumbnailImageUrl ?? "",
                    thumbnailImagePreviewUrl: resolveImageUrl(d.thumbnailImageUrl ?? "") ?? "",
                     thumbnailImageChanged: false,
                    envelopeImageUrl: d.envelopeImageUrl ?? "",
                    openingAnimation: d.openingAnimation ?? "doors",
                    nameFontFamily: d.nameFontFamily ?? d.fontHeading ?? "Dancing Script",
                    bodyFontFamily: d.fontBody ?? "Poppins",
                    nameFontSize: d.nameFontSize ?? "38",
                    badgeFontSize: d.badgeFontSize ?? "24",
                    colorPrimary: d.colorPrimary ?? "",
                    colorSecondary: d.colorSecondary ?? "",
                    colorAccent: d.colorAccent ?? "",
                    colorBackground: d.colorBackground ?? "",
                    colorCard: d.colorCard ?? "",
                    nameColor: d.nameColor ?? "",
                    musicUrl: d.musicUrl ?? "",
                    musicTitle: d.musicTitle ?? "",
                    musicArtist: d.musicArtist ?? "",
                    openButtonText: d.openButtonText ?? "OPEN",
                  })}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editTarget && (
        <DesignForm
          mode="edit"
          initial={editTarget}
          autoCode={editTarget.designCode || nextCode}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

// ── Raw Card Tab ──────────────────────────────────────────────────────────────

interface RawFormData {
  name: string;
  category: string;
  path: string;
  pathFile?: File | null;
  pathPreviewUrl?: string;
}

const EMPTY_FORM_RAW: RawFormData = {
  name: "", category: "", path: "",
};

function RawCardForm({
  initial, autoCode, mode, onClose, onSuccess,
}: {
  initial: RawFormData;
  autoCode: string;
  mode: "add" | "edit";
  editId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<RawFormData>({ ...initial });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const set = (key: keyof RawFormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Design name is required."); return; }
    if (mode === "add" && !form.pathFile) { toast.error("An image is required for a new card."); return; }
    
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("category", form.category || "wedding");
      
      // For new cards, file is required; for updates, file is optional
      if (form.pathFile) {
        fd.append("file", form.pathFile);
      }

      const url = mode === "add"
        ? `${BASE}/api/raw-card`
        : `${BASE}/api/raw-card/${(initial as RawFormData & { id?: number }).id}`;
      const method = mode === "add" ? "POST" : "PATCH";
      
      const res = await fetch(url, {
        method,
        credentials: "include",
        body: fd,
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to save.");
      }
      
      await qc.invalidateQueries({ queryKey: getListDesignsQueryKey() });
      toast.success(mode === "add" ? "Card added successfully!" : "Card updated!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">
            {mode === "add" ? "Add New Card" : "Edit Card"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Card Name *</label>
            <input
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Garden Floral Premium"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              required
            />
          </div>

          {/* Card image */}
          <ImageUploadField
            label="Raw Kad"
            value={form.path}
            previewUrl={form.pathPreviewUrl}
            onChange={(url) => setForm((f) => ({ ...f, path: url, pathFile: null, pathPreviewUrl: "" }))}
            onFileSelect={(file, previewUrl) => setForm((f) => ({ ...f, pathFile: file, pathPreviewUrl: previewUrl, path: file ? "" : f.path }))}
          />

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving..." : mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

const CARDS_PER_PAGE = 10;

function RawCardTab() {
  const [cards, setCards] = useState<RawCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const refreshCards = React.useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`${BASE}/api/cards`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load card list");
      const data = (await res.json()) as RawCard[];
      setCards(data);
      setPage(1);
    } catch {
      setError("Failed to load card list.");
    }
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this card?")) return;
    try {
      const res = await fetch(`${BASE}/api/raw-card/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      await refreshCards();
      toast.success("Card deleted.");
    } catch {
      toast.error("Failed to delete card.");
    }
  }

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${BASE}/api/cards`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load card list");
        const data = (await res.json()) as RawCard[];
        if (alive) setCards(data);
      } catch {
        if (alive) setError("Failed to load card list.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = cards.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);
  const nextCode = `FL${String(cards.length + 1).padStart(3, "0")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${cards.length} cards in system`}
        </p>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          <Plus size={15} />
          Add New Card
        </button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No cards in the database.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 px-5 py-2.5 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Imej</span>
              <span>Info</span>
              <span>ID</span>
              <span>Actions</span>
            </div>
            {visible.map((card) => (
              <div key={card.id} className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 px-5 py-4">
                {/* Thumbnail */}
                <div className="h-14 w-10 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                  {card.path ? (
                    <img
                      src={resolveImageUrl(card.path)}
                      alt={card.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">—</div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{card.path}</p>
                  <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    {card.category}
                  </span>
                </div>

                {/* ID */}
                <span className="text-xs font-mono text-muted-foreground shrink-0">#{card.id}</span>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(card.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-muted/30">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              ← Previous
            </button>
            <p className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage}</span> / {totalPages}
            </p>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      {showAdd && (
        <RawCardForm
          mode="add"
          initial={EMPTY_FORM_RAW}
          autoCode={nextCode}
          onClose={() => setShowAdd(false)}
          onSuccess={refreshCards}
        />
      )}
      {/* Todo: Only allow edit name, not image. Image either add or delete */}
      {/* {editTarget && (
        <RawCardForm
          mode="edit"
          initial={editTarget}
          autoCode={editTarget.designCode || nextCode}
          onClose={() => setEditTarget(null)}
        />
      )} */}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | undefined; color: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value === undefined ? "—" : value}</p>
      </div>
    </div>
  );
}

interface AdminReview {
  id: number;
  customerName: string;
  rating: number;
  reviewText: string;
  weddingDate?: string | null;
  status: string;
  createdAt: string;
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`${BASE}/api/admin/reviews${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: number, status: string) {
    try {
      const res = await fetch(`${BASE}/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Review ${status}.`);
      await load();
    } catch {
      toast.error("Failed to update review.");
    }
  }

  async function deleteReview(id: number) {
    if (!confirm("Delete this review?")) return;
    try {
      const res = await fetch(`${BASE}/api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Review deleted.");
      await load();
    } catch {
      toast.error("Failed to delete review.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Loading…</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No reviews found.</div>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
          {reviews.map((r) => (
            <div key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{r.customerName}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "rejected" ? "bg-rose-100 text-rose-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {r.status === "approved" && <CheckCircle2 size={11} />}
                      {r.status === "rejected" && <X size={11} />}
                      {r.status === "pending" && <Circle size={11} />}
                      {r.status[0].toUpperCase() + r.status.slice(1)}
                    </span>
                    {r.weddingDate && <span className="text-xs text-muted-foreground">{r.weddingDate}</span>}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground mt-2 leading-relaxed">“{r.reviewText}”</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(r.id, "approved")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-rose-100 text-rose-600 hover:bg-rose-200"
                    >
                      <X size={12} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone = ["PAID", "ACTIVE", "APPROVED"].includes(value)
    ? "bg-emerald-100 text-emerald-700"
    : ["FAILED", "EXPIRED", "REFUNDED", "DISABLED"].includes(value)
    ? "bg-rose-100 text-rose-700"
    : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${tone}`}>{value}</span>;
}

function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [invitationStatus, setInvitationStatus] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [patchingPayment, setPatchingPayment] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ search, paymentStatus, invitationStatus }).toString();
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`${BASE}/api/admin/orders?${query}`, { credentials: "include", cache: "no-store" }),
        fetch(`${BASE}/api/admin/orders/stats`, { credentials: "include", cache: "no-store" }),
      ]);
      if (!ordersRes.ok || !statsRes.ok) throw new Error("Unable to load orders");
      setOrders(await ordersRes.json());
      setStats(await statsRes.json());
    } catch { toast.error("Failed to load orders."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, paymentStatus, invitationStatus]);

  const handlePatchPaymentStatus = async (order: AdminOrder, newStatus: "PAID" | "EXPIRED") => {
    setPatchingPayment(true);
    try {
      const res = await fetch(`${BASE}/api/admin/orders/${order.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update payment status");
      toast.success(`Payment status set to ${newStatus}.`);
      await load();
      setSelected(null);
    } catch {
      toast.error("Failed to update payment status.");
    } finally {
      setPatchingPayment(false);
    }
  };

  const handleToggleWebsiteStatus = async (order: AdminOrder) => {
    if (!order.invitation) return;
    const currentStatus = order.invitation.websiteStatus;
    const newStatus = currentStatus === "DISABLED" ? "ACTIVE" : "DISABLED";
    setTogglingStatus(true);
    try {
      const res = await fetch(`${BASE}/api/admin/invitations/${order.invitation.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update website status");
      toast.success(`Website ${newStatus === "ACTIVE" ? "activated" : "disabled"}.`);
      await load();
      // Refresh the selected order state
      setSelected(null);
    } catch {
      toast.error("Failed to update website status.");
    } finally {
      setTogglingStatus(false);
    }
  };

  const statsCards = [
    ["Total Orders", stats?.totalOrders ?? 0, ShoppingBag],
    ["Successful Payments", stats?.successfulPayments ?? 0, CheckCircle2],
    ["Pending Payments", stats?.pendingPayments ?? 0, Circle],
    ["Active Websites", stats?.activeWebsites ?? 0, ExternalLink],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statsCards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <Icon size={14} className="mb-1.5 text-primary" />
            <p className="text-xl font-semibold leading-none">{value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <div className="relative min-w-[220px] flex-1">
          <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, name or email..." className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs">
          <option value="">All payments</option><option>PENDING</option><option>PAID</option><option>FAILED</option><option>EXPIRED</option><option>REFUNDED</option>
        </select>
        <select value={invitationStatus} onChange={(e) => setInvitationStatus(e.target.value)} className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs">
          <option value="">All websites</option><option>PREVIEW</option><option>ACTIVE</option><option>DISABLED</option><option>EXPIRED</option>
        </select>
        <button onClick={load} className="rounded-lg border border-border px-2.5 text-xs hover:bg-muted"><RefreshCw size={13} /></button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {loading ? <div className="py-16 text-center text-sm text-muted-foreground">Loading orders…</div> : orders.length === 0 ? (
          <div className="py-16 text-center"><ShoppingBag size={28} className="mx-auto mb-3 text-muted-foreground/50" /><p className="text-sm font-medium">No orders yet</p><p className="mt-1 text-xs text-muted-foreground">Orders will appear here when payment is connected.</p></div>
        ) : (
          <table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground"><tr>{["Order ID","Customer","Design / Package","Amount","Payment","Website","Order date"].map((x) => <th key={x} className="px-2.5 py-2 font-medium">{x}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">{orders.map((order) => <tr key={order.id} onClick={() => setSelected(order)} className="cursor-pointer hover:bg-muted/40">
              <td className="px-2.5 py-2 font-mono text-[11px]">#{order.id}</td><td className="px-2.5 py-2"><p className="font-medium">{order.customer?.name ?? "Unknown"}</p><p className="text-[10px] text-muted-foreground">{order.customer?.email}</p></td>
              <td className="px-2.5 py-2"><p>{order.invitation ? `${order.invitation.brideName} & ${order.invitation.groomName}` : "—"}</p><p className="text-[10px] text-muted-foreground">{order.package?.name ?? "—"}</p></td>
              <td className="px-2.5 py-2">{order.amount}</td><td className="px-2.5 py-2"><StatusBadge value={order.paymentStatus} /></td><td className="px-2.5 py-2"><StatusBadge value={order.invitation?.websiteStatus ?? "DISABLED"} /></td><td className="px-2.5 py-2 text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("ms-MY")}</td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Order #{selected.id}</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p>{selected.customer?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{selected.customer?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <StatusBadge value={selected.paymentStatus} />
                <p className="mt-1">{selected.amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invitation</p>
                <p>{selected.invitation ? `${selected.invitation.brideName} & ${selected.invitation.groomName}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Package</p>
                <p>{selected.package?.name ?? "—"}</p>
              </div>
            </div>
            {!["PAID", "REFUNDED"].includes(selected.paymentStatus) && (
              <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Mark payment as</p>
                <div className="flex gap-2">
                  <button
                    disabled={patchingPayment || selected.paymentStatus === "PAID"}
                    onClick={() => void handlePatchPaymentStatus(selected, "PAID")}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                  >
                    {patchingPayment ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Mark Paid
                  </button>
                  <button
                    disabled={patchingPayment || selected.paymentStatus === "EXPIRED"}
                    onClick={() => void handlePatchPaymentStatus(selected, "EXPIRED")}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/60 disabled:opacity-40 transition-colors"
                  >
                    {patchingPayment ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                    Mark Expired
                  </button>
                </div>
              </div>
            )}
            {selected.invitation && (
              <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Website Status</p>
                    <StatusBadge value={selected.invitation.websiteStatus} />
                  </div>
                  <button
                    disabled={togglingStatus}
                    onClick={() => handleToggleWebsiteStatus(selected)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-40 ${
                      selected.invitation.websiteStatus === "DISABLED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    {togglingStatus ? <Loader2 size={12} className="animate-spin" /> : selected.invitation.websiteStatus === "DISABLED" ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                    {selected.invitation.websiteStatus === "DISABLED" ? "Activate" : "Disable"}
                  </button>
                </div>
                <div className="flex gap-2">
                   {publicInvitePath(selected.invitation) ? (
                     <a className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-sm text-primary-foreground" href={publicInvitePath(selected.invitation) ?? undefined} target="_blank" rel="noreferrer">View Website</a>
                   ) : (
                     <button disabled title="Enter both Cover names and the event date first" className="flex-1 cursor-not-allowed rounded-xl bg-muted px-3 py-2 text-center text-sm text-muted-foreground">View Website</button>
                   )}
                   <button
                     className="rounded-xl border border-border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                     disabled={!publicInvitePath(selected.invitation)}
                     onClick={() => {
                       const path = publicInvitePath(selected.invitation!);
                       if (path) void navigator.clipboard.writeText(`${window.location.origin}${path}`);
                     }}
                   >
                     Copy Link
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`${BASE}/api/admin/customers?search=${encodeURIComponent(search)}`, { credentials: "include", cache: "no-store" })
        .then((res) => res.ok ? res.json() : Promise.reject(new Error()))
        .then(setCustomers).catch(() => toast.error("Failed to load customers.")).finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [search]);
  const updateRole = async (customer: AdminCustomer, role: "buyer" | "business_account") => {
    try {
      const response = await fetch(`${BASE}/api/admin/users/${customer.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role.");
      setCustomers((previous) => previous.map((item) => item.id === customer.id ? { ...item, role } : item));
      toast.success(role === "business_account" ? "Account promoted to Business Account." : "Account returned to Buyer.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role.");
    }
  };
  return <div className="space-y-4">
    <div className="relative"><Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer name or email..." className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20" /></div>
    <div className="overflow-x-auto rounded-xl border border-border bg-card">{loading ? <div className="py-16 text-center text-sm text-muted-foreground">Loading customers…</div> : customers.length === 0 ? <div className="py-16 text-center"><UserRound size={28} className="mx-auto mb-3 text-muted-foreground/50" /><p className="text-sm font-medium">No customer accounts yet</p><p className="mt-1 text-xs text-muted-foreground">Registered Buyer and Business Account customers will appear here.</p></div> : <table className="w-full min-w-[820px] text-left text-xs"><thead className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground"><tr>{["Customer","Role","Orders","Total paid","Websites","Registered"].map((x) => <th key={x} className="px-2.5 py-2 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y divide-border">{customers.map((customer) => <tr key={customer.id} className="hover:bg-muted/40"><td className="px-2.5 py-2"><p className="font-medium">{customer.name}</p><p className="text-[10px] text-muted-foreground">{customer.email}</p></td><td className="px-2.5 py-2"><select value={customer.role === "business_account" ? "business_account" : "buyer"} onChange={(event) => updateRole(customer, event.target.value as "buyer" | "business_account")} className="rounded-md border border-border bg-background px-2 py-1 text-[11px]"><option value="buyer">Buyer</option><option value="business_account">Business Account</option></select></td><td className="px-2.5 py-2">{customer.totalOrders}</td><td className="px-2.5 py-2">{customer.totalPaid.toFixed(2)}</td><td className="px-2.5 py-2">{customer.websites.length}</td><td className="px-2.5 py-2 text-[10px] text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString("ms-MY")}</td></tr>)}</tbody></table>}</div>
  </div>;
}

function RevenueTab() {
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}/api/admin/orders/stats`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unable to load revenue");
      setStats(await response.json());
    } catch {
      toast.error("Failed to load revenue report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const monthly = stats?.monthlyRevenue ?? [];
  const maxRevenue = Math.max(...monthly.map((month) => month.revenue), 1);
  const totalDailyOrders = monthly.reduce((sum, month) => sum + month.totalOrders, 0);
  const money = (value: number) => `RM ${value.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" />Loading revenue report…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Revenue Report</h2>
          <p className="text-xs text-muted-foreground">Payment performance for the last 12 months</p>
        </div>
        <button onClick={() => void load()} className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted" aria-label="Refresh revenue report">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <DollarSign size={14} className="mb-1.5 text-emerald-600" />
          <p className="text-xl font-semibold leading-none">{money(stats?.totalRevenue ?? 0)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <ShoppingBag size={14} className="mb-1.5 text-primary" />
          <p className="text-xl font-semibold leading-none">{stats?.totalOrders ?? 0}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Total Orders</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-card p-3 sm:col-span-1">
          <CheckCircle2 size={14} className="mb-1.5 text-emerald-600" />
          <p className="text-xl font-semibold leading-none">{stats?.successfulPayments ?? 0}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Successful Orders</p>
        </div>
      </div>

      {stats?.packageOrderStats && stats.packageOrderStats.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingBag size={15} className="text-primary" />
            <h3 className="text-sm font-semibold">Orders by Package</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {stats.packageOrderStats.map((pkg) => (
              <div key={pkg.packageId ?? "unassigned"} className="rounded-xl border border-border bg-card p-3">
                <p className="truncate text-xs font-medium" title={pkg.packageName}>{pkg.packageName}</p>
                <p className="mt-2 text-xl font-semibold leading-none">{pkg.totalOrders}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Orders</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span>{pkg.successfulOrders} successful</span>
                  <span className="font-medium text-primary">{money(pkg.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={15} className="text-primary" />
          <h3 className="text-sm font-semibold">Monthly Revenue</h3>
        </div>
        {monthly.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No order data available yet.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {monthly.map((month) => (
              <div key={month.month} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpandedMonth((current) => current === month.month ? null : month.month)}
                  className="grid w-full grid-cols-[minmax(115px,1fr)_80px_minmax(112px,auto)_18px] items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/40"
                  aria-expanded={expandedMonth === month.month}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <CalendarDays size={12} className="text-muted-foreground" />
                    {month.label}
                  </span>
                  <span className="text-right text-muted-foreground">{month.totalOrders} orders</span>
                  <span className="text-right font-semibold text-primary">{money(month.revenue)}</span>
                  <span className="text-muted-foreground">{expandedMonth === month.month ? "⌃" : "⌄"}</span>
                </button>
                {expandedMonth === month.month && (
                  <div className="border-t border-border bg-muted/10">
                    <div className="grid grid-cols-[minmax(115px,1fr)_80px_80px_minmax(112px,auto)] gap-2 border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <span>Date</span>
                      <span className="text-right">Orders</span>
                      <span className="text-right">Successful</span>
                      <span className="text-right text-primary">Total Revenue</span>
                    </div>
                    {month.dailyRevenue.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">No orders in this month.</p>
                    ) : (
                      month.dailyRevenue.map((day) => (
                        <div key={day.date} className="grid grid-cols-[minmax(115px,1fr)_80px_80px_minmax(112px,auto)] gap-2 border-b border-border/70 px-3 py-2 text-xs last:border-b-0">
                          <span>{day.label}</span>
                          <span className="text-right text-muted-foreground">{day.totalOrders}</span>
                          <span className="text-right text-muted-foreground">{day.successfulOrders}</span>
                          <span className="text-right font-medium text-primary">{money(day.revenue)}</span>
                        </div>
                      ))
                    )}
                    <div className="grid grid-cols-[minmax(115px,1fr)_80px_80px_minmax(112px,auto)] gap-2 border-t border-border bg-muted/20 px-3 py-2.5 text-xs font-semibold">
                      <span>MONTH TOTAL</span>
                      <span className="text-right">{month.totalOrders}</span>
                      <span className="text-right">{month.successfulOrders}</span>
                      <span className="text-right text-primary">{money(month.revenue)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="grid grid-cols-[minmax(115px,1fr)_80px_minmax(112px,auto)] gap-2 bg-muted/20 px-3 py-2.5 text-xs font-semibold">
              <span>TOTAL</span>
              <span className="text-right">{totalDailyOrders}</span>
              <span className="text-right text-primary">{money(stats?.totalRevenue ?? 0)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={15} className="text-primary" />
          <h3 className="text-sm font-semibold">How this is calculated</h3>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Revenue and successful orders include only orders marked <strong>PAID</strong>.
          Revenue is grouped by the payment date; orders without a payment date use their order date.
        </p>
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [, navigate] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate(`/admin/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      } else if (user.role !== "admin") {
        navigate(dashboardPathForUser(user));
        toast.error("Admin access only.");
      }
    }
  }, [user, authLoading, navigate]);

  const isAdmin = !authLoading && user?.role === "admin";
  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-page min-h-[100dvh] bg-white px-4 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl text-foreground">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Orders, Customers &amp; Card Design Management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Back to home"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-colors hover:opacity-80"
            aria-label="Log out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border overflow-x-auto">
        {([["orders", "Orders"], ["revenue", "Revenue"], ["customers", "Customers"], ["designs", "Card Designs"], ["reviews", "Reviews"], ["pricing", "Pricing"], ["demo", "Live Demo"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === "demo") navigate("/admin/demo");
              else setTab(key);
            }}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "designs" && <DesignsTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "pricing" && <PricingTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "revenue" && <RevenueTab />}
      {tab === "customers" && <CustomersTab />}
      </div>
    </div>
  );
}
