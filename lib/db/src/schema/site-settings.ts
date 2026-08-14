import { pgTable, serial, json, text, timestamp } from "drizzle-orm/pg-core";

export type QuickLink    = { label: string; url: string };
export type SocialLink   = { platform: string; icon: string; url: string; enabled: boolean };
export type FaqItem      = { question: string; answer: string };
export type FaqCategory  = { category: string; items: FaqItem[] };
export type TermsSection = { title: string; body: string };

export const siteSettingsTable = pgTable("site_settings", {
  id:               serial("id").primaryKey(),
  quickLinks:       json("quick_links").$type<QuickLink[]>().notNull().default([]),
  socialLinks:      json("social_links").$type<SocialLink[]>().notNull().default([]),
  faqItems:         json("faq_items").$type<FaqCategory[]>().notNull().default([]),
  termsSections:    json("terms_sections").$type<TermsSection[]>().notNull().default([]),
  contactWhatsapp:  text("contact_whatsapp").notNull().default(""),
  contactEmail:     text("contact_email").notNull().default(""),
  contactCompany:   text("contact_company").notNull().default(""),
  contactRegNo:     text("contact_reg_no").notNull().default(""),
  contactHours:     text("contact_hours").notNull().default(""),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
