import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { resolveImageUrl } from "@/lib/r2-url";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type FormField = {
  key: string;
  label: string;
  type: "text" | "email" | "date" | "tel" | "url" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | boolean | number;
  validation?: { minLength?: number; maxLength?: number; pattern?: string };
};

type FormDetails = {
  businessName: string;
  logoUrl?: string | null;
  packageName: string;
  packageDescription: string;
  formConfig: { fields: FormField[] };
};

export default function CustomerFormPage() {
  const { token } = useParams<{ token: string }>();
  const [details, setDetails] = useState<FormDetails | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/business/form-shares/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "This form link is no longer available.");
        setDetails(data);
        setValues(Object.fromEntries((data.formConfig?.fields ?? []).map((field: FormField) => [
          field.key,
          field.defaultValue ?? (field.type === "checkbox" ? false : ""),
        ])));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load this form."))
      .finally(() => setLoading(false));
  }, [token]);

  const updateValue = (key: string, value: unknown) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  function updateStructuredValue(key: string, index: number, value: Record<string, string>) {
    const current = Array.isArray(values[key]) ? values[key] as Record<string, string>[] : [];
    updateValue(key, current.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item));
  }

  function addStructuredValue(key: string, value: Record<string, string>) {
    const current = Array.isArray(values[key]) ? values[key] as Record<string, string>[] : [];
    updateValue(key, [...current, value]);
  }

  async function uploadGalleryFiles(files: FileList | null, fieldKey: string) {
    if (!files || !token) return;
    const current = Array.isArray(values[fieldKey]) ? values[fieldKey] as string[] : [];
    const remaining = Math.max(0, 4 - current.length);
    if (!remaining) {
      setGalleryError("Gallery is limited to 4 images.");
      return;
    }
    setGalleryUploading(true);
    setGalleryError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(`${BASE}/api/business/form-shares/${encodeURIComponent(token)}/gallery-upload`, {
          method: "POST",
          body,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Unable to upload ${file.name}.`);
        if (typeof data.key === "string") uploaded.push(data.key);
      }
      if (uploaded.length) updateValue(fieldKey, [...current, ...uploaded].slice(0, 4));
    } catch (err: unknown) {
      setGalleryError(err instanceof Error ? err.message : "Unable to upload gallery images.");
    } finally {
      setGalleryUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${BASE}/api/business/form-shares/${encodeURIComponent(token)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerData: values }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit your details.");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit your details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#faf9f7] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          {details?.logoUrl && (
            <div className="mx-auto mb-5 flex h-24 w-40 items-center justify-center">
              <img
                src={resolveImageUrl(details.logoUrl)}
                alt={`${details.businessName || "Business"} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Wedinbytes</p>
          <h1 className="mt-3 text-3xl font-serif text-gray-900">
            {details?.businessName ? `Invitation details for ${details.businessName}` : "Customer details"}
          </h1>
          {details && (
            <p className="mt-2 text-sm text-gray-500">
              {details.packageName}{details.packageDescription ? ` · ${details.packageDescription}` : ""}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">Loading form...</div>
          ) : error && !details ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          ) : submitted ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">✓</div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Details submitted</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Your details have been sent to the event planner. They will use them to prepare your invitation.
              </p>
            </div>
          ) : details ? (
            <form onSubmit={submit} className="space-y-5">
              <div className="border-b border-gray-100 pb-5">
                <h2 className="text-lg font-semibold text-gray-900">Fill in your details</h2>
                <p className="mt-1 text-sm text-gray-500">Please provide accurate information for your digital invitation.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {details.formConfig.fields.map((field) => (
                  <label key={field.key} className={`block text-sm text-gray-700 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    <span className="mb-1.5 block font-medium">
                      {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
                    </span>
                    {field.key === "galleryImages" ? (
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          disabled={galleryUploading}
                          onChange={(event) => {
                            void uploadGalleryFiles(event.target.files, field.key);
                            event.currentTarget.value = "";
                          }}
                          className="sr-only"
                          id={`customer-gallery-${field.key}`}
                        />
                        <label htmlFor={`customer-gallery-${field.key}`} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-500">
                          {galleryUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                          {galleryUploading ? "Uploading..." : "Upload gallery images"}
                        </label>
                        <p className="text-xs text-gray-400">{Array.isArray(values[field.key]) ? (values[field.key] as string[]).length : 0}/4 images · Max 10 MB each</p>
                        {Array.isArray(values[field.key]) && (values[field.key] as string[]).length > 0 && (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(values[field.key] as string[]).map((image, index) => (
                              <div key={image} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                <img src={resolveImageUrl(image)} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => updateValue(field.key, (values[field.key] as string[]).filter((_, itemIndex) => itemIndex !== index))}
                                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  aria-label={`Remove gallery image ${index + 1}`}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {galleryError && <p className="text-sm text-red-600">{galleryError}</p>}
                      </div>
                    ) : field.key === "itinerary" ? (
                      <div className="space-y-3">
                        {(Array.isArray(values[field.key]) ? values[field.key] as Record<string, string>[] : []).map((item, index) => (
                          <div key={index} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                            <input
                              type="time"
                              value={item.time || ""}
                              onChange={(event) => updateStructuredValue(field.key, index, { time: event.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                            />
                            <input
                              value={item.event || ""}
                              onChange={(event) => updateStructuredValue(field.key, index, { event: event.target.value })}
                              placeholder="Event name"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => updateValue(field.key, (values[field.key] as Record<string, string>[]).filter((_, itemIndex) => itemIndex !== index))}
                              className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
                              aria-label={`Remove programme item ${index + 1}`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addStructuredValue(field.key, { time: "", event: "" })}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          + Add programme item
                        </button>
                      </div>
                    ) : field.key === "contacts" ? (
                      <div className="space-y-3">
                        {(Array.isArray(values[field.key]) ? values[field.key] as Record<string, string>[] : []).map((item, index) => (
                          <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500">Contact {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => updateValue(field.key, (values[field.key] as Record<string, string>[]).filter((_, itemIndex) => itemIndex !== index))}
                                className="text-xs text-red-500"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={item.name || ""}
                              onChange={(event) => updateStructuredValue(field.key, index, { name: event.target.value })}
                              placeholder="Contact name"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                            />
                            <input
                              type="tel"
                              value={item.phone || ""}
                              onChange={(event) => updateStructuredValue(field.key, index, { phone: event.target.value })}
                              placeholder="0123456789"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addStructuredValue(field.key, { name: "", phone: "" })}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          + Add contact
                        </button>
                      </div>
                    ) : field.key === "socialLinks" ? (
                      <div className="space-y-3">
                        {(Array.isArray(values[field.key]) ? values[field.key] as Record<string, string>[] : []).map((item, index) => (
                          <div key={index} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                            <input
                              value={item.platform || ""}
                              onChange={(event) => updateStructuredValue(field.key, index, { platform: event.target.value })}
                              placeholder="Platform"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                            />
                            <input
                              type="url"
                              value={item.url || ""}
                              onChange={(event) => updateStructuredValue(field.key, index, { url: event.target.value })}
                              placeholder="https://..."
                              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => updateValue(field.key, (values[field.key] as Record<string, string>[]).filter((_, itemIndex) => itemIndex !== index))}
                              className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
                              aria-label={`Remove social link ${index + 1}`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addStructuredValue(field.key, { platform: "", url: "" })}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          + Add social link
                        </button>
                      </div>
                    ) : field.key === "groomParents" || field.key === "brideParents" ? (
                      <textarea
                        required={field.required}
                        value={String(values[field.key] ?? "")}
                        onChange={(event) => updateValue(field.key, event.target.value)}
                        placeholder="Enter the parents' names and details."
                        minLength={field.validation?.minLength}
                        maxLength={field.validation?.maxLength}
                        rows={5}
                        className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        value={String(values[field.key] ?? "")}
                        onChange={(event) => updateValue(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        minLength={field.validation?.minLength}
                        maxLength={field.validation?.maxLength}
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    ) : field.type === "checkbox" ? (
                      <span className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          checked={Boolean(values[field.key])}
                          onChange={(event) => updateValue(field.key, event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Yes</span>
                      </span>
                    ) : (
                      <input
                        type={
                          field.key === "eventStartTime" || field.key === "eventEndTime"
                            ? "time"
                            : field.key === "rsvpDeadline"
                              ? "datetime-local"
                              : field.key === "rsvpMaxOverallGuests" || field.key === "rsvpMaxGuestsPerInvitation"
                                ? "number"
                                : field.type
                        }
                        required={field.required}
                        value={String(values[field.key] ?? "")}
                        onChange={(event) => updateValue(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        minLength={field.validation?.minLength}
                        maxLength={field.validation?.maxLength}
                        pattern={field.validation?.pattern}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    )}
                  </label>
                ))}
              </div>
              {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit details"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}