import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { GetInvitationResponse } from "@workspace/api-zod";
import { db, invitationTable } from "@workspace/db";

const router: IRouter = Router();

function slugPart(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicDateCode(eventDate: string | null | undefined) {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;
  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : "000000";
}

function publicSlug(row: typeof invitationTable.$inferSelect) {
  const groomSlug = slugPart(row.groomShortName) || slugPart(row.groomName) || slugPart(row.groomInitial);
  const brideSlug = slugPart(row.brideShortName) || slugPart(row.brideName) || slugPart(row.brideInitial);
  return [groomSlug, brideSlug].filter(Boolean).join("-") || "wi";
}

function legacyPublicSlug(row: typeof invitationTable.$inferSelect) {
  const brideInitial = slugPart(row.brideName || row.brideShortName || row.brideInitial).charAt(0);
  const groomInitial = slugPart(row.groomName || row.groomShortName || row.groomInitial).charAt(0);
  return `${brideInitial}${groomInitial}` || "wi";
}

const ALLOWED_FIELDS = [
  "groomName","brideName","eventType","eventDate","eventDay","eventTime",
  "venueName","venueAddress","venueCity","venueState","venueMapUrl",
  "groomParents","brideParents","contactPhone","contacts","dresscode","message","galleryImages",
  "shortCoupleName","groomShortName","brideShortName","coupleCount","groomInitial","brideInitial","coverGroomName","coverBrideName","envelopeInitials","page2Initials","logoInitialsUrl",
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
  "designCode","openingAnimation","openButtonText",
  "colorPrimary","colorSecondary","colorAccent","colorBackground","colorCard",
  "nameFontFamily","nameFontSize","badgeFontSize","nameColor",
  "bodyFontFamily",
  // Music
  "musicUrl","musicTitle","musicArtist",
  // Footer / branding
  "showFooter","footerText","footerUrl","socialLinks",
  // Pricing package
  "packageId",
];

async function publicInvitation(row: typeof invitationTable.$inferSelect) {
  const { lockPinHash: _lockPinHash, ...safe } = row;
  // Footer branding is controlled centrally by the admin demo invitation.
  // Apply it to every buyer invitation so old per-invitation branding values
  // cannot override the current admin default.
  if (row.token !== "demo") {
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
  return { ...safe, isLocked: Boolean(row.lockPinHash) };
}

function canManageInvitation(req: Request, row: typeof invitationTable.$inferSelect) {
  return Boolean(req.session.userId && row.userId === req.session.userId);
}

// Create a new invitation for the logged-in buyer.
// Each request intentionally creates a separate card; buyers can own multiple invitations.
router.post("/invitation", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }
    const token = randomUUID().replace(/-/g, "").slice(0, 16);
    const body = req.body as Record<string, unknown>;
    const [created] = await db.insert(invitationTable).values({
      token,
      userId: req.session.userId,
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
    const { token } = req.params;
    const rows = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    const row = rows[0];
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
      publicDateCode(candidate.eventDate) === req.params.dateCode &&
      (publicSlug(candidate) === req.params.slug || legacyPublicSlug(candidate) === req.params.slug),
    );
    if (!row) {
      res.status(404).json({ error: "Invitation not found" });
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
    const { token } = req.params;
    const body = req.body as Record<string, unknown>;
    const brandingFields = ["showFooter", "footerText", "footerUrl", "socialLinks"];
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

    // Build update object from allowed fields only
    const update: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        let value = body[field];
        if (field === "galleryImages" && Array.isArray(value)) {
          value = value.slice(0, 4);
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

    res.json(await publicInvitation(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update invitation");
    res.status(500).json({ error: "Internal server error" });
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
    if (!canManageInvitation(req, row)) {
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
    res.json(await publicInvitation(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update invitation lock");
    res.status(500).json({ error: "Failed to update card lock" });
  }
});

router.post("/invitation/:token/unlock", async (req, res) => {
  try {
    const { token } = req.params;
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
