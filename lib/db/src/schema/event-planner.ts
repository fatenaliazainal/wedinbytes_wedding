import { pgTable, serial, integer, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventPlannerProfileTable = pgTable("event_planner_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  companyName: text("company_name").notNull().default(""),
  displayName: text("display_name").notNull().default(""),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  website: text("website"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  logoUrl: text("logo_url"),
  coverImage: text("cover_image"),
  businessAddress: text("business_address"),
  googleMapsUrl: text("google_maps_url"),
  businessHours: text("business_hours"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("event_planner_profile_user_id").on(table.userId),
]);

export const insertEventPlannerProfileSchema = createInsertSchema(eventPlannerProfileTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEventPlannerProfile = z.infer<typeof insertEventPlannerProfileSchema>;
export type EventPlannerProfile = typeof eventPlannerProfileTable.$inferSelect;