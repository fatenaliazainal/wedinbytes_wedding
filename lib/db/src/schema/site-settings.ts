import { pgTable, serial, json, timestamp } from "drizzle-orm/pg-core";

export type QuickLink = { label: string; url: string };
export type SocialLink = { platform: string; icon: string; url: string; enabled: boolean };

export const siteSettingsTable = pgTable("site_settings", {
  id:           serial("id").primaryKey(),
  quickLinks:   json("quick_links").$type<QuickLink[]>().notNull().default([]),
  socialLinks:  json("social_links").$type<SocialLink[]>().notNull().default([]),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
