import { Router, type IRouter, type Request } from "express";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { deleteImage } from "../services/cloudflare/r2-storage-admin";
import { GetInvitationResponse } from "@workspace/api-zod";
import { businessClientTable, businessProfileTable, db, invitationTable, orderTable } from "@workspace/db";
import { auditEvent, canManageInvitation, pinUnlockRateLimit } from "../lib/security";
import { isOwnedStorageKey } from "../lib/image-validation";
import { getOrCreateBusinessProfile } from "./business";
import { invitationHasFeature } from "../lib/pricing-features";
import { isEventDatePassed, isInvitationExpired } from "../lib/invitation-expiration";

const router: IRouter = Router();

/** Both "demo" and "demo-en" are admin-owned demo invitations with elevated privileges. */
const isDemoToken = (t: string) => t === "demo" || t === "demo-en";

function slugPart(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicDateCode(eventDate: string | null | undefined): string | null {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;
  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : null;
}

function publicSlug(row: typeof invitationTable.$inferSelect): string | null {
  const groomSlug = slugPart(row.coverGroomName);
  const brideSlug = slugPart(row.coverBrideName);
  return groomSlug && brideSlug ? `${groomSlug}-${brideSlug}` : null;
}

// Existing links generated before Cover names became mandatory remain readable.
// This alias is lookup-only; every new link is generated from publicSlug().
function legacyNamedPublicSlug(row: typeof invitationTable.$inferSelect): string | null {
  const groomSlug = slugPart(row.groomShortName) || slugPart(row.groomName) || slugPart(row.groomInitial);
  const brideSlug = slugPart(row.brideShortName) || slugPart(row.brideName) || slugPart(row.brideInitial);
  return groomSlug && brideSlug ? `${groomSlug}-${brideSlug}` : null;
}

const ALLOWED_FIELDS = [
  "groomName","brideName","eventType","eventDate","eventDay","eventTime",
  "venueName","venueAddress","venueCity","venueState","venueMapUrl","venueWazeUrl",
  "groomParents","brideParents","contactPhone","contacts","dresscode","dresscodeTheme","dresscodeColors","message","galleryImages",
  "giftDisplay","giftTitle","giftRecipient","giftBankName","giftAccountNumber","giftQrCodes",
  "shortCoupleName","groomShortName","brideShortName","coupleCount","groomInitial","brideInitial","coverGroomName","coverBrideName","envelopeInitials","envelopeInitialsSize","page2Initials","logoInitialsUrl","initialsImageUrl","initialsImageScale",
  "eventStartDateTime","eventEndDateTime",
  "eventStartTime","eventEndTime",
  "itinerary",
  "coverDateText","additionalInfo","coverTitle","hashtag","language","showFrontText",
  "greetingText","doaText","invitationText","hostName","hostCount",
  "venueHijriDate","schedule",
  // RSVP settings
  "rsvpEnabled","rsvpAdditionalInfo","rsvpDeadline",
  "rsvpIntroText","rsvpFormNote",
  "rsvpMaxOverallGuests","rsvpMaxGuestsPerInvitation","rsvpTimeSlots",
  // Buyer design overrides
  "designCode","openingAnimation","openButtonText","waxSealId",
  "colorPrimary","colorSecondary","colorAccent","colorBackground","colorCard","colorForeground","colorHeading","colorMuted",
  "nameFontFamily","nameFontSize","badgeFontSize","greetingFontSize","nameColor","greetingColor",
  "bodyFontFamily",
  // Music
  "musicUrl","musicTitle","musicArtist",
  // Overlay toggle
  "overlayEnabled",
  // Gift Registry delivery
  "registryRecipientName","registryRecipientAddress",
  // Footer / branding
  "showFooter","footerText","footerUrl","socialLinks",
  // Pricing package
  "packageId",
];

async function publicInvitation(row: typeof invitationTable.$inferSelect) {
  const {
    lockPinHash: _lockPinHash,
    userId: _userId,
    businessId: _businessId,
    ...safe
  } = row;
  const [paidOrder] = await db
    .select({ id: orderTable.id })
    .from(orderTable)
    .where(and(
      eq(orderTable.invitationId, row.id),
      eq(orderTable.paymentStatus, "PAID"),
    ))
    .limit(1);
  (safe as Record<string, unknown>).initialsImageUrl = row.initialsImageUrl ?? null;
  // A verified paid order is authoritative even if an older callback or
  // imported record did not update the invitation flag.
  (safe as Record<string, unknown>).isPurchased = row.isPurchased || Boolean(paidOrder);
  // Footer branding is controlled centrally by the admin demo invitation.
  // Apply it to every invitation (buyer and business) so old per-invitation
  // branding values cannot override the current admin default.
  if (!isDemoToken(row.token)) {
    const [adminDefaults] = await db
      .select({
        showFooter: invitationTable.showFooter,
        footerText: invitationTable.footerText,
        footerUrl: invitationTable.footerUrl,
        socialLinks: invitationTable.socialLinks,
      })
      .from(invitationTable)
      .where(eq(invitationTable.token, "demo"))
      .limit(1);
    if (adminDefaults) {
      safe.showFooter = adminDefaults.showFooter;
      safe.footerText = adminDefaults.footerText;
      safe.footerUrl = adminDefaults.footerUrl;
      safe.socialLinks = adminDefaults.socialLinks;
    }
  }
  let business: Record<string, unknown> | null = null;
  if (row.businessId) {
    const [profile] = await db
      .select({
        businessName: businessProfileTable.businessName,
        businessType: businessProfileTable.businessType,
        displayName: businessProfileTable.displayName,
        slug: businessProfileTable.slug,
        whatsapp: businessProfileTable.whatsapp,
        instagram: businessProfileTable.instagram,
        website: businessProfileTable.website,
        logoUrl: businessProfileTable.logoUrl,
      })
      .from(businessProfileTable)
      .where(and(
        eq(businessProfileTable.id, row.businessId),
        eq(businessProfileTable.isActive, true),
      ))
      .limit(1);
    if (profile) {
      business = profile;
    }
  }
  return { ...safe, isLocked: Boolean(row.lockPinHash), business: business };
}

// Create a new invitation for the logged-in buyer.
// Each request intentionally creates a separate card; buyers can own multiple invitations.
router.post("/invitation", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }
    const body = req.body as Record<string, unknown>;
    let created: typeof invitationTable.$inferSelect | undefined;
    let businessId: number | null = null;
    if (req.session.role === "business_account") {
      const profile = await getOrCreateBusinessProfile(req.session.userId);
      if (!profile) {
        res.status(404).json({ error: "Business profile could not be created." });
        return;
      }
      businessId = profile.id;
    }
    for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
      const token = randomUUID().replace(/-/g, "").slice(0, 16);
      try {
        [created] = await db.insert(invitationTable).values({
          token,
           userId: req.session.role === "business_account" ? null : req.session.userId,
           businessId,
          groomName:    (body.groomName    as string) || "Pengantin Lelaki",
          brideName:    (body.brideName    as string) || "Pengantin Perempuan",
          eventType:    (body.eventType    as string) || "Walimatul Urus",
          eventDate:    (body.eventDate    as string) || "",
          eventDay:     (body.eventDay     as string) || "",
          eventTime:    (body.eventTime    as string) || "11:00 pagi – 4:00 petang",
          eventStartTime: (body.eventStartTime as string) || "",
          eventEndTime: (body.eventEndTime as string) || "",
          itinerary: Array.isArray(body.itinerary) ? body.itinerary : undefined,
          venueName:    (body.venueName    as string) || "",
          venueAddress: (body.venueAddress as string) || "",
          venueCity:    (body.venueCity    as string) || "",
          venueState:   (body.venueState   as string) || "",
          contactPhone: (body.contactPhone as string) || "",
          contacts: Array.isArray(body.contacts) ? body.contacts : undefined,
          rsvpEnabled: (body.rsvpEnabled as boolean) ?? false,
          rsvpMaxOverallGuests: (body.rsvpMaxOverallGuests as number) ?? 1000,
          rsvpMaxGuestsPerInvitation: (body.rsvpMaxGuestsPerInvitation as number) ?? 10,
          packageId: (body.packageId as number) ?? null,
        }).returning();
      } catch (error) {
        if ((error as { code?: string })?.code !== "23505" || attempt === 4) throw error;
      }
    }
    if (!created) throw new Error("Unable to allocate a unique invitation token.");
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List all invitations owned by the logged-in buyer.
router.get("/invitations-by-user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }
    if (!req.session.userId || req.session.userId !== userId) {
      res.status(403).json({ error: "You do not own these invitations" });
      return;
    }
    const rows = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.userId, userId))
      .orderBy(invitationTable.createdAt);
    res.json(await Promise.all(rows.map(publicInvitation)));
  } catch (err) {
    req.log.error({ err }, "Failed to list invitations by user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/invitation/:token", async (req, res) => {
  try {
    const token = String(req.params.token);
    let rows = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    // Auto-create the demo-en record on first access — copy from demo with language "en".
    if (!rows.length && token === "demo-en") {
      const [demoRow] = await db.select().from(invitationTable).where(eq(invitationTable.token, "demo")).limit(1);
      if (demoRow) {
        const { id: _id, token: _token, createdAt: _c, updatedAt: _u, ...rest } = demoRow;
        await db.insert(invitationTable).values({ ...rest, token: "demo-en", language: "en" });
        rows = await db.select().from(invitationTable).where(eq(invitationTable.token, "demo-en")).limit(1);
      }
    }
    if (!rows.length) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    const row = rows[0];
    if (!isDemoToken(row.token) && isInvitationExpired(row.eventDate)) {
      res.status(410).json({ error: "Invitation expired" });
      return;
    }
    // Return full row (merge extra fields beyond what api-zod knows)
     res.json(await publicInvitation(row));
  } catch (err) {
    req.log.error({ err }, "Failed to get invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public, human-readable URL lookup. The UUID token remains internal.
router.get("/invitation/public/:dateCode/:slug", async (req, res) => {
  try {
    const rows = await db.select().from(invitationTable);
    const row = rows.find((candidate) =>
      publicDateCode(candidate.eventDate) === req.params.dateCode
      && (
        // Paid invitations: match against the locked slug first (immutable after payment)
        (candidate.lockedSlug && candidate.lockedSlug === req.params.slug)
        || publicSlug(candidate) === req.params.slug
        || legacyNamedPublicSlug(candidate) === req.params.slug
      ),
    );
    if (!row) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (row.token !== "demo" && isInvitationExpired(row.eventDate)) {
      res.status(410).json({ error: "Invitation expired" });
      return;
    }
     res.json({ ...(await publicInvitation(row)), token: row.token });
  } catch (err) {
    req.log.error({ err }, "Failed to find public invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/invitation/:token", async (req, res) => {
  try {
    const token = String(req.params.token);
    const body = req.body as Record<string, unknown>;
    const brandingFields = ["showFooter", "footerText", "footerUrl", "socialLinks"];
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }
    if (req.session.role !== "admin" && brandingFields.some((field) => field in body)) {
      res.status(403).json({ error: "Only admin can update footer branding" });
      return;
    }

    // Check the invitation exists (and optionally check ownership)
    const rows = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (!(await canManageInvitation(req, rows[0]))) {
      res.status(403).json({ error: "You do not own this invitation" });
      return;
    }
    const [customerOrder] = await db
      .select({ id: businessClientTable.id })
      .from(businessClientTable)
      .where(eq(businessClientTable.invitationId, rows[0].id))
      .limit(1);
    const [paidOrder] = await db
      .select({ id: orderTable.id })
      .from(orderTable)
      .where(and(
        eq(orderTable.invitationId, rows[0].id),
        eq(orderTable.paymentStatus, "PAID"),
      ))
      .limit(1);
    const isPaid = Boolean(rows[0].isPurchased || paidOrder);
    if (
      req.session.role !== "admin"
      && isPaid
      && isEventDatePassed(rows[0].eventDate)
    ) {
      res.status(423).json({ error: "This paid invitation is locked because its event date has passed." });
      return;
    }
    // Cover names are freely editable — the URL slug is locked separately in lockedSlug at payment time.
    const requestedPackageId = "packageId" in body
      ? (body.packageId == null || body.packageId === "" ? null : Number(body.packageId))
      : (rows[0].packageId ?? null);
    const effectivePackage = { packageId: requestedPackageId };
    if ("dresscodeTheme" in body) {
      if (body.dresscodeTheme != null && (typeof body.dresscodeTheme !== "string" || body.dresscodeTheme.trim().length > 120)) {
        res.status(400).json({ error: "Dress code theme must be 120 characters or fewer." });
        return;
      }
    }
    if ("dresscodeColors" in body) {
      const colors = body.dresscodeColors;
      if (
        colors != null
        && (
          !Array.isArray(colors)
          || colors.length > 4
          || colors.some((color) => typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))
        )
      ) {
        res.status(400).json({ error: "Dress code palette may contain up to 4 valid hex colours." });
        return;
      }
    }
    const giftFields = ["giftDisplay", "giftTitle", "giftRecipient", "giftBankName", "giftAccountNumber", "giftQrCodes"];
    if (giftFields.some((field) => field in body)) {
      // Admin editing the demo invitation can set gift fields freely — the demo
      // has no package and is meant to showcase all premium features.
      if (!isDemoToken(token) && !(await invitationHasFeature(effectivePackage, "Money Gift"))) {
        res.status(403).json({ error: "Money Gift is available with the Premium package." });
        return;
      }
      if ("giftQrCodes" in body) {
        const qrCodes = body.giftQrCodes;
        if (!Array.isArray(qrCodes) || qrCodes.length > 2 || qrCodes.some((key) =>
          typeof key !== "string"
          || !key.startsWith(`gift-qr/${token}/`)
          || key.includes("..")
        )) {
          res.status(400).json({ error: "Gift QR codes must contain up to 2 uploaded invitation QR images." });
          return;
        }
      }
    }
    // Invitations created from a Business order form and paid invitations
    // keep their assigned package. Package changes after payment require
    // support assistance.
    if (
      (Boolean(customerOrder) || isPaid)
      && req.session.role !== "admin"
      && "packageId" in body
    ) {
      const currentPackageId = rows[0].packageId ?? null;
      if (!Number.isInteger(requestedPackageId) || requestedPackageId !== currentPackageId) {
        res.status(409).json({
          error: isPaid
            ? "Package changes are not available for paid invitations. For further assistance, please contact us on WhatsApp."
            : customerOrder
            ? "The package assigned to a customer order cannot be changed."
            : "The pricing package cannot be changed.",
        });
        return;
      }
    }

    // Build update object from allowed fields only
    const update: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        let value = body[field];
      if (field === "galleryImages" && Array.isArray(value)) {
          value = value.slice(0, 4);
        }
        if (field === "giftQrCodes" && Array.isArray(value)) {
          value = value.slice(0, 2);
        }
        if (field === "dresscodeTheme" && typeof value === "string") {
          value = value.trim() || null;
        }
        if (field === "dresscodeColors" && Array.isArray(value)) {
          value = value.slice(0, 4).map((color) => String(color).toLowerCase());
        }
        // timestamp columns expect a Date instance, not a string.
        if (field === "rsvpDeadline" && typeof value === "string" && value.trim()) {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) value = parsed;
        }
        update[field] = value;
      }
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [updated] = await db
      .update(invitationTable)
      .set(update)
      .where(eq(invitationTable.token, token))
      .returning();

    const oldGallery = Array.isArray(rows[0].galleryImages) ? rows[0].galleryImages : [];
    const newGallery = Array.isArray(update.galleryImages) ? update.galleryImages : oldGallery;
    const removedKeys = oldGallery.filter(
      (key): key is string => typeof key === "string" && !newGallery.includes(key),
    );
    const oldGiftQrCodes = Array.isArray(rows[0].giftQrCodes) ? rows[0].giftQrCodes : [];
    const newGiftQrCodes = Array.isArray(update.giftQrCodes) ? update.giftQrCodes : oldGiftQrCodes;
    removedKeys.push(
      ...oldGiftQrCodes.filter(
        (key): key is string => typeof key === "string" && !newGiftQrCodes.includes(key),
      ),
    );
    if (typeof update.initialsImageUrl !== "undefined"
      && update.initialsImageUrl !== rows[0].initialsImageUrl
      && isOwnedStorageKey(rows[0].initialsImageUrl, "initials")) {
      removedKeys.push(rows[0].initialsImageUrl);
    }
    for (const key of removedKeys) {
      const safeKey = key.startsWith("gallery/") || key.startsWith("initials/") || key.startsWith("gift-qr/")
        ? key
        : "";
      if (!safeKey) continue;
      deleteImage(safeKey).catch((error) => {
        req.log.warn({ err: error, key: safeKey }, "Failed to remove replaced invitation image");
      });
    }

    auditEvent(req, "invitation.update", { invitationToken: token, fields: Object.keys(update) });
    res.json(await publicInvitation(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/invitation/:token", async (req, res) => {
  try {
    const token = String(req.params.token);
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }

    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.token, token))
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (req.session.role === "admin" || !(await canManageInvitation(req, invitation))) {
      res.status(403).json({ error: "You do not own this invitation" });
      return;
    }

    await db.delete(invitationTable).where(eq(invitationTable.id, invitation.id));
    auditEvent(req, "invitation.delete", { invitationToken: token });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete invitation");
    res.status(500).json({ error: "Failed to delete invitation" });
  }
});

router.post("/invitation/:token/lock", async (req, res) => {
  try {
    const { token } = req.params;
    const [row] = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!row) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (!(await canManageInvitation(req, row))) {
      res.status(403).json({ error: "You do not own this invitation" });
      return;
    }

    const protect = req.body?.protect === true;
    const pin = typeof req.body?.pin === "string" ? req.body.pin.trim() : "";
    if (protect && !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: "PIN must be exactly 4 digits" });
      return;
    }

    const [updated] = await db.update(invitationTable)
      .set({ lockPinHash: protect ? await bcrypt.hash(pin, 12) : null })
      .where(eq(invitationTable.id, row.id))
      .returning();
    auditEvent(req, "invitation.lock_update", { invitationToken: token, protected: protect });
    res.json(await publicInvitation(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update invitation lock");
    res.status(500).json({ error: "Failed to update card lock" });
  }
});

router.post("/invitation/:token/unlock", pinUnlockRateLimit, async (req, res) => {
  try {
    const token = String(req.params.token);
    const pin = typeof req.body?.pin === "string" ? req.body.pin.trim() : "";
    if (!/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: "PIN must be exactly 4 digits" });
      return;
    }
    const [row] = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!row) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    if (isInvitationExpired(row.eventDate)) {
      res.status(410).json({ error: "Invitation expired" });
      return;
    }
    if (!row.lockPinHash || !(await bcrypt.compare(pin, row.lockPinHash))) {
      res.status(401).json({ error: "Incorrect PIN" });
      return;
    }
    res.json({ unlocked: true });
  } catch (err) {
    req.log.error({ err }, "Failed to verify invitation PIN");
    res.status(500).json({ error: "Failed to verify PIN" });
  }
});

// Get invitation by userId (for buyer to find their own)
router.get("/invitation-by-user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }
    if (!req.session.userId || (req.session.userId !== userId && req.session.role !== "admin")) {
      res.status(403).json({ error: "You do not own these invitations" });
      return;
    }
    const rows = await db.select().from(invitationTable).where(eq(invitationTable.userId, userId)).limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
     res.json(await publicInvitation(rows[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to get invitation by user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
