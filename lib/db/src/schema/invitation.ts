import { pgTable, serial, text, timestamp, boolean, integer, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type Contact = { name: string; phone: string };

export const invitationTable = pgTable("invitation", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  // Owner
  userId: integer("user_id"),
  businessId: integer("business_id"),
  packageId: integer("package_id"),
  isPurchased: boolean("is_purchased").notNull().default(false),
  websiteStatus: text("website_status").notNull().default("ACTIVE"),
  lockPinHash: text("lock_pin_hash"),
  // Basic info
  groomName: text("groom_name").notNull(),
  brideName: text("bride_name").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date").notNull(),
  eventDay: text("event_day").notNull(),
  eventTime: text("event_time").notNull(),
  eventStartTime: text("event_start_time"),
  eventEndTime: text("event_end_time"),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address").notNull(),
  venueCity: text("venue_city").notNull(),
  venueState: text("venue_state").notNull(),
  venueMapUrl: text("venue_map_url"),
  groomParents: text("groom_parents"),
  brideParents: text("bride_parents"),
  contactPhone: text("contact_phone").notNull().default(""),
  // JSON array of { name, phone } contacts (max 4). Legacy contactPhone is kept for migration.
  contacts: jsonb("contacts").$type<Contact[]>(),
  dresscode: text("dresscode"),
  message: text("message"),
  // Cover / front page fields
  language: text("language").notNull().default("ms"),
  shortCoupleName: text("short_couple_name"),
  groomShortName: text("groom_short_name"),
  brideShortName: text("bride_short_name"),
  coupleCount: integer("couple_count").default(1),
  groomInitial: text("groom_initial"),
  brideInitial: text("bride_initial"),
  coverGroomName: text("cover_groom_name"),
  coverBrideName: text("cover_bride_name"),
  envelopeInitials: text("envelope_initials"),
  envelopeInitialsSize: text("envelope_initials_size"),
  page2Initials: text("page2_initials"),
  logoInitialsUrl: text("logo_initials_url"),
  initialsImageUrl: text("initials_image_url"),
  initialsImageScale: integer("initials_image_scale").notNull().default(100),
  eventStartDateTime: text("event_start_date_time"),
  eventEndDateTime: text("event_end_date_time"),
  coverDateText: text("cover_date_text"),
  additionalInfo: text("additional_info"),
  coverTitle: text("cover_title"),
  hashtag: text("hashtag"),
  showFrontText: boolean("show_front_text").default(true),
  // Ayat undangan fields
  greetingText: text("greeting_text"),
  doaText: text("doa_text"),
  invitationText: text("invitation_text"),
  hostName: text("host_name"),
  hostCount: integer("host_count").default(1),
  // Lokasi fields
  venueHijriDate: text("venue_hijri_date"),
  schedule: text("schedule"),
  // Structured programme / itinerary: array of { time, event }
  itinerary: jsonb("itinerary").$type<{ time: string; event: string }[]>(),
  // Legacy RSVP flags — kept to avoid destructive schema prompts, not used by new flow
  rsvpShowSide: boolean("rsvp_show_side").notNull().default(false),
  rsvpMaxGuests: integer("rsvp_max_guests").notNull().default(5),
  // Gallery images (array of R2 keys or full URLs)
  galleryImages: jsonb("gallery_images").$type<string[]>(),
  // RSVP settings (per-invitation, independent for each card)
  rsvpEnabled: boolean("rsvp_enabled").notNull().default(false),
  rsvpAdditionalInfo: text("rsvp_additional_info"),
  rsvpDeadline: timestamp("rsvp_deadline"),
  rsvpIntroText: text("rsvp_intro_text"),
  rsvpFormNote: text("rsvp_form_note"),
  rsvpMaxOverallGuests: integer("rsvp_max_overall_guests").notNull().default(1000),
  rsvpMaxGuestsPerInvitation: integer("rsvp_max_guests_per_invitation").notNull().default(10),
  rsvpTimeSlots: text("rsvp_time_slots"), // JSON array of strings, e.g. ["10:00 AM","12:00 PM"]
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
  badgeFontSize: text("badge_font_size"),
  nameColor: text("name_color"),
  bodyFontFamily: text("body_font_family"),
  // Music override (per-invitation)
  musicUrl: text("music_url"),
  musicTitle: text("music_title"),
  musicArtist: text("music_artist"),
  // Footer / branding section
  showFooter: boolean("show_footer").notNull().default(true),
  footerText: text("footer_text"),
  footerUrl: text("footer_url"),
  socialLinks: jsonb("social_links").$type<{ platform: string; url: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvitationSchema = createInsertSchema(invitationTable).omit({ id: true, createdAt: true });
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitationTable.$inferSelect;

export const rsvpTable = pgTable("rsvp", {
  id: serial("id").primaryKey(),
  invitationToken: text("invitation_token").notNull().default("unknown"),
  name: text("name").notNull(),
  attending: boolean("attending").notNull(),
  numberOfGuests: integer("number_of_guests").notNull().default(1),
  // Legacy field — kept to avoid destructive schema prompts, not used by new RSVP flow
  side: text("side"),
  timeSlot: text("time_slot"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique("rsvp_invitation_name").on(t.invitationToken, t.name)]);

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
  badgeFontSize: text("badge_font_size"),
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

export const reviewTable = pgTable("review", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  weddingDate: text("wedding_date"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewTable.$inferSelect;
