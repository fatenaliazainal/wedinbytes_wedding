import { db, invitationTable, cardDesignTable, userTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

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
    // --- Admin user: seed only if no admin exists ---
    const existingAdmin = await db
      .select()
      .from(userTable)
      .where(eq(userTable.role, "admin"))
      .limit(1);
    if (existingAdmin.length === 0) {
      logger.info("Auto-seed: seeding admin user...");
      const adminPassword = process.env.SEED_SECRET ?? "admin-wedinbytes";
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db.insert(userTable).values({
        email: "admin@wedinbytes.com",
        passwordHash,
        name: "Admin",
        role: "admin",
      });
      logger.info(
        "Auto-seed: admin user seeded (email: admin@wedinbytes.com).",
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

    // --- Patch existing demo rows that are missing richer fields (idempotent) ---
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
        const needsPatch =
          !row.greetingText ||
          !row.invitationText ||
          !row.venueHijriDate ||
          !row.schedule ||
          !row.shortCoupleName ||
          !row.coverDateText;
        if (needsPatch) {
          logger.info(
            { token: row.token },
            "Auto-seed: patching demo invitation with richer fields...",
          );
          await db
            .update(invitationTable)
            .set({
              greetingText: row.greetingText ?? invitationBase.greetingText,
              invitationText: row.invitationText ?? invitationBase.invitationText,
              hostName: row.hostName ?? invitationBase.hostName,
              hostCount: row.hostCount ?? invitationBase.hostCount,
              venueHijriDate: row.venueHijriDate ?? invitationBase.venueHijriDate,
              schedule: row.schedule ?? invitationBase.schedule,
              shortCoupleName: row.shortCoupleName ?? invitationBase.shortCoupleName,
              groomInitial: row.groomInitial ?? invitationBase.groomInitial,
              brideInitial: row.brideInitial ?? invitationBase.brideInitial,
              coverDateText: row.coverDateText ?? invitationBase.coverDateText,
            })
            .where(eq(invitationTable.id, row.id));
          logger.info(
            { token: row.token },
            "Auto-seed: demo invitation patched.",
          );
        }
      }
    }

    // --- Card design: always ensure correct values exist ---
    const existingDesigns = await db
      .select()
      .from(cardDesignTable)
      .limit(1);
    if (existingDesigns.length === 0) {
      logger.info("Auto-seed: seeding card design...");
      await db.insert(cardDesignTable).values(cardDesignValues);
      logger.info("Auto-seed: card design seeded.");
    } else {
      // Fix any incorrect or missing values from previous seeds
      const design = existingDesigns[0];
      const needsFix =
        design.cardImageUrl !== cardDesignValues.cardImageUrl ||
        design.envelopeImageUrl !== cardDesignValues.envelopeImageUrl ||
        design.musicUrl !== cardDesignValues.musicUrl ||
        !design.designCode;
      if (needsFix) {
        logger.info("Auto-seed: fixing card design values...");
        await db
          .update(cardDesignTable)
          .set({
            cardImageUrl: cardDesignValues.cardImageUrl,
            envelopeImageUrl: cardDesignValues.envelopeImageUrl,
            musicUrl: cardDesignValues.musicUrl,
            designCode: design.designCode ?? cardDesignValues.designCode,
          })
          .where(eq(cardDesignTable.id, design.id));
        logger.info("Auto-seed: card design values fixed.");
      }
    }
  } catch (err) {
    logger.error({ err }, "Auto-seed: failed.");
  }
}
