import type { PricingFormConfig, PricingFormField } from "@workspace/db";

export const DEFAULT_BUSINESS_FORM_CONFIG: PricingFormConfig = {
  fields: [
    { key: "groomName", label: "Groom name", type: "text", required: true, invitationField: "groomName" },
    { key: "brideName", label: "Bride name", type: "text", required: true, invitationField: "brideName" },
    { key: "eventDate", label: "Wedding date", type: "date", required: true, invitationField: "eventDate" },
    { key: "eventType", label: "Event type", type: "text", defaultValue: "Walimatul Urus", invitationField: "eventType" },
    { key: "venueName", label: "Venue", type: "text", required: true, invitationField: "venueName" },
    { key: "venueAddress", label: "Venue address", type: "textarea", invitationField: "venueAddress" },
    { key: "venueMapUrl", label: "Google Maps link", type: "url", invitationField: "venueMapUrl" },
    { key: "groomParents", label: "Groom's parents", type: "text", invitationField: "groomParents" },
    { key: "brideParents", label: "Bride's parents", type: "text", invitationField: "brideParents" },
    { key: "message", label: "Short message", type: "textarea", invitationField: "message" },
    { key: "contactPhone", label: "Contact phone", type: "tel", required: true, invitationField: "contactPhone" },
    { key: "email", label: "Customer email", type: "email" },
    { key: "dresscode", label: "Dress code", type: "text", invitationField: "dresscode" },
  ],
  hiddenFields: {
    eventDay: "",
    eventTime: "11:00 pagi – 4:00 petang",
    venueCity: "",
    venueState: "",
  },
};

const INVITATION_FIELDS = new Set([
  "groomName", "brideName", "eventType", "eventDate", "eventDay", "eventTime",
  "venueName", "venueAddress", "venueCity", "venueState", "venueMapUrl",
  "groomParents", "brideParents", "contactPhone", "contacts", "dresscode", "message",
  "eventStartDateTime", "eventEndDateTime", "eventStartTime", "eventEndTime",
  "shortCoupleName", "groomShortName", "brideShortName", "coverGroomName",
  "coverBrideName", "coupleCount", "groomInitial", "brideInitial", "envelopeInitials",
  "envelopeInitialsSize", "page2Initials", "logoInitialsUrl", "initialsImageUrl",
  "initialsImageScale", "coverDateText", "additionalInfo", "coverTitle", "hashtag",
  "showFrontText",
  "greetingText", "doaText", "invitationText", "hostName", "venueHijriDate",
  "hostCount", "schedule", "itinerary", "galleryImages",
  "rsvpEnabled", "rsvpAdditionalInfo", "rsvpDeadline", "rsvpIntroText", "rsvpFormNote",
  "rsvpMaxOverallGuests", "rsvpMaxGuestsPerInvitation", "rsvpTimeSlots",
  "designCode", "openingAnimation", "openButtonText", "colorPrimary", "colorSecondary",
  "colorBackground", "colorCard", "nameFontFamily", "nameFontSize", "badgeFontSize",
  "nameColor", "bodyFontFamily", "musicUrl", "musicTitle", "musicArtist",
  "showFooter", "footerText", "footerUrl", "socialLinks",
]);

function invitationFieldName(value: unknown) {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (INVITATION_FIELDS.has(raw)) return raw;
  const camelCase = raw.replace(/[-_\s]+([a-z])/gi, (_match, letter: string) => letter.toUpperCase());
  return INVITATION_FIELDS.has(camelCase) ? camelCase : undefined;
}

export function normalizeBusinessFormConfig(value: unknown): PricingFormConfig {
  if (!value || typeof value !== "object") return DEFAULT_BUSINESS_FORM_CONFIG;
  const raw = value as { fields?: unknown; hiddenFields?: unknown };
  const fields = Array.isArray(raw.fields)
    ? raw.fields
      .filter((field): field is PricingFormField => Boolean(field) && typeof field === "object")
      .map((field) => ({
        key: typeof field.key === "string" ? field.key.trim() : "",
        label: typeof field.label === "string" ? field.label.trim() : "",
        type: field.type,
        required: field.required === true,
        placeholder: typeof field.placeholder === "string" ? field.placeholder : undefined,
        defaultValue: typeof field.defaultValue === "string" || typeof field.defaultValue === "boolean"
          ? field.defaultValue
          : undefined,
        invitationField: typeof field.invitationField === "string" ? field.invitationField.trim() : undefined,
        validation: field.validation && typeof field.validation === "object"
          ? {
            minLength: typeof field.validation.minLength === "number" ? field.validation.minLength : undefined,
            maxLength: typeof field.validation.maxLength === "number" ? field.validation.maxLength : undefined,
            pattern: typeof field.validation.pattern === "string" ? field.validation.pattern : undefined,
          }
          : undefined,
      }))
      .filter((field) => field.key && field.label && ["text", "email", "date", "tel", "url", "textarea", "checkbox"].includes(field.type))
    : [];
  const hiddenFields = raw.hiddenFields && typeof raw.hiddenFields === "object" && !Array.isArray(raw.hiddenFields)
    ? Object.fromEntries(
      Object.entries(raw.hiddenFields as Record<string, unknown>)
        .filter(([, fieldValue]) =>
          fieldValue === null || typeof fieldValue === "string" || typeof fieldValue === "number" || typeof fieldValue === "boolean",
        )
        .map(([key, fieldValue]) => [key, fieldValue as string | boolean | number | null]),
    ) as Record<string, string | boolean | number | null>
    : {};
  return { fields, hiddenFields };
}

function valueIsBlank(value: unknown) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

export function validateBusinessCustomerData(config: PricingFormConfig, input: unknown) {
  const values = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const errors: string[] = [];
  const cleaned: Record<string, string | boolean | number | null | string[]> = {};

  for (const field of config.fields) {
    const value = values[field.key] ?? field.defaultValue ?? null;
    if (field.required && valueIsBlank(value)) {
      errors.push(`${field.label} is required.`);
      continue;
    }
    if (Array.isArray(value)) {
      const images = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4);
      if (field.required && images.length === 0) {
        errors.push(`${field.label} is required.`);
      }
      cleaned[field.key] = images;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      if (field.validation?.minLength !== undefined && trimmed.length < field.validation.minLength) {
        errors.push(`${field.label} is too short.`);
      }
      if (field.validation?.maxLength !== undefined && trimmed.length > field.validation.maxLength) {
        errors.push(`${field.label} is too long.`);
      }
      if (field.validation?.pattern) {
        try {
          if (!new RegExp(field.validation.pattern).test(trimmed)) errors.push(`${field.label} has an invalid format.`);
        } catch {
          errors.push(`${field.label} has an invalid package validation rule.`);
        }
      }
      cleaned[field.key] = trimmed;
    } else {
      cleaned[field.key] = value as string | boolean | number | null;
    }
  }
  for (const [key, value] of Object.entries(config.hiddenFields ?? {})) cleaned[key] = value;
  return { errors, cleaned };
}

export function mapBusinessCustomerToInvitation(config: PricingFormConfig, customerData: Record<string, unknown>) {
  const invitation: Record<string, unknown> = {};
  for (const field of config.fields) {
    const invitationField = invitationFieldName(field.invitationField) || invitationFieldName(field.key);
    if (!invitationField || !INVITATION_FIELDS.has(invitationField)) continue;
    if (field.key in customerData) {
      const value = customerData[field.key];
      invitation[invitationField] = invitationField === "galleryImages"
        ? (Array.isArray(value)
          ? value.filter((item): item is string => typeof item === "string").slice(0, 4)
          : typeof value === "string"
            ? value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 4)
            : [])
        : value;
    }
  }
  for (const [key, value] of Object.entries(config.hiddenFields ?? {})) {
    if (INVITATION_FIELDS.has(key)) invitation[key] = value;
  }
  return invitation;
}