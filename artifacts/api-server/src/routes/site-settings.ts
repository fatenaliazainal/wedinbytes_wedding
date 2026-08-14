import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import type { QuickLink, SocialLink } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/security";

const router: Router = Router();

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { label: "About Us",           url: "/about"   },
  { label: "Contact Us",         url: "/contact" },
  { label: "FAQ",                url: "/faq"     },
  { label: "Terms & Conditions", url: "/terms"   },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "Instagram", icon: "/icons/instagram2.png", url: "", enabled: true },
  { platform: "Threads",   icon: "/icons/threads2.png",   url: "", enabled: true },
  { platform: "TikTok",    icon: "/icons/tiktok2.png",    url: "", enabled: true },
  { platform: "WhatsApp",  icon: "/icons/whatsapp2.png",  url: "", enabled: true },
  { platform: "Website",   icon: "/icons/globe2.png",     url: "", enabled: true },
  { platform: "Email",     icon: "/icons/email2.png",     url: "", enabled: true },
];

async function getOrCreate() {
  const rows = await db.select().from(siteSettingsTable).limit(1);
  if (rows.length > 0) return rows[0];
  const inserted = await db
    .insert(siteSettingsTable)
    .values({ quickLinks: DEFAULT_QUICK_LINKS, socialLinks: DEFAULT_SOCIAL_LINKS })
    .returning();
  return inserted[0];
}

// ── Public: any visitor can read footer settings ────────────────────────────
router.get("/site-settings", async (_req, res) => {
  try {
    const settings = await getOrCreate();
    res.json(settings);
  } catch {
    res.status(500).json({ error: "Failed to load site settings" });
  }
});

// ── Admin: update quick links and/or social links ───────────────────────────
router.patch("/site-settings", requireAdmin, async (req, res) => {
  try {
    const { quickLinks, socialLinks } = req.body as {
      quickLinks?: QuickLink[];
      socialLinks?: SocialLink[];
    };
    const settings = await getOrCreate();
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (quickLinks  !== undefined) patch.quickLinks  = quickLinks;
    if (socialLinks !== undefined) patch.socialLinks = socialLinks;
    const updated = await db
      .update(siteSettingsTable)
      .set(patch)
      .where(eq(siteSettingsTable.id, settings.id))
      .returning();
    res.json(updated[0]);
  } catch {
    res.status(500).json({ error: "Failed to update site settings" });
  }
});

export default router;
