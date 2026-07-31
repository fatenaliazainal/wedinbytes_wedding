import { db, invitationTable, cardDesignTable, userTable, pricingPackageTable, pricingFeatureTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./logger";
import { DEFAULT_BUSINESS_FORM_CONFIG } from "./business-package";

const invitationBase = {
  groomName: "Hidayat",
  brideName: "Ain",
  eventType: "Walimatul Urus",
  eventDate: "15 November 2025",
  eventDay: "Sabtu",
  eventTime: "11:00 pagi – 3:00 petang",
  venueName: "Dewan Seri Cahaya",
  venueAddress: "Lot 12, Jalan Kenanga 5, Taman Bunga Raya",
  venueCity: "Shah Alam",
  venueState: "Selangor",
  venueMapUrl: "https://maps.google.com/?q=Dewan+Seri+Cahaya+Shah+Alam",
  groomParents: "Encik Razali bin Hamid & Puan Rohani binti Yusof",
  brideParents: "Encik Sulaiman bin Othman & Puan Norzahra binti Abdul Rahman",
  contactPhone: "0123456789",
  contacts: [{ name: "Ain", phone: "0123456789" }],
  dresscode: "Hijau Sage & Pink",
  message:
    "Dengan penuh kesyukuran ke hadrat Ilahi, kami menjemput Tuan/Puan hadir ke majlis perkahwinan kami.",
  // Ayat undangan
  greetingText:
    "Dengan nama Allah Yang Maha Pemurah lagi Maha Mengasihani\n\nAssalamualaikum Warahmatullahi Wabarakatuh",
  invitationText:
    "Dengan penuh kesyukuran ke hadrat Ilahi, kami dengan sukacitanya menjemput Tuan/Puan/Dato'/Datin hadir ke majlis perkahwinan putera/puteri kami.",
  hostName: "Keluarga Razali & Keluarga Sulaiman",
  hostCount: 2,
  // Venue details
  venueHijriDate: "22 Rabiul Akhir 1447H",
  schedule:
    "11:00 pagi – Ketibaan tetamu\n12:00 tengahari – Majlis makan\n1:00 petang – Bersanding\n3:00 petang – Tamat majlis",
  // Cover
  shortCoupleName: "Ain & Hidayat",
  groomInitial: "H",
  brideInitial: "A",
  coverDateText: "15 . 11 . 2025",
  showFrontText: true,
  coupleCount: 1,
};

// Premium showcase fields — always force-applied to demo invitations so the
// public demo page displays every Premium feature to attract customers.
const DEMO_PREMIUM_SHOWCASE = {
  // RSVP
  rsvpEnabled: true,
  rsvpIntroText: "Sila sahkan kehadiran anda sebelum majlis bermula.",
  rsvpFormNote: "Maksimum 4 orang setiap jemputan.",
  rsvpMaxOverallGuests: 500,
  rsvpMaxGuestsPerInvitation: 4,
  // Photo Gallery — placeholder images served from local public folder
  galleryImages: [
    "/card-floral.png",
    "/card-floral.png",
    "/card-floral.png",
    "/card-floral.png",
  ],
  // Money Gift
  giftDisplay: true,
  giftTitle: "SALAM KASIH",
  giftRecipient: "Ain & Hidayat",
  giftBankName: "Maybank",
  giftAccountNumber: "1621234567890",
};

const cardDesignValues = {
  name: "Garden Floral (Default)",
  isActive: true,
  designCode: "FL001",
  envelopeImageUrl: "/envelope-floral.jpg",
  cardImageUrl: "/card-floral.png",
  musicUrl: "/music/spb.mp3",
  musicTitle: "Selamat Pengantin Baru",
  musicArtist: "Instrumental",
  colorPrimary: "142 45% 35%",
  colorSecondary: "142 30% 92%",
  colorBackground: "142 20% 96%",
  fontHeading: "Playfair Display",
  fontBody: "Lato",
  cardMaxWidth: "420px",
  openingAnimation: "doors",
};

const DEMO_TOKENS = ["demo", "ain-hidayat-2025"] as const;

export async function autoSeedIfEmpty() {
  try {
    // --- Admin user: create or update from SEED_SECRET ---
    const adminPassword = process.env.SEED_SECRET;
    if (adminPassword) {
      const existingAdmin = await db
        .select()
        .from(userTable)
        .where(eq(userTable.role, "admin"))
        .limit(1);
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      if (existingAdmin.length === 0) {
        logger.info("Auto-seed: seeding admin user...");
        await db.insert(userTable).values({
          email: "admin@wedinbytes.com",
          passwordHash,
          name: "Admin",
          role: "admin",
        });
        logger.info(
          "Auto-seed: admin user seeded (email: admin@wedinbytes.com).",
        );
      } else {
        logger.info("Auto-seed: updating admin password from SEED_SECRET...");
        await db
          .update(userTable)
          .set({ passwordHash })
          .where(eq(userTable.id, existingAdmin[0].id));
        logger.info("Auto-seed: admin password updated.");
      }
    } else {
      logger.warn(
        "Auto-seed: SEED_SECRET is not set; admin password will not be created or updated.",
      );
    }

    // --- Demo invitations: check per-token so existing buyer data never blocks seeding ---
    const existingTokenRows = await db
      .select({ token: invitationTable.token })
      .from(invitationTable)
      .where(
        or(
          eq(invitationTable.token, "demo"),
          eq(invitationTable.token, "ain-hidayat-2025"),
        ),
      );
    const existingTokenSet = new Set(existingTokenRows.map((r) => r.token));

    const toInsert = DEMO_TOKENS.filter((t) => !existingTokenSet.has(t));
    if (toInsert.length > 0) {
      logger.info(
        { tokens: toInsert },
        "Auto-seed: seeding missing demo invitations...",
      );
      await db
        .insert(invitationTable)
        .values(toInsert.map((token) => ({ token, ...invitationBase })));
      logger.info("Auto-seed: demo invitations seeded.");
    }

    // --- Patch existing demo rows that are missing any invitationBase fields (idempotent) ---
    // Automatically picks up new fields added to invitationBase — no manual enumeration needed.
    if (existingTokenSet.size > 0) {
      const existingRows = await db
        .select()
        .from(invitationTable)
        .where(
          or(
            eq(invitationTable.token, "demo"),
            eq(invitationTable.token, "ain-hidayat-2025"),
          ),
        );
      for (const row of existingRows) {
        const patch: Record<string, unknown> = {};
        // 1. Patch null/undefined base fields
        for (const [key, value] of Object.entries(invitationBase)) {
          const rowValue = (row as Record<string, unknown>)[key];
          if (rowValue === null || rowValue === undefined) {
            patch[key] = value;
          }
        }
        // 2. Always force-apply Premium showcase fields so the demo page
        //    displays every Premium feature regardless of previous saves.
        const rowRecord = row as Record<string, unknown>;
        if (!rowRecord.rsvpEnabled) patch.rsvpEnabled = DEMO_PREMIUM_SHOWCASE.rsvpEnabled;
        if (!rowRecord.rsvpIntroText) patch.rsvpIntroText = DEMO_PREMIUM_SHOWCASE.rsvpIntroText;
        if (!rowRecord.rsvpFormNote) patch.rsvpFormNote = DEMO_PREMIUM_SHOWCASE.rsvpFormNote;
        if (!rowRecord.rsvpMaxOverallGuests) patch.rsvpMaxOverallGuests = DEMO_PREMIUM_SHOWCASE.rsvpMaxOverallGuests;
        if (!rowRecord.rsvpMaxGuestsPerInvitation) patch.rsvpMaxGuestsPerInvitation = DEMO_PREMIUM_SHOWCASE.rsvpMaxGuestsPerInvitation;
        if (!rowRecord.giftDisplay) patch.giftDisplay = DEMO_PREMIUM_SHOWCASE.giftDisplay;
        if (!rowRecord.giftTitle) patch.giftTitle = DEMO_PREMIUM_SHOWCASE.giftTitle;
        if (!rowRecord.giftRecipient) patch.giftRecipient = DEMO_PREMIUM_SHOWCASE.giftRecipient;
        if (!rowRecord.giftBankName) patch.giftBankName = DEMO_PREMIUM_SHOWCASE.giftBankName;
        if (!rowRecord.giftAccountNumber) patch.giftAccountNumber = DEMO_PREMIUM_SHOWCASE.giftAccountNumber;
        const gallery = Array.isArray(rowRecord.galleryImages) ? rowRecord.galleryImages : [];
        if (gallery.length === 0) patch.galleryImages = DEMO_PREMIUM_SHOWCASE.galleryImages;

        if (Object.keys(patch).length > 0) {
          logger.info(
            { token: row.token, fields: Object.keys(patch) },
            "Auto-seed: patching demo invitation with missing fields...",
          );
          await db
            .update(invitationTable)
            .set(patch)
            .where(eq(invitationTable.id, row.id));
          logger.info(
            { token: row.token },
            "Auto-seed: demo invitation patched.",
          );
        }
      }
    }

    // --- Card design: seed defaults only when the catalogue is empty ---
    // Existing designs are admin-managed. Never "repair" or replace their
    // images/settings on startup, otherwise a restart would undo saved edits.
    const existingDesigns = await db
      .select()
      .from(cardDesignTable)
      .limit(1);
    if (existingDesigns.length === 0) {
      logger.info("Auto-seed: seeding card design...");
      await db.insert(cardDesignTable).values(cardDesignValues);
      logger.info("Auto-seed: card design seeded.");
    } else {
      logger.info(
        { count: existingDesigns.length },
        "Auto-seed: preserving existing card designs.",
      );
    }
    // --- Pricing packages: seed defaults if none exist ---
    const existingPackages = await db.select().from(pricingPackageTable).limit(1);
    if (existingPackages.length === 0) {
      logger.info("Auto-seed: seeding default pricing packages...");
      const [standard] = await db
        .insert(pricingPackageTable)
        .values({
          name: "Standard",
          price: "55",
          description: "Everything you need for a beautiful and memorable digital wedding invitation.",
          badgeText: "",
          showBadge: false,
          isFeatured: false,
          isActive: true,
          sortOrder: 1,
           formConfig: DEFAULT_BUSINESS_FORM_CONFIG,
        })
        .returning();
      const [premium] = await db
        .insert(pricingPackageTable)
        .values({
          name: "Premium",
          price: "65",
          description: "A complete digital wedding invitation experience with more ways to personalise and connect with your guests.",
          badgeText: "More Features",
          showBadge: true,
          isFeatured: true,
          isActive: true,
          sortOrder: 2,
           formConfig: {
             ...DEFAULT_BUSINESS_FORM_CONFIG,
             fields: [
               ...DEFAULT_BUSINESS_FORM_CONFIG.fields,
               { key: "galleryImages", label: "Photo gallery", type: "textarea", invitationField: "galleryImages" },
             ],
           },
        })
        .returning();

      await db.insert(pricingFeatureTable).values([
        { packageId: standard.id, name: "RSVP / Wishes", icon: "MessageSquareHeart", sortOrder: 1 },
        { packageId: standard.id, name: "Contact", icon: "Phone", sortOrder: 2 },
        { packageId: standard.id, name: "Location & Navigation", icon: "MapPin", sortOrder: 3 },
        { packageId: standard.id, name: "Calendar", icon: "CalendarDays", sortOrder: 4 },
        { packageId: standard.id, name: "Countdown", icon: "Timer", sortOrder: 5 },
        { packageId: standard.id, name: "Background Music", icon: "Music", sortOrder: 6 },
        { packageId: premium.id, name: "RSVP / Wishes", icon: "MessageSquareHeart", sortOrder: 1 },
        { packageId: premium.id, name: "Contact", icon: "Phone", sortOrder: 2 },
        { packageId: premium.id, name: "Location & Navigation", icon: "MapPin", sortOrder: 3 },
        { packageId: premium.id, name: "Calendar", icon: "CalendarDays", sortOrder: 4 },
        { packageId: premium.id, name: "Countdown", icon: "Timer", sortOrder: 5 },
        { packageId: premium.id, name: "Background Music", icon: "Music", sortOrder: 6 },
        { packageId: premium.id, name: "Photo Gallery", icon: "Images", sortOrder: 7 },
        { packageId: premium.id, name: "Money Gift", icon: "Gift", sortOrder: 8 },
        { packageId: premium.id, name: "Dress Code", icon: "Shirt", sortOrder: 9 },
      ]);
      logger.info("Auto-seed: default pricing packages seeded.");
    } else {
      const packageRows = await db.select().from(pricingPackageTable);
      for (const pkg of packageRows) {
        if (pkg.formConfig) continue;
        const formConfig = pkg.name.toLowerCase().includes("premium")
          ? {
            ...DEFAULT_BUSINESS_FORM_CONFIG,
            fields: [
              ...DEFAULT_BUSINESS_FORM_CONFIG.fields,
              { key: "galleryImages", label: "Photo gallery", type: "textarea" as const, invitationField: "galleryImages" },
            ],
          }
          : DEFAULT_BUSINESS_FORM_CONFIG;
        await db.update(pricingPackageTable).set({ formConfig, updatedAt: new Date() })
          .where(eq(pricingPackageTable.id, pkg.id));
      }
    }

  } catch (err) {
    logger.error({ err }, "Auto-seed: failed.");
  }
}
