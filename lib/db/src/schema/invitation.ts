import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invitationTable = pgTable("invitation", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  // Owner
  userId: integer("user_id"),
  isPurchased: boolean("is_purchased").notNull().default(false),
  // Basic info
  groomName: text("groom_name").notNull(),
  brideName: text("bride_name").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date").notNull(),
  eventDay: text("event_day").notNull(),
  eventTime: text("event_time").notNull(),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address").notNull(),
  venueCity: text("venue_city").notNull(),
  venueState: text("venue_state").notNull(),
  venueMapUrl: text("venue_map_url"),
  groomParents: text("groom_parents"),
  brideParents: text("bride_parents"),
  contactPhone: text("contact_phone").notNull(),
  dresscode: text("dresscode"),
  message: text("message"),
  // Cover / front page fields
  shortCoupleName: text("short_couple_name"),
  coupleCount: integer("couple_count").default(1),
  groomInitial: text("groom_initial"),
  brideInitial: text("bride_initial"),
  eventStartDateTime: text("event_start_date_time"),
  eventEndDateTime: text("event_end_date_time"),
  coverDateText: text("cover_date_text"),
  additionalInfo: text("additional_info"),
  showFrontText: boolean("show_front_text").default(true),
  // Ayat undangan fields
  greetingText: text("greeting_text"),
  invitationText: text("invitation_text"),
  hostName: text("host_name"),
  hostCount: integer("host_count").default(1),
  // Lokasi fields
  venueHijriDate: text("venue_hijri_date"),
  schedule: text("schedule"),
  // Buyer design overrides (per-invitation, does NOT affect demo/global design)
  designCode: text("design_code"),
  openingAnimation: text("opening_animation"),
  openButtonText: text("open_button_text"),
  colorPrimary: text("color_primary"),
  colorSecondary: text("color_secondary"),
  colorBackground: text("color_background"),
  colorCard: text("color_card"),
  nameFontFamily: text("name_font_family"),
  nameFontSize: text("name_font_size"),
  nameColor: text("name_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvitationSchema = createInsertSchema(invitationTable).omit({ id: true, createdAt: true });
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitationTable.$inferSelect;

export const rsvpTable = pgTable("rsvp", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  attending: boolean("attending").notNull(),
  numberOfGuests: integer("number_of_guests").notNull().default(1),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRsvpSchema = createInsertSchema(rsvpTable).omit({ id: true, createdAt: true });
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type Rsvp = typeof rsvpTable.$inferSelect;

export const cardDesignTable = pgTable("card_design", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(false),
  // Design code e.g. FL001
  designCode: text("design_code"),
  // Images
  envelopeImageUrl: text("envelope_image_url"),
  cardImageUrl: text("card_image_url"),
  // Music
  musicUrl: text("music_url"),
  musicTitle: text("music_title"),
  musicArtist: text("music_artist"),
  // Colors (HSL space-separated strings, e.g. "120 25% 55%")
  colorPrimary: text("color_primary"),
  colorSecondary: text("color_secondary"),
  colorAccent: text("color_accent"),
  colorBackground: text("color_background"),
  colorCard: text("color_card"),
  // Typography (Google Font names)
  fontHeading: text("font_heading"),
  fontBody: text("font_body"),
  // Name styling
  nameFontFamily: text("name_font_family"),
  nameFontSize: text("name_font_size"),
  nameColor: text("name_color"),
  // Layout
  cardMaxWidth: text("card_max_width"),
  openingAnimation: text("opening_animation").default("doors"),
  openButtonText: text("open_button_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCardDesignSchema = createInsertSchema(cardDesignTable).omit({ id: true, createdAt: true });
export type InsertCardDesign = z.infer<typeof insertCardDesignSchema>;
export type CardDesign = typeof cardDesignTable.$inferSelect;
