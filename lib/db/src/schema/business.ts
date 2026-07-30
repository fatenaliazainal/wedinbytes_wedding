import { pgTable, serial, integer, text, boolean, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessProfileTable = pgTable("business_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  businessName: text("business_name").notNull().default(""),
  businessType: text("business_type").notNull().default("Other"),
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
  address: text("address"),
  googleMapsUrl: text("google_maps_url"),
  businessHours: text("business_hours"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("business_profile_user_id").on(table.userId),
]);

export const insertBusinessProfileSchema = createInsertSchema(businessProfileTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfileTable.$inferSelect;

export const businessClientTable = pgTable("business_client", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  packageId: integer("package_id"),
  invitationId: integer("invitation_id"),
  brideName: text("bride_name").notNull().default(""),
  groomName: text("groom_name").notNull().default(""),
  phone: text("phone"),
  email: text("email"),
  eventDate: text("event_date"),
  notes: text("notes"),
  customerData: jsonb("customer_data").$type<Record<string, string | boolean | number | null>>(),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("business_client_business_id_id").on(table.businessId, table.id),
]);

export const businessFormShareTable = pgTable("business_form_share", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  packageId: integer("package_id").notNull(),
  token: text("token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("business_form_share_business_id_id").on(table.businessId, table.id),
]);

export const insertBusinessClientSchema = createInsertSchema(businessClientTable)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBusinessClient = z.infer<typeof insertBusinessClientSchema>;
export type BusinessClient = typeof businessClientTable.$inferSelect;
export type BusinessFormShare = typeof businessFormShareTable.$inferSelect;