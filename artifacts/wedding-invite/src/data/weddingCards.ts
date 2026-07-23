export interface WeddingCard {
  slug: string;
  title: string;
  subtitle: string;
}

export interface WeddingCardFeature {
  icon: string;
  title: string;
  description: string;
}

export const WEDDING_CARDS: WeddingCard[] = [
  { slug: "hanging-floral", title: "Hanging Floral", subtitle: "Elegant floral invitation with a warm feel." },
  { slug: "garden-script-wedding", title: "Garden Script Wedding", subtitle: "Classic script styling with soft botanical accents." },
  { slug: "boho-ring-bouquet", title: "Boho Ring Bouquet", subtitle: "Modern boho palette with romantic florals." },
  { slug: "white-floral", title: "White Floral", subtitle: "Minimal floral framing for a clean premium look." },
  { slug: "vintage-floral-wallpaper", title: "Vintage Floral Wallpaper", subtitle: "Patterned and ornate with a timeless touch." },
  { slug: "natural-wedding", title: "Natural Wedding", subtitle: "Soft natural tones with an understated layout." },
  { slug: "cream-gold-wedding", title: "Cream & Gold Wedding", subtitle: "Cream and gold styling for an elegant ceremony." },
  { slug: "gilded-floral", title: "Gilded Floral", subtitle: "Refined gold border with floral detailing." },
  { slug: "golden-greenery", title: "Golden Greenery", subtitle: "Leafy greenery accents with a luxe finish." },
  { slug: "mr-mrs", title: "Mr. & Mrs.", subtitle: "A clean, modern title-first invitation style." },
  { slug: "mrs-mrs", title: "Mrs. & Mrs.", subtitle: "A beautiful same-day invitation concept." },
  { slug: "mr-mr", title: "Mr. & Mr.", subtitle: "A polished invitation concept for two grooms." },
  { slug: "rustic-charm", title: "Rustic Charm", subtitle: "Warm rustic tones with handcrafted details." },
  { slug: "wildflower-garden", title: "Wildflower Garden", subtitle: "Loose wildflower arrangements with an organic feel." },
  { slug: "mediterranean-citrus", title: "Mediterranean Citrus", subtitle: "Vibrant citrus palette inspired by the Mediterranean." },
  { slug: "spring-greenery", title: "Spring Greenery", subtitle: "Fresh spring leaves with a light, airy layout." },
  { slug: "blush-romance", title: "Blush Romance", subtitle: "Soft blush tones with romantic calligraphy." },
  { slug: "terracotta-bloom", title: "Terracotta Bloom", subtitle: "Warm earthy tones with bold botanical prints." },
  { slug: "midnight-garden", title: "Midnight Garden", subtitle: "Deep moody florals on a dark, dramatic background." },
  { slug: "dusty-rose-elegance", title: "Dusty Rose Elegance", subtitle: "Muted rose tones for a timeless, refined look." },
  { slug: "sage-ribbon", title: "Sage & Ribbon", subtitle: "Sage green accents tied with a classic ribbon motif." },
  { slug: "linen-luxe", title: "Linen Luxe", subtitle: "Textured linen feel with minimal gold typography." },
  { slug: "blue-hydrangea", title: "Blue Hydrangea", subtitle: "Cool blue florals for a fresh, elegant ceremony." },
  { slug: "peony-perfection", title: "Peony Perfection", subtitle: "Lush peony illustrations for a romantic celebration." },
];

export const CARD_FEATURES = [
  { icon: "Wand2", title: "Personalise Your Message", description: "Customise fonts, colours, and text to match your event theme." },
  { icon: "Mail", title: "Customise Your Envelope", description: "Choose envelope decorations, inner lining, and preferred stamps." },
  { icon: "MessageSquareQuote", title: "Send via Text or Email", description: "Deliver invitations the way your guests like to receive them." },
  { icon: "ClipboardList", title: "Track RSVPs", description: "Monitor RSVPs in real-time and follow up with guests." },
];

export const SIMILAR_CARD_SLUGS = [
  "rustic-charm",
  "wildflower-garden",
  "mediterranean-citrus",
  "spring-greenery",
];
