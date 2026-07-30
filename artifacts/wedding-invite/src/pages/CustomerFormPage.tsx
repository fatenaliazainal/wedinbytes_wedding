import { useEffect, useState } from "react";
import { useParams } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type FormField = {
  key: string;
  label: string;
  type: "text" | "email" | "date" | "tel" | "url" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | boolean;
  validation?: { minLength?: number; maxLength?: number; pattern?: string };
};

type FormDetails = {
  businessName: string;
  packageName: string;
  packageDescription: string;
  formConfig: { fields: FormField[] };
};

export default function CustomerFormPage() {
  const { token } = useParams<{ token: string }>();
  const [details, setDetails] = useState<FormDetails | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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

  const updateValue = (key: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">WedInBytes</p>
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
                    {field.type === "textarea" ? (
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
                        type={field.type}
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