import { Router, type IRouter } from "express";
import { and, count, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import multer from "multer";
import {
  businessClientTable,
  businessFormShareTable,
  businessProfileTable,
  db,
  invitationTable,
  pricingPackageTable,
  pricingFeatureTable,
  userTable,
} from "@workspace/db";
import { auditEvent, customerFormSubmitRateLimit } from "../lib/security";
import { normalizeBusinessFormConfig, mapBusinessCustomerToInvitation, validateBusinessCustomerData } from "../lib/business-package";
import { isR2Configured, uploadImage } from "../services/cloudflare/r2-storage-admin";
import { hasPngAlphaChannel, inspectImage, type SupportedImageMime } from "../lib/image-validation";

const router: IRouter = Router();
const customerGalleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)),
});
const businessLogoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === "image/png"),
});

const PROFILE_FIELDS = [
  "businessName", "businessType", "displayName", "description", "phone",
  "whatsapp", "email", "website", "instagram", "facebook", "tiktok",
  "logoUrl", "coverImage", "address", "googleMapsUrl", "businessHours", "slug",
] as const;

function invitationValuesFromCustomer(formConfig: ReturnType<typeof normalizeBusinessFormConfig>, cleaned: Record<string, unknown>, profileId: number, packageId: number) {
  const mappedInvitation = mapBusinessCustomerToInvitation(formConfig, cleaned);
  return {
    groomName: String(mappedInvitation.groomName ?? "").trim(),
    brideName: String(mappedInvitation.brideName ?? "").trim(),
    eventType: String(mappedInvitation.eventType ?? "Walimatul Urus").trim(),
    eventDate: String(mappedInvitation.eventDate ?? "").trim(),
    eventDay: String(mappedInvitation.eventDay ?? "").trim(),
    eventTime: String(mappedInvitation.eventTime ?? "11:00 pagi – 4:00 petang").trim(),
    venueName: String(mappedInvitation.venueName ?? "").trim(),
    venueAddress: String(mappedInvitation.venueAddress ?? "").trim(),
    venueCity: String(mappedInvitation.venueCity ?? "").trim(),
    venueState: String(mappedInvitation.venueState ?? "").trim(),
    venueMapUrl: mappedInvitation.venueMapUrl ? String(mappedInvitation.venueMapUrl).trim() : null,
    groomParents: mappedInvitation.groomParents ? String(mappedInvitation.groomParents).trim() : null,
    brideParents: mappedInvitation.brideParents ? String(mappedInvitation.brideParents).trim() : null,
    contactPhone: String(mappedInvitation.contactPhone ?? "").trim(),
    contacts: Array.isArray(mappedInvitation.contacts) ? mappedInvitation.contacts : null,
    dresscode: mappedInvitation.dresscode ? String(mappedInvitation.dresscode).trim() : null,
    dresscodeTheme: mappedInvitation.dresscodeTheme ? String(mappedInvitation.dresscodeTheme).trim().slice(0, 120) : null,
    dresscodeColors: Array.isArray(mappedInvitation.dresscodeColors)
      ? mappedInvitation.dresscodeColors.filter((color): color is string => typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color)).slice(0, 4)
      : null,
    message: mappedInvitation.message ? String(mappedInvitation.message).trim() : null,
    eventStartTime: mappedInvitation.eventStartTime ? String(mappedInvitation.eventStartTime).trim() : null,
    eventEndTime: mappedInvitation.eventEndTime ? String(mappedInvitation.eventEndTime).trim() : null,
    eventStartDateTime: mappedInvitation.eventStartDateTime ? String(mappedInvitation.eventStartDateTime).trim() : null,
    eventEndDateTime: mappedInvitation.eventEndDateTime ? String(mappedInvitation.eventEndDateTime).trim() : null,
    itinerary: Array.isArray(mappedInvitation.itinerary) ? mappedInvitation.itinerary : null,
    schedule: mappedInvitation.schedule ? String(mappedInvitation.schedule).trim() : null,
    shortCoupleName: mappedInvitation.shortCoupleName ? String(mappedInvitation.shortCoupleName).trim() : null,
    groomShortName: mappedInvitation.groomShortName ? String(mappedInvitation.groomShortName).trim() : null,
    brideShortName: mappedInvitation.brideShortName ? String(mappedInvitation.brideShortName).trim() : null,
    coverGroomName: mappedInvitation.coverGroomName ? String(mappedInvitation.coverGroomName).trim() : null,
    coverBrideName: mappedInvitation.coverBrideName ? String(mappedInvitation.coverBrideName).trim() : null,
    coverDateText: mappedInvitation.coverDateText ? String(mappedInvitation.coverDateText).trim() : null,
    coverTitle: mappedInvitation.coverTitle ? String(mappedInvitation.coverTitle).trim() : null,
    additionalInfo: mappedInvitation.additionalInfo ? String(mappedInvitation.additionalInfo).trim() : null,
    hashtag: mappedInvitation.hashtag ? String(mappedInvitation.hashtag).trim() : null,
    greetingText: mappedInvitation.greetingText ? String(mappedInvitation.greetingText).trim() : null,
    doaText: mappedInvitation.doaText ? String(mappedInvitation.doaText).trim() : null,
    invitationText: mappedInvitation.invitationText ? String(mappedInvitation.invitationText).trim() : null,
    hostName: mappedInvitation.hostName ? String(mappedInvitation.hostName).trim() : null,
    hostCount: typeof mappedInvitation.hostCount === "number" ? mappedInvitation.hostCount : null,
    venueHijriDate: mappedInvitation.venueHijriDate ? String(mappedInvitation.venueHijriDate).trim() : null,
    language: mappedInvitation.language ? String(mappedInvitation.language).trim() : "ms",
    showFrontText: typeof mappedInvitation.showFrontText === "boolean" ? mappedInvitation.showFrontText : true,
    coupleCount: typeof mappedInvitation.coupleCount === "number" ? mappedInvitation.coupleCount : 1,
    groomInitial: mappedInvitation.groomInitial ? String(mappedInvitation.groomInitial).trim() : null,
    brideInitial: mappedInvitation.brideInitial ? String(mappedInvitation.brideInitial).trim() : null,
    envelopeInitials: mappedInvitation.envelopeInitials ? String(mappedInvitation.envelopeInitials).trim() : null,
    envelopeInitialsSize: mappedInvitation.envelopeInitialsSize ? String(mappedInvitation.envelopeInitialsSize).trim() : null,
    page2Initials: mappedInvitation.page2Initials ? String(mappedInvitation.page2Initials).trim() : null,
    logoInitialsUrl: mappedInvitation.logoInitialsUrl ? String(mappedInvitation.logoInitialsUrl).trim() : null,
    initialsImageUrl: mappedInvitation.initialsImageUrl ? String(mappedInvitation.initialsImageUrl).trim() : null,
    initialsImageScale: typeof mappedInvitation.initialsImageScale === "number" ? mappedInvitation.initialsImageScale : 100,
    rsvpEnabled: typeof mappedInvitation.rsvpEnabled === "boolean" ? mappedInvitation.rsvpEnabled : false,
    rsvpAdditionalInfo: mappedInvitation.rsvpAdditionalInfo ? String(mappedInvitation.rsvpAdditionalInfo).trim() : null,
    rsvpIntroText: mappedInvitation.rsvpIntroText ? String(mappedInvitation.rsvpIntroText).trim() : null,
    rsvpFormNote: mappedInvitation.rsvpFormNote ? String(mappedInvitation.rsvpFormNote).trim() : null,
    rsvpMaxOverallGuests: typeof mappedInvitation.rsvpMaxOverallGuests === "number" ? mappedInvitation.rsvpMaxOverallGuests : 1000,
    rsvpMaxGuestsPerInvitation: typeof mappedInvitation.rsvpMaxGuestsPerInvitation === "number" ? mappedInvitation.rsvpMaxGuestsPerInvitation : 10,
    rsvpTimeSlots: mappedInvitation.rsvpTimeSlots ? String(mappedInvitation.rsvpTimeSlots).trim() : null,
    openingAnimation: mappedInvitation.openingAnimation ? String(mappedInvitation.openingAnimation).trim() : null,
    openButtonText: mappedInvitation.openButtonText ? String(mappedInvitation.openButtonText).trim() : null,
    colorPrimary: mappedInvitation.colorPrimary ? String(mappedInvitation.colorPrimary).trim() : null,
    colorSecondary: mappedInvitation.colorSecondary ? String(mappedInvitation.colorSecondary).trim() : null,
    colorBackground: mappedInvitation.colorBackground ? String(mappedInvitation.colorBackground).trim() : null,
    colorCard: mappedInvitation.colorCard ? String(mappedInvitation.colorCard).trim() : null,
    nameFontFamily: mappedInvitation.nameFontFamily ? String(mappedInvitation.nameFontFamily).trim() : null,
    nameFontSize: mappedInvitation.nameFontSize ? String(mappedInvitation.nameFontSize).trim() : null,
    badgeFontSize: mappedInvitation.badgeFontSize ? String(mappedInvitation.badgeFontSize).trim() : null,
    nameColor: mappedInvitation.nameColor ? String(mappedInvitation.nameColor).trim() : null,
    bodyFontFamily: mappedInvitation.bodyFontFamily ? String(mappedInvitation.bodyFontFamily).trim() : null,
    musicUrl: mappedInvitation.musicUrl ? String(mappedInvitation.musicUrl).trim() : null,
    musicTitle: mappedInvitation.musicTitle ? String(mappedInvitation.musicTitle).trim() : null,
    musicArtist: mappedInvitation.musicArtist ? String(mappedInvitation.musicArtist).trim() : null,
    designCode: mappedInvitation.designCode ? String(mappedInvitation.designCode).trim() : null,
    galleryImages: Array.isArray(mappedInvitation.galleryImages) ? mappedInvitation.galleryImages : null,
    giftDisplay: typeof mappedInvitation.giftDisplay === "boolean" ? mappedInvitation.giftDisplay : false,
    giftTitle: mappedInvitation.giftTitle ? String(mappedInvitation.giftTitle).trim() : null,
    giftRecipient: mappedInvitation.giftRecipient ? String(mappedInvitation.giftRecipient).trim() : null,
    giftBankName: mappedInvitation.giftBankName ? String(mappedInvitation.giftBankName).trim() : null,
    giftAccountNumber: mappedInvitation.giftAccountNumber ? String(mappedInvitation.giftAccountNumber).trim() : null,
    giftQrCodes: Array.isArray(mappedInvitation.giftQrCodes) ? mappedInvitation.giftQrCodes : null,
    showFooter: typeof mappedInvitation.showFooter === "boolean" ? mappedInvitation.showFooter : true,
    footerText: mappedInvitation.footerText ? String(mappedInvitation.footerText).trim() : null,
    footerUrl: mappedInvitation.footerUrl ? String(mappedInvitation.footerUrl).trim() : null,
    socialLinks: Array.isArray(mappedInvitation.socialLinks) ? mappedInvitation.socialLinks : null,
    businessId: profileId,
    packageId,
    websiteStatus: "ACTIVE",
  };
}

function keepCustomerFormGalleryKeys(value: unknown, token: string): string[] {
  const prefix = `gallery/customer-form-${token}/`;
  return Array.isArray(value)
    ? value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.startsWith(prefix) && !item.includes(".."))
      .slice(0, 4)
    : [];
}

async function packageAllowsFeature(packageId: number, featureName: string) {
  const [feature] = await db
    .select({ id: pricingFeatureTable.id })
    .from(pricingFeatureTable)
    .where(and(
      eq(pricingFeatureTable.packageId, packageId),
      eq(pricingFeatureTable.name, featureName),
    ))
    .limit(1);
  return Boolean(feature);
}

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBusinessLink(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const businessIndex = segments.indexOf("business");
    if (businessIndex >= 0 && segments[businessIndex + 1]) {
      return slugPart(segments[businessIndex + 1]);
    }
  } catch {
    // Treat non-URL input as the custom public link name.
  }
  return slugPart(trimmed.replace(/^\/+|\/+$/g, "").replace(/^business\//i, ""));
}

function publicBusiness(profile: typeof businessProfileTable.$inferSelect, invitationCount?: number) {
  const {
    userId: _userId,
    isActive: _isActive,
    id: _id,
    ...safe
  } = profile;
  return invitationCount === undefined ? safe : { ...safe, invitationCount };
}

function requireBusiness(req: { session: { role?: string; userId?: number } }, res: any): req is typeof req & { session: { userId: number } } {
  if (req.session.role !== "business_account" || !req.session.userId) {
    res.status(403).json({ error: "Business Account access only" });
    return false;
  }
  return true;
}

export async function getOrCreateBusinessProfile(userId: number) {
  const [existing] = await db.select().from(businessProfileTable)
    .where(eq(businessProfileTable.userId, userId)).limit(1);
  if (existing) return existing;
  const [user] = await db.select({ id: userTable.id, name: userTable.name, email: userTable.email })
    .from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (!user) return null;
  const base = slugPart(user.name) || `business-${user.id}`;
  const [created] = await db.insert(businessProfileTable).values({
    userId,
    businessName: user.name,
    displayName: user.name,
    email: user.email,
    slug: `${base}-${user.id}`,
  }).onConflictDoNothing({ target: businessProfileTable.userId }).returning();
  if (created) return created;

  // Another request may have created the profile between the initial read
  // and insert (the dashboard loads multiple business endpoints in parallel).
  const [concurrentProfile] = await db.select().from(businessProfileTable)
    .where(eq(businessProfileTable.userId, userId)).limit(1);
  return concurrentProfile ?? null;
}

async function profileWithInvitationCount(profile: typeof businessProfileTable.$inferSelect) {
  const [result] = await db.select({ value: count(invitationTable.id) })
    .from(invitationTable).where(eq(invitationTable.businessId, profile.id));
  return publicBusiness(profile, Number(result?.value ?? 0));
}

router.get("/business/me", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    res.json(await profileWithInvitationCount(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get business profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/business/me", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    const editableProfileFields = [
      "businessName",
      "businessType",
      "website",
      "instagram",
      "facebook",
      "tiktok",
    ] as const;
    for (const field of editableProfileFields) {
      if (!(field in body)) continue;
      const value = body[field];
      update[field] = value === null || typeof value === "string" ? value : String(value);
    }
    if ("slug" in body) {
      const slug = normalizeBusinessLink(body.slug);
      if (!slug || slug.length < 2 || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        res.status(400).json({ error: "Business link must use letters, numbers and hyphens only." });
        return;
      }
      update.slug = slug;
    }
    if (!Object.keys(update).length) {
      res.status(400).json({ error: "No valid profile fields to update" });
      return;
    }
    update.updatedAt = new Date();
    const [updated] = await db.update(businessProfileTable).set(update)
      .where(eq(businessProfileTable.id, profile.id)).returning();
    auditEvent(req, "business.profile_update", { businessId: profile.id });
    res.json(await profileWithInvitationCount(updated));
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      res.status(409).json({ error: "That business link is already in use" });
      return;
    }
    req.log.error({ err }, "Failed to update business profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/business/me/logo", (req, res, next) => {
  businessLogoUpload.single("file")(req, res, (error) => {
    if (error) {
      res.status(400).json({ error: "Logo must be a PNG file no larger than 2 MB." });
      return;
    }
    next();
  });
}, async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({ error: "Logo storage is not configured." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Please choose a PNG logo file." });
      return;
    }
    if (!hasPngAlphaChannel(req.file.buffer)) {
      res.status(400).json({ error: "Please upload a PNG logo with a transparent background." });
      return;
    }
    try {
      const dimensions = inspectImage(req.file.buffer, "image/png");
      if (dimensions.width > 1600 || dimensions.height > 1600) {
        res.status(400).json({ error: "Logo dimensions must not exceed 1600 × 1600 pixels." });
        return;
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid logo image." });
      return;
    }

    const key = await uploadImage({
      fileName: "business-logo.png",
      fileBuffer: req.file.buffer,
      contentType: "image/png",
      objectKey: `business-${profile.id}.png`,
      folder: "business-logos",
      metadata: {
        uploadedAt: new Date().toISOString(),
        businessId: String(profile.id),
        transparent: "true",
      },
    });
    const [updated] = await db.update(businessProfileTable)
      .set({ logoUrl: key, updatedAt: new Date() })
      .where(eq(businessProfileTable.id, profile.id))
      .returning();
    auditEvent(req, "business.logo_upload", { businessId: profile.id });
    res.status(201).json({ logoUrl: updated.logoUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to upload business logo");
    res.status(500).json({ error: "Failed to upload business logo." });
  }
});

router.get("/business/clients", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    const rows = await db.select({
      client: businessClientTable,
      invitationToken: invitationTable.token,
    }).from(businessClientTable)
      .leftJoin(invitationTable, eq(businessClientTable.invitationId, invitationTable.id))
      .where(eq(businessClientTable.businessId, profile.id))
      .orderBy(businessClientTable.createdAt);
    res.json(rows.map(({ client, invitationToken }) => ({ ...client, invitationToken: invitationToken ?? null })));
  } catch (err) {
    req.log.error({ err }, "Failed to list business clients");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/business/form-shares", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    const packageId = Number((req.body as Record<string, unknown>).packageId);
    if (!profile || !Number.isInteger(packageId)) {
      res.status(400).json({ error: "Select a package before sharing the customer form." });
      return;
    }
    const [selectedPackage] = await db.select({ id: pricingPackageTable.id })
      .from(pricingPackageTable)
      .where(and(eq(pricingPackageTable.id, packageId), eq(pricingPackageTable.isActive, true)))
      .limit(1);
    if (!selectedPackage) {
      res.status(400).json({ error: "The selected package is not available." });
      return;
    }
    const [share] = await db.insert(businessFormShareTable).values({
      businessId: profile.id,
      packageId,
      token: randomUUID().replace(/-/g, ""),
    }).returning();
    auditEvent(req, "business.customer_form_share_create", { businessId: profile.id, shareId: share.id, packageId });
    res.status(201).json({ token: share.token, packageId: share.packageId });
  } catch (err) {
    req.log.error({ err }, "Failed to create customer form share");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/form-shares/:token", async (req, res) => {
  try {
    const token = typeof req.params.token === "string" ? req.params.token : "";
    if (!token) {
      res.status(400).json({ error: "Invalid customer form token." });
      return;
    }
    const [share] = await db.select({
      token: businessFormShareTable.token,
      packageId: businessFormShareTable.packageId,
      businessId: businessFormShareTable.businessId,
      businessName: businessProfileTable.businessName,
      logoUrl: businessProfileTable.logoUrl,
      packageName: pricingPackageTable.name,
      packageDescription: pricingPackageTable.description,
      formConfig: pricingPackageTable.formConfig,
    }).from(businessFormShareTable)
      .innerJoin(businessProfileTable, eq(businessProfileTable.id, businessFormShareTable.businessId))
      .innerJoin(pricingPackageTable, eq(pricingPackageTable.id, businessFormShareTable.packageId))
      .where(and(
        eq(businessFormShareTable.token, token),
        eq(businessFormShareTable.isActive, true),
        eq(pricingPackageTable.isActive, true),
      ))
      .limit(1);
    if (!share) {
      res.status(404).json({ error: "Customer form link not found." });
      return;
    }
    const allowGallery = await packageAllowsFeature(share.packageId, "Photo Gallery");
    res.json({
      token: share.token,
      businessName: share.businessName,
      logoUrl: share.logoUrl,
      packageId: share.packageId,
      packageName: share.packageName,
      packageDescription: share.packageDescription,
      formConfig: normalizeBusinessFormConfig(share.formConfig, { allowGallery }),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load customer form share");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/business/form-shares/:token/gallery-upload", customerFormSubmitRateLimit, customerGalleryUpload.single("file"), async (req, res) => {
  try {
    const token = typeof req.params.token === "string" ? req.params.token : "";
    if (!token) {
      res.status(400).json({ error: "Invalid customer form token." });
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({ error: "Photo storage is not configured." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Image file is required (jpeg/png/webp/gif, max 10 MB)." });
      return;
    }
    const mimeType = req.file.mimetype as SupportedImageMime;
    try {
      inspectImage(req.file.buffer, mimeType);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid image dimensions." });
      return;
    }
    const [share] = await db.select({
      token: businessFormShareTable.token,
      packageId: businessFormShareTable.packageId,
    })
      .from(businessFormShareTable)
      .innerJoin(pricingPackageTable, eq(pricingPackageTable.id, businessFormShareTable.packageId))
      .where(and(
        eq(businessFormShareTable.token, token),
        eq(businessFormShareTable.isActive, true),
        eq(pricingPackageTable.isActive, true),
      ))
      .limit(1);
    if (!share) {
      res.status(404).json({ error: "Customer form link not found." });
      return;
    }
    if (!(await packageAllowsFeature(share.packageId, "Photo Gallery"))) {
      res.status(403).json({ error: "Photo Gallery is available with the Premium package." });
      return;
    }
    const key = await uploadImage({
      fileName: req.file.originalname,
      fileBuffer: req.file.buffer,
      contentType: mimeType,
      folder: `gallery/customer-form-${token}`,
      metadata: { uploadedAt: new Date().toISOString(), formShareToken: token },
    });
    res.status(201).json({ key });
  } catch (err) {
    req.log.error({ err }, "Failed to upload customer gallery image");
    res.status(500).json({ error: "Failed to upload customer gallery image." });
  }
});

router.post("/business/form-shares/:token/submit", customerFormSubmitRateLimit, async (req, res) => {
  try {
    const token = typeof req.params.token === "string" ? req.params.token : "";
    if (!token) {
      res.status(400).json({ error: "Invalid customer form token." });
      return;
    }
    const [share] = await db.select({
      businessId: businessFormShareTable.businessId,
      packageId: businessFormShareTable.packageId,
    }).from(businessFormShareTable)
      .innerJoin(pricingPackageTable, eq(pricingPackageTable.id, businessFormShareTable.packageId))
      .where(and(
        eq(businessFormShareTable.token, token),
        eq(businessFormShareTable.isActive, true),
        eq(pricingPackageTable.isActive, true),
      ))
      .limit(1);
    if (!share) {
      res.status(404).json({ error: "Customer form link not found." });
      return;
    }
    const [selectedPackage] = await db.select().from(pricingPackageTable)
      .where(eq(pricingPackageTable.id, share.packageId)).limit(1);
    if (!selectedPackage) {
      res.status(404).json({ error: "The selected package is no longer available." });
      return;
    }
    const allowGallery = await packageAllowsFeature(selectedPackage.id, "Photo Gallery");
    const formConfig = normalizeBusinessFormConfig(selectedPackage.formConfig, { allowGallery });
    const { errors, cleaned } = validateBusinessCustomerData(formConfig, (req.body as Record<string, unknown>).customerData);
    if (errors.length) {
      res.status(400).json({ error: errors.join(" ") });
      return;
    }
    if ("galleryImages" in cleaned) {
      cleaned.galleryImages = keepCustomerFormGalleryKeys(cleaned.galleryImages, token);
    }
    const mapped = invitationValuesFromCustomer(formConfig, cleaned, share.businessId, share.packageId);
    const [client] = await db.insert(businessClientTable).values({
      businessId: share.businessId,
      packageId: share.packageId,
      brideName: mapped.brideName,
      groomName: mapped.groomName,
      phone: typeof cleaned.contactPhone === "string" ? cleaned.contactPhone.trim() : null,
      email: typeof cleaned.email === "string" ? cleaned.email.trim() : null,
      eventDate: mapped.eventDate || null,
      customerData: cleaned as Record<string, string | boolean | number | null>,
      status: "PENDING_INVITATION",
    }).returning();
    res.status(201).json({ id: client.id, message: "Your details have been submitted successfully." });
  } catch (err) {
    req.log.error({ err }, "Failed to submit customer form");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/business/clients/:id/create-invitation", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    const clientId = Number(req.params.id);
    if (!profile || !Number.isInteger(clientId)) {
      res.status(400).json({ error: "Invalid client id." });
      return;
    }
    const [client] = await db.select().from(businessClientTable)
      .where(and(eq(businessClientTable.id, clientId), eq(businessClientTable.businessId, profile.id)))
      .limit(1);
    if (!client) {
      res.status(404).json({ error: "Client not found." });
      return;
    }
    if (client.invitationId) {
      const [existingInvitation] = await db.select({ token: invitationTable.token })
        .from(invitationTable).where(eq(invitationTable.id, client.invitationId)).limit(1);
      if (existingInvitation) {
        res.json({ invitationToken: existingInvitation.token, client });
        return;
      }
    }
    if (!client.packageId || !client.customerData) {
      res.status(400).json({ error: "This client does not have enough form data to create an invitation." });
      return;
    }
    const [selectedPackage] = await db.select().from(pricingPackageTable)
      .where(and(eq(pricingPackageTable.id, client.packageId), eq(pricingPackageTable.isActive, true))).limit(1);
    if (!selectedPackage) {
      res.status(400).json({ error: "The client's package is no longer available." });
      return;
    }
    const allowGallery = await packageAllowsFeature(selectedPackage.id, "Photo Gallery");
    const formConfig = normalizeBusinessFormConfig(selectedPackage.formConfig, { allowGallery });
    const { errors, cleaned } = validateBusinessCustomerData(formConfig, client.customerData);
    if (errors.length) {
      res.status(400).json({ error: errors.join(" ") });
      return;
    }
    const invitationValues = invitationValuesFromCustomer(formConfig, cleaned, profile.id, client.packageId);
    const { invitation, updatedClient } = await db.transaction(async (tx) => {
      let createdInvitation: typeof invitationTable.$inferSelect | undefined;
      for (let attempt = 0; attempt < 5 && !createdInvitation; attempt += 1) {
        try {
          [createdInvitation] = await tx.insert(invitationTable).values({
            token: randomUUID().replace(/-/g, "").slice(0, 16),
            userId: null,
            ...invitationValues,
          }).returning();
        } catch (error) {
          if ((error as { code?: string })?.code !== "23505" || attempt === 4) throw error;
        }
      }
      if (!createdInvitation) throw new Error("Unable to allocate a unique invitation token.");
      const [updated] = await tx.update(businessClientTable)
        .set({ invitationId: createdInvitation.id, status: "INVITATION_CREATED", updatedAt: new Date() })
        .where(and(eq(businessClientTable.id, client.id), eq(businessClientTable.businessId, profile.id)))
        .returning();
      return { invitation: createdInvitation, updatedClient: updated ?? client };
    });
    auditEvent(req, "business.client_invitation_create", { businessId: profile.id, clientId: client.id, invitationId: invitation.id });
    res.status(201).json({ invitationToken: invitation.token, client: updatedClient });
  } catch (err) {
    req.log.error({ err }, "Failed to create invitation for business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/business/clients", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const packageId = Number(body.packageId);
    if (!Number.isInteger(packageId)) {
      res.status(400).json({ error: "Select a package before saving the customer." });
      return;
    }
    const [selectedPackage] = await db.select().from(pricingPackageTable)
      .where(and(eq(pricingPackageTable.id, packageId), eq(pricingPackageTable.isActive, true))).limit(1);
    if (!selectedPackage) {
      res.status(400).json({ error: "The selected package is not available." });
      return;
    }
    const allowGallery = await packageAllowsFeature(selectedPackage.id, "Photo Gallery");
    const formConfig = normalizeBusinessFormConfig(selectedPackage.formConfig, { allowGallery });
    const { errors, cleaned } = validateBusinessCustomerData(formConfig, body.customerData);
    if (errors.length) {
      res.status(400).json({ error: errors.join(" ") });
      return;
    }
    const mappedInvitation = mapBusinessCustomerToInvitation(formConfig, cleaned);
    const invitationValues = {
      groomName: String(mappedInvitation.groomName ?? "").trim(),
      brideName: String(mappedInvitation.brideName ?? "").trim(),
      eventType: String(mappedInvitation.eventType ?? "Walimatul Urus").trim(),
      eventDate: String(mappedInvitation.eventDate ?? "").trim(),
      eventDay: String(mappedInvitation.eventDay ?? "").trim(),
      eventTime: String(mappedInvitation.eventTime ?? "11:00 pagi – 4:00 petang").trim(),
      venueName: String(mappedInvitation.venueName ?? "").trim(),
      venueAddress: String(mappedInvitation.venueAddress ?? "").trim(),
      venueCity: String(mappedInvitation.venueCity ?? "").trim(),
      venueState: String(mappedInvitation.venueState ?? "").trim(),
      venueMapUrl: mappedInvitation.venueMapUrl ? String(mappedInvitation.venueMapUrl).trim() : null,
      groomParents: mappedInvitation.groomParents ? String(mappedInvitation.groomParents).trim() : null,
      brideParents: mappedInvitation.brideParents ? String(mappedInvitation.brideParents).trim() : null,
      contactPhone: String(mappedInvitation.contactPhone ?? "").trim(),
      dresscode: mappedInvitation.dresscode ? String(mappedInvitation.dresscode).trim() : null,
      dresscodeTheme: mappedInvitation.dresscodeTheme ? String(mappedInvitation.dresscodeTheme).trim().slice(0, 120) : null,
      dresscodeColors: Array.isArray(mappedInvitation.dresscodeColors)
        ? mappedInvitation.dresscodeColors.filter((color): color is string => typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color)).slice(0, 4)
        : null,
      message: mappedInvitation.message ? String(mappedInvitation.message).trim() : null,
      designCode: mappedInvitation.designCode ? String(mappedInvitation.designCode).trim() : null,
      galleryImages: Array.isArray(mappedInvitation.galleryImages) ? mappedInvitation.galleryImages : null,
      businessId: profile.id,
      packageId,
      websiteStatus: "ACTIVE",
    };
    const { client, invitation } = await db.transaction(async (tx) => {
      const [created] = await tx.insert(businessClientTable).values({
        businessId: profile.id,
        packageId,
        brideName: invitationValues.brideName,
        groomName: invitationValues.groomName,
        phone: typeof cleaned.contactPhone === "string" ? cleaned.contactPhone.trim() : null,
        email: typeof cleaned.email === "string" ? cleaned.email.trim() : null,
        eventDate: invitationValues.eventDate || null,
        notes: typeof body.notes === "string" ? body.notes.trim() : null,
        customerData: cleaned as Record<string, string | boolean | number | null>,
        status: typeof body.status === "string" && body.status.trim() ? body.status.trim() : "ACTIVE",
      }).returning();
      let invitation: typeof invitationTable.$inferSelect | undefined;
      for (let attempt = 0; attempt < 5 && !invitation; attempt += 1) {
        try {
          [invitation] = await tx.insert(invitationTable).values({
            token: randomUUID().replace(/-/g, "").slice(0, 16),
            userId: null,
            ...invitationValues,
          }).returning();
        } catch (error) {
          if ((error as { code?: string })?.code !== "23505" || attempt === 4) throw error;
        }
      }
      if (!invitation) throw new Error("Unable to allocate a unique invitation token.");
      const [linkedClient] = await tx.update(businessClientTable)
        .set({ invitationId: invitation.id, updatedAt: new Date() })
        .where(eq(businessClientTable.id, created.id)).returning();
      return { client: linkedClient ?? created, invitation };
    });
    auditEvent(req, "business.client_create", { businessId: profile.id, clientId: client.id });
    res.status(201).json({ ...client, invitationToken: invitation.token });
  } catch (err) {
    req.log.error({ err }, "Failed to create business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/business/clients/:id", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    const id = Number(req.params.id);
    if (!profile || !Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid client id" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const field of ["brideName", "groomName", "phone", "email", "eventDate", "notes", "status"] as const) {
      if (field in body) update[field] = body[field] === null ? null : String(body[field] ?? "").trim();
    }
    update.updatedAt = new Date();
    const [updated] = await db.update(businessClientTable).set(update)
      .where(and(eq(businessClientTable.id, id), eq(businessClientTable.businessId, profile.id))).returning();
    if (!updated) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/business/clients/:id", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    const id = Number(req.params.id);
    if (!profile || !Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid client id" });
      return;
    }
    const deleted = await db.delete(businessClientTable)
      .where(and(eq(businessClientTable.id, id), eq(businessClientTable.businessId, profile.id))).returning({ id: businessClientTable.id });
    if (!deleted.length) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete business client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/invitations", async (req, res) => {
  if (!requireBusiness(req, res)) return;
  try {
    const profile = await getOrCreateBusinessProfile(req.session.userId);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    const rows = await db.select().from(invitationTable)
      .where(eq(invitationTable.businessId, profile.id))
      .orderBy(invitationTable.createdAt);
    res.json(rows.map(({ userId: _userId, businessId: _businessId, lockPinHash: _lockPinHash, ...safe }) => safe));
  } catch (err) {
    req.log.error({ err }, "Failed to list business invitations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/collaborations", async (req, res) => {
  try {
    const rows = await db.select().from(businessProfileTable)
      .where(eq(businessProfileTable.isActive, true))
      .orderBy(businessProfileTable.businessName)
      .limit(12);
    res.json(rows
      .filter((profile) => profile.businessName.trim())
      .map((profile) => publicBusiness(profile)));
  } catch (err) {
    req.log.error({ err }, "Failed to list business collaborations");
    res.status(500).json({ error: "Unable to load collaborations." });
  }
});

router.get("/business/search", async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    const rows = await db.select().from(businessProfileTable).where(and(
      eq(businessProfileTable.isActive, true),
      query ? or(
        ilike(businessProfileTable.businessName, `%${query}%`),
        ilike(businessProfileTable.businessType, `%${query}%`),
        ilike(businessProfileTable.slug, `%${query}%`),
      ) : undefined,
    )).limit(30);
    res.json(rows.map((profile) => publicBusiness(profile)));
  } catch (err) {
    req.log.error({ err }, "Failed to search businesses");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/business/:slug", async (req, res) => {
  try {
    const [profile] = await db.select().from(businessProfileTable).where(and(
      eq(businessProfileTable.slug, req.params.slug),
      eq(businessProfileTable.isActive, true),
    )).limit(1);
    if (!profile) {
      res.status(404).json({ error: "Business profile not found" });
      return;
    }
    res.json(await profileWithInvitationCount(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get public business profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;