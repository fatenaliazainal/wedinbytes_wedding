import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { invitationTable, cardDesignTable } from "../lib/db/src/schema/index.ts";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

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

  await db.delete(invitationTable);
  await db.insert(invitationTable).values([
    { token: "ain-hidayat-2025", ...invitationBase },
    { token: "demo", ...invitationBase },
  ]);

  console.log("Seeding card design...");
  await db.delete(cardDesignTable);
  await db.insert(cardDesignTable).values({
    name: "Garden Floral (Default)",
    isActive: true,
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
  });

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
