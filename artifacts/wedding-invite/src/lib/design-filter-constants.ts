/**
 * Shared catalog filter options for designs.
 * Used by both Admin (form + filter bar) and customer-facing catalog.
 * Admin assigns these tags to designs; customers use them to filter.
 */

export const DESIGN_COLORS = [
  "Burgundy",
  "Maroon",
  "Red",
  "Blush Pink",
  "Rose",
  "Pink",
  "Gold",
  "Yellow",
  "Cream",
  "Ivory",
  "White",
  "Sage Green",
  "Green",
  "Emerald",
  "Navy Blue",
  "Blue",
  "Royal Blue",
  "Dusty Rose",
  "Lavender",
  "Purple",
  "Terracotta",
  "Brown",
  "Caramel",
  "Black",
  "Charcoal",
] as const;

export type DesignColor = (typeof DESIGN_COLORS)[number];

export const DESIGN_CATEGORIES = [
  "Floral",
  "Classic",
  "Modern",
  "Minimalist",
  "Islamic",
  "Royal",
  "Rustic",
  "Garden",
  "Tropical",
  "Vintage",
] as const;

export type DesignCategory = (typeof DESIGN_CATEGORIES)[number];
