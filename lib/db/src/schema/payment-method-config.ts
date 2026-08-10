import { pgTable, serial, boolean } from "drizzle-orm/pg-core";

/**
 * Single-row table (always id=1) that stores which payment gateways are enabled.
 * Managed by the admin via the Admin panel. Defaults: ToyyibPay on, Billplz off.
 */
export const paymentMethodConfigTable = pgTable("payment_method_config", {
  id: serial("id").primaryKey(),
  toyyibpayEnabled: boolean("toyyibpay_enabled").notNull().default(true),
  billplzEnabled: boolean("billplz_enabled").notNull().default(false),
});

export type PaymentMethodConfig = typeof paymentMethodConfigTable.$inferSelect;
