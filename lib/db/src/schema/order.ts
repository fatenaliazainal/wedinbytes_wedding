import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orderTable = pgTable("order", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  invitationId: integer("invitation_id"),
  packageId: integer("package_id"),
  paymentStatus: text("payment_status").notNull().default("PENDING"),
  paymentReference: text("payment_reference"),
  paymentGateway: text("payment_gateway"),
  amount: text("amount").notNull().default("0"),
  // Optional buyer-supplied initials artwork. Stored on the order so each
  // purchase keeps its own upload and never changes a shared design template.
  initialsImageUrl: text("initials_image_url"),
  // ToyyibPay (or other gateway) transaction reference returned by the gateway
  gatewayRefNo: text("gateway_ref_no"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orderTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orderTable.$inferSelect;