import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, Check, X, Loader2,
  MessageSquareHeart, Phone, MapPin, CalendarDays, Timer, Music, Images, Gift, Shirt, Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  useListAdminPricing,
  useCreatePricingPackage,
  useUpdatePricingPackage,
  useDeletePricingPackage,
  useCreatePricingFeature,
  useUpdatePricingFeature,
  useDeletePricingFeature,
  getListAdminPricingQueryKey,
  getListPricingQueryKey,
} from "@workspace/api-client-react";

const ICON_OPTIONS = [
  { value: "MessageSquareHeart", label: "RSVP / Wishes", Icon: MessageSquareHeart },
  { value: "Phone", label: "Contact", Icon: Phone },
  { value: "MapPin", label: "Location", Icon: MapPin },
  { value: "CalendarDays", label: "Calendar", Icon: CalendarDays },
  { value: "Timer", label: "Countdown", Icon: Timer },
  { value: "Music", label: "Music", Icon: Music },
  { value: "Images", label: "Photo Gallery", Icon: Images },
  { value: "Gift", label: "Money Gift", Icon: Gift },
  { value: "GiftCorner", label: "Gift Corner", Icon: Gift },
  { value: "Shirt", label: "Dress Code", Icon: Shirt },
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "Check", label: "Check", Icon: Check },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(ICON_OPTIONS.map((o) => [o.value, o.Icon]));

function resolveIcon(name?: string | null): LucideIcon {
  return ICON_MAP[name ?? ""] ?? Check;
}

const inputCls = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background";
const textareaCls = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none";
const selectCls = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-background";
const toggleBase = "relative inline-flex h-5 w-9 items-center rounded-full transition-colors";
const toggleKnob = "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${toggleBase} ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`${toggleKnob} ${checked ? "translate-x-5" : "translate-x-1"}`} />
      </button>
      <span className="text-xs text-muted-foreground">{label}</span>
    </label>
  );
}

interface PackageFormData {
  id?: number;
  name: string;
  price: string;
  businessPrice: string;
  description: string;
  badgeText: string;
  showBadge: boolean;
  isFeatured: boolean;
  isActive: boolean;
  formConfigJson: string;
  promoPrice: string;
  promoStartDate: string;
  promoEndDate: string;
}

interface FeatureFormData {
  id?: number;
  packageId?: number;
  name: string;
  icon: string;
}

function PackageModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: PackageFormData;
  onClose: () => void;
  onSave: (data: PackageFormData) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<PackageFormData>({ ...initial });
  const title = initial.id ? "Edit Package" : "Add Package";

  const set = (key: keyof PackageFormData) => (v: PackageFormData[typeof key]) => setForm((f) => ({ ...f, [key]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Package Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Standard" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Harga Buyer (RM) *</label>
              <input className={inputCls} value={form.price} onChange={(e) => set("price")(e.target.value)} placeholder="e.g. 55" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Harga Business (RM)</label>
              <input className={inputCls} value={form.businessPrice} onChange={(e) => set("businessPrice")(e.target.value)} placeholder="e.g. 45" />
              <p className="text-[10px] text-muted-foreground mt-1">Dipaparkan kepada Business Account</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea className={textareaCls} rows={2} value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Short description..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Badge Text</label>
            <input className={inputCls} value={form.badgeText} onChange={(e) => set("badgeText")(e.target.value)} placeholder="e.g. Most Popular" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Toggle label="Show Badge" checked={form.showBadge} onChange={(v) => set("showBadge")(v)} />
            <Toggle label="Featured" checked={form.isFeatured} onChange={(v) => set("isFeatured")(v)} />
            <Toggle label="Active" checked={form.isActive} onChange={(v) => set("isActive")(v)} />
          </div>
          {/* Promotion */}
          <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
            <p className="text-xs font-semibold text-foreground">Promosi (optional)</p>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Harga Promosi (RM)</label>
              <input className={inputCls} type="number" min="0" step="1" value={form.promoPrice} onChange={(e) => set("promoPrice")(e.target.value)} placeholder="e.g. 49" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tarikh Mula</label>
                <input className={inputCls} type="date" value={form.promoStartDate} onChange={(e) => set("promoStartDate")(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tarikh Tamat</label>
                <input className={inputCls} type="date" value={form.promoEndDate} onChange={(e) => set("promoEndDate")(e.target.value)} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Kosongkan Harga Promosi untuk remove promosi. Jika tiada tarikh, promosi aktif selama mana Harga Promosi diisi.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Business customer form configuration</label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Configure the fields shown after a Business Account selects this package.
            </p>
            <textarea
              className={`${textareaCls} font-mono text-xs`}
              rows={10}
              value={form.formConfigJson}
              onChange={(e) => set("formConfigJson")(e.target.value)}
              spellCheck={false}
              placeholder={'{"fields":[],"hiddenFields":{}}'}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button
            type="button"
            disabled={saving || !form.name.trim() || !form.price.trim()}
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: FeatureFormData;
  onClose: () => void;
  onSave: (data: FeatureFormData) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FeatureFormData>({ ...initial });
  const title = initial.id ? "Edit Feature" : "Add Feature";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Feature Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Photo Gallery" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Icon</label>
            <select className={selectCls} value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button
            type="button"
            disabled={saving || !form.name.trim()}
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingTab() {
  const qc = useQueryClient();
  const { data: packages = [], isLoading } = useListAdminPricing();
  const sortedPackages = useMemo(() => [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [packages]);

  const [packageModal, setPackageModal] = useState<PackageFormData | null>(null);
  const [featureModal, setFeatureModal] = useState<FeatureFormData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "package" | "feature"; id: number; packageId?: number } | null>(null);

  const createPackage = useCreatePricingPackage();
  const updatePackage = useUpdatePricingPackage();
  const deletePackage = useDeletePricingPackage();
  const createFeature = useCreatePricingFeature();
  const updateFeature = useUpdatePricingFeature();
  const deleteFeature = useDeletePricingFeature();

  const anyLoading = createPackage.isPending || updatePackage.isPending || deletePackage.isPending || createFeature.isPending || updateFeature.isPending || deleteFeature.isPending;

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListAdminPricingQueryKey() });
    qc.invalidateQueries({ queryKey: getListPricingQueryKey() });
  }

  async function handleSavePackage(form: PackageFormData) {
    try {
      const payload = {
        name: form.name.trim(),
        price: form.price.trim(),
        businessPrice: form.businessPrice.trim() || null,
        description: form.description.trim(),
        badgeText: form.badgeText.trim(),
        showBadge: form.showBadge,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        promoPrice: form.promoPrice.trim() || null,
        promoStartDate: form.promoStartDate || null,
        promoEndDate: form.promoEndDate || null,
        formConfig: (() => {
        try {
          return JSON.parse(form.formConfigJson);
        } catch {
          throw new Error("Customer form configuration must be valid JSON.");
        }
        })(),
      };
      if (form.id) {
        await updatePackage.mutateAsync({ id: form.id, data: payload });
        toast.success("Package updated");
      } else {
        await createPackage.mutateAsync({ data: payload });
        toast.success("Package created");
      }
      setPackageModal(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save package");
    }
  }

  async function handleDeletePackage() {
    if (!deleteConfirm || deleteConfirm.type !== "package") return;
    try {
      await deletePackage.mutateAsync({ id: deleteConfirm.id });
      toast.success("Package deleted");
      invalidate();
    } catch {
      toast.error("Failed to delete package");
    } finally {
      setDeleteConfirm(null);
    }
  }

  async function handleSaveFeature(form: FeatureFormData) {
    if (!form.packageId) return;
    const payload = { name: form.name.trim(), icon: form.icon };
    try {
      if (form.id) {
        await updateFeature.mutateAsync({ id: form.packageId, featureId: form.id, data: payload });
        toast.success("Feature updated");
      } else {
        await createFeature.mutateAsync({ id: form.packageId, data: payload });
        toast.success("Feature created");
      }
      setFeatureModal(null);
      invalidate();
    } catch {
      toast.error("Failed to save feature");
    }
  }

  async function handleDeleteFeature() {
    if (!deleteConfirm || deleteConfirm.type !== "feature" || !deleteConfirm.packageId) return;
    try {
      await deleteFeature.mutateAsync({ id: deleteConfirm.packageId, featureId: deleteConfirm.id });
      toast.success("Feature deleted");
      invalidate();
    } catch {
      toast.error("Failed to delete feature");
    } finally {
      setDeleteConfirm(null);
    }
  }

  async function reorderPackages(id: number, direction: "up" | "down") {
    const idx = sortedPackages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedPackages.length) return;
    const current = sortedPackages[idx];
    const swap = sortedPackages[swapIdx];
    try {
      await updatePackage.mutateAsync({ id: current.id, data: { sortOrder: swap.sortOrder } });
      await updatePackage.mutateAsync({ id: swap.id, data: { sortOrder: current.sortOrder } });
      invalidate();
    } catch {
      toast.error("Failed to reorder packages");
    }
  }

  async function reorderFeatures(packageId: number, id: number, direction: "up" | "down") {
    const pkg = sortedPackages.find((p) => p.id === packageId);
    if (!pkg) return;
    const features = [...(pkg.features ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = features.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= features.length) return;
    const current = features[idx];
    const swap = features[swapIdx];
    try {
      await updateFeature.mutateAsync({ id: packageId, featureId: current.id, data: { sortOrder: swap.sortOrder } });
      await updateFeature.mutateAsync({ id: packageId, featureId: swap.id, data: { sortOrder: current.sortOrder } });
      invalidate();
    } catch {
      toast.error("Failed to reorder features");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Loading pricing packages…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-foreground">Pricing Packages</h2>
          <p className="text-xs text-muted-foreground">Manage packages and features shown on the public price list.</p>
        </div>
        <button
          onClick={() => setPackageModal({
            name: "", price: "", businessPrice: "", description: "", badgeText: "", showBadge: false,
            isFeatured: false, isActive: true, formConfigJson: '{"fields":[],"hiddenFields":{}}',
            promoPrice: "", promoStartDate: "", promoEndDate: "",
          })}
          disabled={anyLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> Add Package
        </button>
      </div>

      {sortedPackages.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground rounded-2xl border border-border bg-card">
          No pricing packages yet. Click “Add Package” to create one.
        </div>
      )}

      {sortedPackages.map((pkg) => {
        const features = [...(pkg.features ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return (
          <div key={pkg.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                  {pkg.showBadge && pkg.badgeText && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-[#3d5a3e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles size={9} /> {pkg.badgeText}
                    </span>
                  )}
                  {pkg.isFeatured && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Featured</span>}
                  {!pkg.isActive && <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">Buyer:</span>{" "}
                  {(pkg as any).promoPrice
                    ? <><s>RM{pkg.price}</s> → <span className="text-[#3d5a3e] font-medium">RM{(pkg as any).promoPrice}</span>{(pkg as any).promoStartDate || (pkg as any).promoEndDate ? ` (${(pkg as any).promoStartDate ?? "?"} – ${(pkg as any).promoEndDate ?? "?"})` : " (aktif)"}</>
                    : <>RM{pkg.price}</>
                  }
                  {(pkg as any).businessPrice && (
                    <> · <span className="font-medium text-foreground">Business:</span> RM{(pkg as any).businessPrice}</>
                  )}
                  {" · "}{pkg.description || "No description"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => reorderPackages(pkg.id, "up")}
                  disabled={anyLoading}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  title="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => reorderPackages(pkg.id, "down")}
                  disabled={anyLoading}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  title="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => setPackageModal({
                    id: pkg.id,
                    name: pkg.name,
                    price: pkg.price,
                    businessPrice: (pkg as any).businessPrice ?? "",
                    description: pkg.description ?? "",
                    badgeText: pkg.badgeText ?? "",
                    showBadge: pkg.showBadge,
                    isFeatured: pkg.isFeatured,
                    isActive: pkg.isActive,
                    formConfigJson: JSON.stringify(pkg.formConfig ?? { fields: [], hiddenFields: {} }, null, 2),
                    promoPrice: (pkg as any).promoPrice ?? "",
                    promoStartDate: (pkg as any).promoStartDate ?? "",
                    promoEndDate: (pkg as any).promoEndDate ?? "",
                  })}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title="Edit package"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: "package", id: pkg.id })}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  title="Delete package"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="px-5 py-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Features</p>
                <button
                  onClick={() => setFeatureModal({ packageId: pkg.id, name: "", icon: "Check" })}
                  disabled={anyLoading}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  <Plus size={12} /> Add Feature
                </button>
              </div>

              {features.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No features yet.</p>
              ) : (
                <div className="space-y-1">
                  {features.map((feature) => {
                    const FeatureIcon = resolveIcon(feature.icon);
                    return (
                      <div key={feature.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border">
                        <span className="flex items-center gap-2 text-sm text-foreground">
                          <FeatureIcon size={14} className="text-muted-foreground" />
                          {feature.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => reorderFeatures(pkg.id, feature.id, "up")}
                            disabled={anyLoading}
                            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                            title="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => reorderFeatures(pkg.id, feature.id, "down")}
                            disabled={anyLoading}
                            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                            title="Move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => setFeatureModal({ id: feature.id, packageId: pkg.id, name: feature.name, icon: feature.icon })}
                            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                            title="Edit feature"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: "feature", id: feature.id, packageId: pkg.id })}
                            className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors"
                            title="Delete feature"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {packageModal && (
        <PackageModal
          initial={packageModal}
          onClose={() => setPackageModal(null)}
          onSave={handleSavePackage}
          saving={updatePackage.isPending || createPackage.isPending}
        />
      )}

      {featureModal && (
        <FeatureModal
          initial={featureModal}
          onClose={() => setFeatureModal(null)}
          onSave={handleSaveFeature}
          saving={updateFeature.isPending || createFeature.isPending}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-background rounded-3xl shadow-2xl p-6">
            <h2 className="text-base font-semibold mb-2">Confirm Delete</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={deleteConfirm.type === "package" ? handleDeletePackage : handleDeleteFeature}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
