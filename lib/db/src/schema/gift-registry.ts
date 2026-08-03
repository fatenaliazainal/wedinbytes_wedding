import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const giftRegistryItemTable = pgTable("gift_registry_item", {
  id: serial("id").primaryKey(),
  invitationToken: text("invitation_token").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  thumbnailUrl: text("thumbnail_url"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type GiftRegistryItem = typeof giftRegistryItemTable.$inferSelect;
