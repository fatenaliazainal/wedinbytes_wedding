import type { PricingFormConfig, PricingFormField } from "@workspace/db";

export const DEFAULT_BUSINESS_FORM_CONFIG: PricingFormConfig = {
  fields: [
    { key: "coverTitle", label: "Event title", type: "text", invitationField: "coverTitle" },
    { key: "groomName", label: "Groom name", type: "text", required: true, invitationField: "groomName" },
    { key: "brideName", label: "Bride name", type: "text", required: true, invitationField: "brideName" },
    { key: "hashtag", label: "Hashtag", type: "text", invitationField: "hashtag" },
    { key: "groomParents", label: "Groom's parents", type: "textarea", invitationField: "groomParents" },
    { key: "brideParents", label: "Bride's parents", type: "textarea", invitationField: "brideParents" },
    { key: "eventDate", label: "Wedding date", type: "date", required: true, invitationField: "eventDate" },
    { key: "eventType", label: "Event type", type: "text", defaultValue: "Walimatul Urus", invitationField: "eventType" },
    { key: "eventStartTime", label: "Start time", type: "text", invitationField: "eventStartTime" },
    { key: "eventEndTime", label: "End time", type: "text", invitationField: "eventEndTime" },
    { key: "venueName", label: "Venue", type: "text", required: true, invitationField: "venueName" },
    { key: "venueAddress", label: "Venue address", type: "textarea", invitationField: "venueAddress" },
    { key: "venueHijriDate", label: "Islamic date", type: "text", invitationField: "venueHijriDate" },
    { key: "venueMapUrl", label: "Google Maps link", type: "url", invitationField: "venueMapUrl" },
    { key: "dresscode", label: "Dress code", type: "text", invitationField: "dresscode" },
    { key: "itinerary", label: "Event programme", type: "textarea", invitationField: "itinerary" },
    { key: "doaText", label: "Doa", type: "textarea", invitationField: "doaText" },
    { key: "contactPhone", label: "Contact phone", type: "tel", required: true, invitationField: "contactPhone" },
    { key: "contacts", label: "Contact persons", type: "textarea", invitationField: "contacts" },
    { key: "email", label: "Customer email", type: "email" },
    { key: "galleryImages", label: "Photo gallery", type: "textarea", invitationField: "galleryImages" },
    { key: "rsvpEnabled", label: "Enable RSVP", type: "checkbox", invitationField: "rsvpEnabled" },
    { key: "rsvpDeadline", label: "RSVP deadline", type: "text", invitationField: "rsvpDeadline" },
    { key: "rsvpMaxOverallGuests", label: "Overall guest limit", type: "text", defaultValue: "1000", invitationField: "rsvpMaxOverallGuests" },
    { key: "rsvpMaxGuestsPerInvitation", label: "Guest limit per invitation", type: "text", defaultValue: "10", invitationField: "rsvpMaxGuestsPerInvitation" },
  ],
  hiddenFields: {
    eventDay: "",
    eventTime: "11:00 pagi – 4:00 petang",
    venueCity: "",
    venueState: "",
  },
};

const REMOVED_BUSINESS_FORM_KEYS = new Set([
  "message",
  "coverGroomName",
  "coverBrideName",
  "envelopeInitials",
  "showFrontText",
  "greetingText",
  "invitationText",
  "page2Initials",
  "rsvpIntroText",
  "showFooter",
  "footerText",
  "footerUrl",
  "socialLinks",
  "nameFontFamily",
  "nameFontSize",
  "badgeFontSize",
  "nameColor",
  "bodyFontFamily",
]);

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

const STRUCTURED_FIELD_KEYS = new Set(["itinerary", "contacts", "socialLinks"]);
const NUMERIC_FIELD_KEYS = new Set(["rsvpMaxOverallGuests", "rsvpMaxGuestsPerInvitation"]);

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
  const configuredFields = Array.isArray(raw.fields)
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
      .filter((field) =>
        field.key &&
        !REMOVED_BUSINESS_FORM_KEYS.has(field.key) &&
        field.label &&
        ["text", "email", "date", "tel", "url", "textarea", "checkbox"].includes(field.type),
      )
    : [];
  const configuredKeys = new Set(configuredFields.map((field) => field.key));
  const fields = [
    ...configuredFields,
    ...DEFAULT_BUSINESS_FORM_CONFIG.fields.filter((field) =>
      !configuredKeys.has(field.key) && !REMOVED_BUSINESS_FORM_KEYS.has(field.key),
    ),
  ];
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
    if (Array.isArray(value) && field.key === "galleryImages") {
      const images = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4);
      if (field.required && images.length === 0) {
        errors.push(`${field.label} is required.`);
      }
      cleaned[field.key] = images;
    } else if (Array.isArray(value) && STRUCTURED_FIELD_KEYS.has(field.key)) {
      if (field.key === "itinerary") {
        cleaned[field.key] = value
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item) => ({
            time: typeof item.time === "string" ? item.time.trim() : "",
            event: typeof item.event === "string" ? item.event.trim() : "",
          }))
          .filter((item) => item.time || item.event) as unknown as string[];
      } else if (field.key === "contacts") {
        cleaned[field.key] = value
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item) => ({
            name: typeof item.name === "string" ? item.name.trim() : "",
            phone: typeof item.phone === "string" ? item.phone.trim() : "",
          }))
          .filter((item) => item.name || item.phone) as unknown as string[];
      } else {
        cleaned[field.key] = value
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item) => ({
            platform: typeof item.platform === "string" ? item.platform.trim() : "",
            url: typeof item.url === "string" ? item.url.trim() : "",
          }))
          .filter((item) => item.platform || item.url) as unknown as string[];
      }
    } else if (NUMERIC_FIELD_KEYS.has(field.key)) {
      const numericValue = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 1) {
        errors.push(`${field.label} must be a positive number.`);
      } else {
        cleaned[field.key] = Math.floor(numericValue);
      }
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      const cleanedText = field.key === "groomParents" || field.key === "brideParents"
        ? sanitizeRichText(trimmed)
        : trimmed;
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
      cleaned[field.key] = cleanedText;
    } else {
      cleaned[field.key] = value as string | boolean | number | null;
    }
  }
  for (const [key, value] of Object.entries(config.hiddenFields ?? {})) cleaned[key] = value;
  return { errors, cleaned };
}

function sanitizeRichText(value: string) {
  return value
    .replace(/<(script|style|iframe|object|embed|form|meta|link)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<(?!\/?(?:b|strong|i|em|u|s|strike|br|p|div|span|font)\b)[^>]*>/gi, "")
    .trim();
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