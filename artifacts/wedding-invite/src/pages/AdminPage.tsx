import React, { useState, useRef, useEffect } from "react";
import {
  useListRsvps,
  useGetRsvpCount,
  useListDesigns,
  useActivateDesign,
  CardDesign,
} from "@workspace/api-client-react";
import {
  Users, UserCheck, UserX, CalendarHeart, Loader2, RefreshCw,
  PaintBucket, Plus, CheckCircle2, Circle, Trash2, X, Upload,
  Pencil, Copy, Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDesignsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
import { resolveImageUrl } from "@/lib/r2-url";

type Tab = "rsvp" | "designs" | "rawcard";

type RawCard = {
  id: number;
  name: string;
  path: string;
  category: string;
  publicUrl?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function hslToHex(hslStr: string): string {
  const parts = (hslStr || "0 0% 0%").trim().split(/\s+/);
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat((parts[1] || "0").replace("%", "")) / 100;
  const l = parseFloat((parts[2] || "0").replace("%", "")) / 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
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

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json() as { url: string };
  return data.url;
}

// ── Colour Picker Row ─────────────────────────────────────────────────────────

function ColorRow({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative w-7 h-7 rounded-full border border-border overflow-hidden shadow-sm cursor-pointer shrink-0 hover:scale-110 transition-transform">
        <div className="absolute inset-0" style={{ background: value ? `hsl(${value})` : "#e5e7eb" }} />
        <input
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          value={value ? hslToHex(value) : "#aaaaaa"}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
        />
      </label>
      <div className="flex-1">
        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{label}</p>
        <input
          className="w-full rounded-lg border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30 bg-background font-mono"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
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

interface DesignFormData {
  name: string;
  designCode: string;
  cardImageUrl: string;
  cardImageFile?: File | null;
  cardImagePreviewUrl?: string;
  envelopeImageUrl: string;
  envelopeImageFile?: File | null;
  envelopeImagePreviewUrl?: string;
  openingAnimation: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorCard: string;
  musicUrl: string;
  musicTitle: string;
  musicArtist: string;
  openButtonText: string;
}

const EMPTY_FORM: DesignFormData = {
  name: "", designCode: "", cardImageUrl: "", envelopeImageUrl: "",
  openingAnimation: "doors", colorPrimary: "", colorSecondary: "",
  colorBackground: "", colorCard: "", musicUrl: "", musicTitle: "",
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

  useEffect(() => {
    fetch(`${BASE}/api/cards`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: RawCard[]) => setRawCards(data))
      .catch(() => {});
  }, []);

  const set = (key: keyof DesignFormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const buildR2Url = (path: string) => {
    const base = (import.meta.env.VITE_R2_DOMAIN_URL ?? "").replace(/\/$/, "");
    return path ? `${base}/${path.replace(/^\//, "")}` : "";
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
        cardImageUrl = await uploadFile(form.cardImageFile);
      }
      let envelopeImageUrl = form.envelopeImageUrl;
      if (form.envelopeImageFile) {
        envelopeImageUrl = await uploadFile(form.envelopeImageFile);
      }

      const payload = {
        name: form.name,
        designCode: displayCode,
        cardImageUrl,
        envelopeImageUrl,
        openingAnimation: form.openingAnimation,
        colorPrimary: form.colorPrimary,
        colorSecondary: form.colorSecondary,
        colorBackground: form.colorBackground,
        colorCard: form.colorCard,
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
      await qc.invalidateQueries({ queryKey: getListDesignsQueryKey() });
      toast.success(mode === "add" ? "Design added successfully!" : "Design updated!");
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
            {mode === "add" ? "Add New Design" : "Edit Design"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

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
            onFileSelect={(file, previewUrl) => setForm((f) => ({ ...f, cardImageFile: file, cardImagePreviewUrl: previewUrl, cardImageUrl: file ? "" : f.cardImageUrl }))}
          />

          {/* Envelope image — background */}
          <ImageUploadField
            label="Background / Envelope Image"
            value={form.envelopeImageUrl}
            previewUrl={form.envelopeImagePreviewUrl}
            onChange={(url) => setForm((f) => ({ ...f, envelopeImageUrl: url, envelopeImageFile: null, envelopeImagePreviewUrl: "" }))}
            onFileSelect={(file, previewUrl) => setForm((f) => ({ ...f, envelopeImageFile: file, envelopeImagePreviewUrl: previewUrl, envelopeImageUrl: file ? "" : f.envelopeImageUrl }))}
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

          {/* Colours */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-foreground">Theme Colours</p>
            <ColorRow label="Primary colour (button, accent)" value={form.colorPrimary} onChange={set("colorPrimary")} placeholder="142 45% 35%" />
            <ColorRow label="Secondary colour"                value={form.colorSecondary} onChange={set("colorSecondary")} placeholder="142 30% 92%" />
            <ColorRow label="Background"                      value={form.colorBackground} onChange={set("colorBackground")} placeholder="142 20% 96%" />
            <ColorRow label="Card / Panel"                    value={form.colorCard} onChange={set("colorCard")} placeholder="0 0% 100%" />
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
        toast.success("Active design updated.");
      },
      onError: () => toast.error("Failed to activate design."),
    },
  });

  const nextCode = `FL${String(designs.length + 1).padStart(3, "0")}`;

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
                {d.cardImageUrl ? (
                  <img src={resolveImageUrl(d.cardImageUrl)} alt={d.name} className="h-full w-full object-cover" />
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
                    envelopeImageUrl: d.envelopeImageUrl ?? "",
                    openingAnimation: d.openingAnimation ?? "doors",
                    colorPrimary: d.colorPrimary ?? "",
                    colorSecondary: d.colorSecondary ?? "",
                    colorBackground: d.colorBackground ?? "",
                    colorCard: d.colorCard ?? "",
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

      {showAdd && (
        <DesignForm
          mode="add"
          initial={EMPTY_FORM}
          autoCode={nextCode}
          onClose={() => setShowAdd(false)}
        />
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

// ── Admin Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("rsvp");

  const { data: rsvps, isLoading: rsvpsLoading, isError: rsvpsError, refetch: refetchRsvps } =
    useListRsvps({ query: { refetchInterval: 30_000, queryKey: [] } });
  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } =
    useGetRsvpCount({ query: { refetchInterval: 30_000, queryKey: [] } });

  const isLoading = rsvpsLoading || countsLoading;

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">RSVP &amp; Card Design Management</p>
        </div>
        {tab === "rsvp" && (
          <button
            onClick={() => { refetchRsvps(); refetchCounts(); }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {([["rsvp", "RSVP Guests"], ["designs", "Card Designs"], ["rawcard", "Raw Card"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "rsvp" && (
        <>
          <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3">
            <StatCard icon={UserCheck} label="Attending" value={counts?.attending} color="bg-emerald-100 text-emerald-700" />
            <StatCard icon={UserX} label="Not Attending" value={counts?.notAttending} color="bg-rose-100 text-rose-600" />
            <StatCard icon={CalendarHeart} label="Total Guests" value={counts?.totalGuests} color="bg-primary/10 text-primary" />
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Users size={16} className="text-muted-foreground" />
              <h2 className="font-semibold text-sm text-foreground">
                Guest List
                {rsvps && <span className="ml-2 text-muted-foreground font-normal">({rsvps.length} respons)</span>}
              </h2>
            </div>
            {rsvpsLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Loading…</span>
              </div>
            ) : rsvpsError ? (
              <div className="py-16 text-center text-sm text-destructive">Failed to load RSVPs. Please refresh.</div>
            ) : !rsvps?.length ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No RSVP responses yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {rsvps.map((rsvp) => (
                  <div key={rsvp.id} className="px-5 py-4 flex items-start gap-3">
                    <div className="mt-0.5">
                      {rsvp.attending ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <UserCheck size={11} /> Attending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                          <UserX size={11} /> Not Attending
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{rsvp.name}</p>
                      {rsvp.attending && <p className="text-xs text-muted-foreground mt-0.5">{rsvp.numberOfGuests} guests</p>}
                      {rsvp.message && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{rsvp.message}"</p>}
                    </div>
                    <p className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
                      {new Date(rsvp.createdAt).toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "designs" && <DesignsTab />}
      {tab === "rawcard" && <RawCardTab />}
    </div>
  );
}
