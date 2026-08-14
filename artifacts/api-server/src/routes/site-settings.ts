import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import type { QuickLink, SocialLink, FaqCategory, TermsSection } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/security";

const router: Router = Router();

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { label: "About Us",           url: "/about"   },
  { label: "Contact Us",         url: "/contact" },
  { label: "FAQ",                url: "/faq"     },
  { label: "Terms & Conditions", url: "/terms"   },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "Instagram", icon: "/icons/instagram2.png", url: "", enabled: true },
  { platform: "Threads",   icon: "/icons/threads2.png",   url: "", enabled: true },
  { platform: "TikTok",    icon: "/icons/tiktok2.png",    url: "", enabled: true },
  { platform: "WhatsApp",  icon: "/icons/whatsapp2.png",  url: "", enabled: true },
  { platform: "Website",   icon: "/icons/globe2.png",     url: "", enabled: true },
  { platform: "Email",     icon: "/icons/email2.png",     url: "", enabled: true },
];

const DEFAULT_FAQ_ITEMS: FaqCategory[] = [
  {
    category: "General",
    items: [
      { question: "What is Wedinstudio?", answer: "Wedinstudio is a Malaysian digital wedding invitation platform. You can create, customise, and share a beautiful online invitation with your guests via a link — no printing, no postage, no hassle." },
      { question: "What is the difference between a digital invitation and a physical card?", answer: "A digital invitation is shared as a link. Guests open it on their phone or computer and see a beautifully animated card with background music, a GPS location button, and an online RSVP. No printing costs, and no card left behind at home." },
    ],
  },
  {
    category: "Getting Started",
    items: [
      { question: "How do I create my digital wedding invitation?", answer: "It's simple — just follow these 4 steps:\n1. Choose a package (Standard, Premium, or Signature)\n2. Fill in your wedding details — couple names, date, venue, and more\n3. Complete payment to activate your invitation\n4. Share your unique link with guests via WhatsApp or social media" },
      { question: "Do I need any technical knowledge?", answer: "Not at all. Everything is done through simple forms. Just type in your wedding details and Wedinstudio will generate your beautiful invitation automatically." },
      { question: "Can I preview my invitation before paying?", answer: "Yes. After registering and filling in your basic details, you can preview your invitation for free. Payment is only required to activate and share the link with guests." },
    ],
  },
  {
    category: "Features",
    items: [
      { question: "Can my guests RSVP through the invitation?", answer: "Yes. Guests can confirm their attendance directly through the card — selecting whether they'll attend, stating the number of guests, and leaving their name. All responses are collected in your dashboard." },
      { question: "Can guests leave wishes for the couple?", answer: "Yes. There is a dedicated wishes section in the invitation. Guests can write congratulatory messages or prayers, and everything is saved in your card for you to read anytime." },
      { question: "Will I receive an email notification when a guest RSVPs?", answer: "Yes — every time a guest submits an RSVP, you will receive a notification to your registered email address. This feature is active as soon as your payment is completed." },
      { question: "Can I add background music?", answer: "Yes. Background music is available in all packages — Standard, Premium, and Signature. Guests can mute or unmute it as they prefer." },
      { question: "Can I add a photo gallery?", answer: "Yes — Photo Gallery is available in the Premium and Signature packages. You can upload cherished photos to be displayed beautifully inside the invitation." },
      { question: "Is there a Dress Code feature?", answer: "Yes — Dress Code is available in the Premium and Signature packages. You can set a colour theme or attire guideline for guests, complete with a colour palette display." },
      { question: "Can I add a Money Gift or bank QR code?", answer: "Yes — Money Gift is available in the Premium and Signature packages. You can upload a QR code for your bank account or e-wallet to make it easy for guests to send gifts." },
      { question: "What are Gift Corner and Gift Registry?", answer: "Gift Corner and Gift Registry are exclusive to the Signature package. Gift Corner lets you list items you'd love to receive, while Gift Registry lets guests 'claim' a gift they plan to bring — preventing duplicates." },
    ],
  },
  {
    category: "Editing & Customisation",
    items: [
      { question: "Can I edit my invitation details after paying?", answer: "Yes. Everything is editable — couple names, event date, venue, time, music, gallery, RSVP settings, and more — right up until your event date. Once the event date has passed, the editor is closed and the invitation becomes view-only for guests until it expires three months later." },
      { question: "Will my invitation link change if I update the names or event date?", answer: "No. Your public link is permanently locked at the moment of payment, based on the names and date you had at that time. You can freely edit names and the event date afterwards — the link shared with your guests will never change." },
      { question: "Can I choose the language for my invitation?", answer: "Yes. You can choose between Bahasa Melayu or English for the text displayed in your invitation." },
      { question: "How long is my invitation active?", answer: "Your invitation stays active for three months after your event date. For example, if your wedding is on 1 August 2026, your invitation will expire on 1 November 2026. This gives late-opening guests time to still access the card after the event." },
    ],
  },
  {
    category: "Sharing",
    items: [
      { question: "How do I share my digital invitation with guests?", answer: "You will have a unique link such as wedinstudio.com/invite/260814/amirul-amira. Share it via WhatsApp, Telegram, Instagram, or any messaging platform. Guests simply tap the link and the invitation opens instantly — no app required." },
      { question: "Can guests open the invitation on their phones?", answer: "Yes. Wedinstudio invitations are designed specifically for mobile phones. They also work on tablets and computers. Guests do not need to download anything." },
    ],
  },
  {
    category: "Packages & Payment",
    items: [
      { question: "What packages are available and how much do they cost?", answer: "We offer three packages:\n- Standard — RM50: RSVP & Wishes, GPS Location, Countdown, Background Music, Calendar\n- Premium — RM60: Everything in Standard + Photo Gallery, Money Gift, Dress Code\n- Signature — RM70: Everything in Premium + Gift Corner & Gift Registry\n\nVisit our Packages page at /pricing for a full feature comparison." },
      { question: "What is the difference between Standard, Premium, and Signature?", answer: "Standard covers all the essentials for a complete invitation. Premium adds Photo Gallery, Money Gift, and Dress Code — ideal for couples who want more personalisation. Signature goes further with Gift Corner and Gift Registry for the most complete invitation experience." },
      { question: "What do I need to complete before I can make payment?", answer: "Before payment, you need to fill in the groom's name, bride's name, and the official event date in the Edit section. This information is needed to generate your unique invitation URL. Once payment is made, the URL cannot be changed." },
      { question: "What payment methods are accepted?", answer: "We accept payment via FPX (all major Malaysian banks), credit/debit card, and e-wallet through the ToyyibPay and Billplz payment gateways. Payment is secure and processed instantly." },
      { question: "Can I change my package after paying?", answer: "Package changes are not available after payment has been made. For further assistance, please contact us on WhatsApp at +601128134211." },
      { question: "Are there any recurring charges after the first payment?", answer: "No. It is a one-time payment. There are no monthly fees or hidden charges. Your invitation remains active until three months after your event date." },
    ],
  },
  {
    category: "Support",
    items: [
      { question: "How do I contact Wedinstudio if I have a problem?", answer: "You can reach us directly via WhatsApp at +601128134211. We are available Monday to Saturday." },
    ],
  },
];

const DEFAULT_TERMS_SECTIONS: TermsSection[] = [
  { title: "1. Acceptance of Terms", body: "By accessing or using Wedinstudio (\"the Service\"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service." },
  { title: "2. Description of Service", body: "Wedinstudio provides a digital wedding invitation platform that allows users to create, customise, and share online wedding invitations. Features include RSVP management, photo galleries, gift registry, music, and countdown timers. Features available to you depend on the package you have purchased. Business Account users may additionally manage multiple client invitations, share dedicated order forms, and access a centralised client dashboard." },
  { title: "3. Account Registration", body: "You must provide accurate and complete information when registering an account. Two account types are available: Buyer accounts for individual couples, and Business Accounts for wedding professionals managing client invitations. You are responsible for maintaining the security of your account credentials. Wedinstudio is not liable for any loss arising from unauthorised access to your account." },
  { title: "4. Payments & Packages", body: "All payments are processed securely through our supported payment gateways, which include ToyyibPay and Billplz. Package prices are listed in Malaysian Ringgit (RM). Once a package is purchased and the invitation is activated, no refunds will be issued unless required by applicable law. For Business Accounts, package pricing applies per client invitation. Purchased package features are fixed upon payment and cannot be downgraded." },
  { title: "5. Invitation Content & Uploads", body: "You are solely responsible for the content of your invitation, including text, images, audio, and any files uploaded to the platform (including photo galleries, gift QR codes, and initials artwork). You must not upload content that is unlawful, offensive, defamatory, or infringes on any third-party rights. Uploaded files are stored securely and served exclusively through the platform. Wedinstudio reserves the right to remove any content that violates these terms." },
  { title: "6. Intellectual Property", body: "The Wedinstudio platform, including its designs, templates, card designs, and software, is the property of Wedinstudio and is protected by applicable intellectual property laws. You retain ownership of the personal content you upload to your invitation. By uploading content, you grant Wedinstudio a limited, non-exclusive licence to store and serve that content solely for the purpose of operating the Service." },
  { title: "7. Invitation Expiry & Edit Lock", body: "Digital invitations are accessible to guests for a period of three (3) calendar months from the date of your wedding event. After this period, the invitation link will no longer be publicly accessible. Additionally, paid invitations become read-only after the event date has passed — content editing is disabled at that point to preserve the integrity of the invitation record." },
  { title: "8. RSVP & Guest Data", body: "Wedinstudio provides built-in RSVP functionality. Guest names, attendance status, guest counts, time slot selections, and messages submitted through RSVP forms are stored and accessible to the invitation owner. You are responsible for handling guest data in accordance with applicable privacy laws. Wedinstudio does not use RSVP data for any purpose other than operating the Service." },
  { title: "9. Business Account Terms", body: "Business Account users may create and manage invitations on behalf of clients. You are responsible for obtaining appropriate consent from your clients to collect and process their personal information through the platform. Client order form data submitted through Wedinstudio is stored securely and accessible only to the Business Account that created the form. Wedinstudio is not a party to any agreement between a Business Account and its clients." },
  { title: "10. Privacy", body: "We collect and process your personal information in accordance with our privacy practices. Your data is used solely to provide and improve the Service. We do not sell or share your personal information with third parties for marketing purposes. For details on data collected, how it is used, and your rights, please refer to our Privacy Policy." },
  { title: "11. Limitation of Liability", body: "Wedinstudio is provided on an \"as is\" basis. We do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, Wedinstudio shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of data, loss of revenue, or interruption of service." },
  { title: "12. Changes to Terms", body: "We reserve the right to update these Terms and Conditions at any time. We will notify users of significant changes via email or an in-app notice at least 15 days before the changes take effect. Continued use of the Service after changes are posted constitutes your acceptance of the revised terms." },
  { title: "13. Governing Law", body: "These Terms and Conditions are governed by the laws of Malaysia. Any disputes arising from the use of the Service shall be subject to the exclusive jurisdiction of the courts of Malaysia." },
  { title: "14. Contact", body: "If you have any questions about these Terms and Conditions, please contact us via WhatsApp at +601128134211 or by email at support@wedinstudio.com." },
];

async function getOrCreate() {
  const rows = await db.select().from(siteSettingsTable).limit(1);
  if (rows.length === 0) {
    const inserted = await db
      .insert(siteSettingsTable)
      .values({
        quickLinks:    DEFAULT_QUICK_LINKS,
        socialLinks:   DEFAULT_SOCIAL_LINKS,
        faqItems:      DEFAULT_FAQ_ITEMS,
        termsSections: DEFAULT_TERMS_SECTIONS,
      })
      .returning();
    return inserted[0];
  }
  // Backfill any columns that are still empty from before migration
  const row = rows[0];
  const patch: Record<string, unknown> = {};
  if (!row.quickLinks?.length)    patch.quickLinks    = DEFAULT_QUICK_LINKS;
  if (!row.socialLinks?.length)   patch.socialLinks   = DEFAULT_SOCIAL_LINKS;
  if (!row.faqItems?.length)      patch.faqItems      = DEFAULT_FAQ_ITEMS;
  if (!row.termsSections?.length) patch.termsSections = DEFAULT_TERMS_SECTIONS;
  if (Object.keys(patch).length === 0) return row;
  const updated = await db
    .update(siteSettingsTable)
    .set(patch)
    .where(eq(siteSettingsTable.id, row.id))
    .returning();
  return updated[0];
}

// ── Public ───────────────────────────────────────────────────────────────────
router.get("/site-settings", async (_req, res) => {
  try {
    const settings = await getOrCreate();
    res.json(settings);
  } catch {
    res.status(500).json({ error: "Failed to load site settings" });
  }
});

// ── Admin ────────────────────────────────────────────────────────────────────
router.patch("/site-settings", requireAdmin, async (req, res) => {
  try {
    const { quickLinks, socialLinks, faqItems, termsSections } = req.body as {
      quickLinks?:    QuickLink[];
      socialLinks?:   SocialLink[];
      faqItems?:      FaqCategory[];
      termsSections?: TermsSection[];
    };
    const settings = await getOrCreate();
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (quickLinks    !== undefined) patch.quickLinks    = quickLinks;
    if (socialLinks   !== undefined) patch.socialLinks   = socialLinks;
    if (faqItems      !== undefined) patch.faqItems      = faqItems;
    if (termsSections !== undefined) patch.termsSections = termsSections;
    const updated = await db
      .update(siteSettingsTable)
      .set(patch)
      .where(eq(siteSettingsTable.id, settings.id))
      .returning();
    res.json(updated[0]);
  } catch {
    res.status(500).json({ error: "Failed to update site settings" });
  }
});

export default router;
