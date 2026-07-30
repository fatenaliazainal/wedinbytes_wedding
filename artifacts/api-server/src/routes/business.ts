import { Router, type IRouter } from "express";
import { and, count, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  businessClientTable,
  businessFormShareTable,
  businessProfileTable,
  db,
  invitationTable,
  pricingPackageTable,
  userTable,
} from "@workspace/db";
import { auditEvent, customerFormSubmitRateLimit } from "../lib/security";
import { normalizeBusinessFormConfig, mapBusinessCustomerToInvitation, validateBusinessCustomerData } from "../lib/business-package";

const router: IRouter = Router();

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
    dresscode: mappedInvitation.dresscode ? String(mappedInvitation.dresscode).trim() : null,
    message: mappedInvitation.message ? String(mappedInvitation.message).trim() : null,
    designCode: mappedInvitation.designCode ? String(mappedInvitation.designCode).trim() : null,
    galleryImages: Array.isArray(mappedInvitation.galleryImages) ? mappedInvitation.galleryImages : null,
    businessId: profileId,
    packageId,
    websiteStatus: "ACTIVE",
  };
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
  }).returning();
  return created;
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
    for (const field of PROFILE_FIELDS) {
      if (!(field in body)) continue;
      const value = body[field];
      if (field === "slug") {
        if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) {
          res.status(400).json({ error: "Slug must contain lowercase letters, numbers and hyphens only" });
          return;
        }
        update[field] = value.trim();
      } else {
        update[field] = value === null || typeof value === "string" ? value : String(value);
      }
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
      res.status(409).json({ error: "That business slug is already in use" });
      return;
    }
    req.log.error({ err }, "Failed to update business profile");
    res.status(500).json({ error: "Internal server error" });
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
    res.json({
      token: share.token,
      businessName: share.businessName,
      packageId: share.packageId,
      packageName: share.packageName,
      packageDescription: share.packageDescription,
      formConfig: normalizeBusinessFormConfig(share.formConfig),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load customer form share");
    res.status(500).json({ error: "Internal server error" });
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
    const formConfig = normalizeBusinessFormConfig(selectedPackage.formConfig);
    const { errors, cleaned } = validateBusinessCustomerData(formConfig, (req.body as Record<string, unknown>).customerData);
    if (errors.length) {
      res.status(400).json({ error: errors.join(" ") });
      return;
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
      customerData: cleaned,
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
    const formConfig = normalizeBusinessFormConfig(selectedPackage.formConfig);
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
    const formConfig = normalizeBusinessFormConfig(selectedPackage.formConfig);
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
        customerData: cleaned,
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