import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const waxSealTable = pgTable("wax_seal", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WaxSeal = typeof waxSealTable.$inferSelect;
export type InsertWaxSeal = typeof waxSealTable.$inferInsert;
