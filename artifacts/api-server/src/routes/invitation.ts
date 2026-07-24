import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { GetInvitationResponse } from "@workspace/api-zod";
import { db, invitationTable } from "@workspace/db";

const router: IRouter = Router();

const ALLOWED_FIELDS = [
  "groomName","brideName","eventType","eventDate","eventDay","eventTime",
  "venueName","venueAddress","venueCity","venueState","venueMapUrl",
  "groomParents","brideParents","contactPhone","contacts","dresscode","message",
  "shortCoupleName","groomShortName","brideShortName","coupleCount","groomInitial","brideInitial",
  "eventStartDateTime","eventEndDateTime",
  "coverDateText","additionalInfo","showFrontText",
  "greetingText","invitationText","hostName","hostCount",
  "venueHijriDate","schedule",
  // RSVP settings
  "rsvpEnabled","rsvpAdditionalInfo","rsvpDeadline",
  "rsvpIntroText","rsvpFormNote",
  "rsvpMaxOverallGuests","rsvpMaxGuestsPerInvitation","rsvpTimeSlots",
  // Buyer design overrides
  "designCode","openingAnimation","openButtonText",
  "colorPrimary","colorSecondary","colorAccent","colorBackground","colorCard",
  "nameFontFamily","nameFontSize","nameColor",
  "bodyFontFamily",
];

// Create a new invitation for the logged-in buyer (idempotent — returns existing if already has one)
router.post("/invitation", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Tidak log masuk." });
      return;
    }
    // Return existing invitation if the user already has one
    const existing = await db.select().from(invitationTable)
      .where(eq(invitationTable.userId, req.session.userId)).limit(1);
    if (existing.length > 0) {
      res.json(existing[0]);
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
      venueName:    (body.venueName    as string) || "",
      venueAddress: (body.venueAddress as string) || "",
      venueCity:    (body.venueCity    as string) || "",
      venueState:   (body.venueState   as string) || "",
      contactPhone: (body.contactPhone as string) || "",
      contacts: Array.isArray(body.contacts) ? body.contacts : undefined,
      rsvpEnabled: (body.rsvpEnabled as boolean) ?? false,
      rsvpMaxOverallGuests: (body.rsvpMaxOverallGuests as number) ?? 1000,
      rsvpMaxGuestsPerInvitation: (body.rsvpMaxGuestsPerInvitation as number) ?? 10,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create invitation");
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
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to get invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/invitation/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const body = req.body as Record<string, unknown>;

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
        update[field] = body[field];
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

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update invitation");
    res.status(500).json({ error: "Internal server error" });
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
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get invitation by user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
