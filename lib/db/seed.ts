import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import { invitationTable, cardDesignTable, adminTable, cardTable } from "./src/schema/index.ts";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const designTemplate = {
  envelopeImageUrl: "wed_card_design/20260531-041903-27796.jpg",
  cardImageUrl: "wed_card_design/20260531-041903-27796.jpg",
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

const initialDesignImages = [
  "/designs/design_1785311759226.png",
  "/designs/design_1779761056298.png",
  "/designs/design_1778770711132.png",
];

const designNames = [
  "Garden Floral",
  "Hanging Floral",
  "Garden Script Wedding",
  "Boho Ring Bouquet",
  "White Floral",
  "Vintage Floral Wallpaper",
  "Natural Wedding",
  "Cream & Gold Wedding",
  "Gilded Floral",
  "Golden Greenery",
  "Mr. & Mrs.",
  "Mrs. & Mrs.",
  "Mr. & Mr.",
  "Rustic Charm",
  "Wildflower Garden",
  "Mediterranean Citrus",
  "Spring Greenery",
  "Blush Romance",
  "Terracotta Bloom",
  "Midnight Garden",
  "Dusty Rose Elegance",
  "Sage & Ribbon",
  "Linen Luxe",
  "Blue Hydrangea",
  "Peony Perfection",
  "Royal Garden",
];

async function seed() {
  console.log("Seeding invitation...");

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
    message: "Dengan penuh kesyukuran ke hadrat Ilahi, kami menjemput Tuan/Puan hadir ke majlis perkahwinan kami.",
  };

  await db
    .insert(invitationTable)
    .values([
      { token: "ain-hidayat-2025", ...invitationBase },
      { token: "demo", ...invitationBase },
    ])
    .onConflictDoUpdate({ 
      target: invitationTable.token,
      set: invitationBase,
    });

  console.log("Seeding admin sample row...");
  await db
    .insert(adminTable)
    .values({
      email: "admin@wedinbytes.test",
      passwordHash: "$2b$10$samplehashsamplehashsamplehashsamplehashsamplehashs",
      name: "Admin WedInBytes",
      role: "admin",
    })
    .onConflictDoUpdate({
      target: adminTable.email,
      set: {
        name: "Admin WedInBytes",
        role: "admin",
      },
    });

  console.log("Seeding card sample row...");
  await db
    .insert(cardTable)
    .values({
      name: "Garden Floral",
      path: "wed_card_design/20260531-041903-27796.jpg",
      category: "wedding",
    })
    .onConflictDoUpdate({
      target: cardTable.name,
      set: {
        path: "wed_card_design/20260531-041903-27796.jpg",
        category: "wedding",
      },
    });

  console.log("Seeding card designs (26 rows)...");
  await db
    .insert(cardDesignTable)
    .values(
      designNames.map((name, index) => ({
        name,
        isActive: index === 0,
        ...designTemplate,
        ...(initialDesignImages[index]
          ? {
              cardImageUrl: initialDesignImages[index],
              envelopeImageUrl: initialDesignImages[index],
            }
          : {}),
      }))
    )
    .onConflictDoUpdate({
      target: cardDesignTable.name,
      set: {
        isActive: sql`excluded.is_active`,
        envelopeImageUrl: sql`excluded.envelope_image_url`,
        cardImageUrl: sql`excluded.card_image_url`,
        musicUrl: sql`excluded.music_url`,
        musicTitle: sql`excluded.music_title`,
        musicArtist: sql`excluded.music_artist`,
        colorPrimary: sql`excluded.color_primary`,
        colorSecondary: sql`excluded.color_secondary`,
        colorBackground: sql`excluded.color_background`,
        openingAnimation: sql`excluded.opening_animation`,
      },
    });

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
