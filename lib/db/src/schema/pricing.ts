import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pricingPackageTable = pgTable("pricing_package", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  description: text("description").notNull().default(""),
  badgeText: text("badge_text").notNull().default(""),
  showBadge: boolean("show_badge").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPricingPackageSchema = createInsertSchema(pricingPackageTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPricingPackage = z.infer<typeof insertPricingPackageSchema>;
export type PricingPackage = typeof pricingPackageTable.$inferSelect;

export const pricingFeatureTable = pgTable("pricing_feature", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("Check"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPricingFeatureSchema = createInsertSchema(pricingFeatureTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPricingFeature = z.infer<typeof insertPricingFeatureSchema>;
export type PricingFeature = typeof pricingFeatureTable.$inferSelect;
