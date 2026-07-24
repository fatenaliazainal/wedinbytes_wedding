import React from "react";
import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import { type Invitation } from "@workspace/api-client-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { resolveImageUrl } from "@/lib/r2-url";

interface WeddingCardProps {
  invitation?: Invitation;
  cardImageUrl?: string;
  envelopeImageUrl?: string;
  cardMaxWidth?: string;
}

const MONTH_MAP: Record<string, string> = {
  Januari: "01", Februari: "02", Mac: "03", April: "04",
  Mei: "05", Jun: "06", Julai: "07", Ogos: "08",
  September: "09", Oktober: "10", November: "11", Disember: "12",
  January: "01", February: "02", March: "03", May: "05",
  June: "06", July: "07", August: "08", October: "10", December: "12",
};

function formatDatePipes(dateStr: string): string {
  const parts = dateStr.trim().split(" ");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = MONTH_MAP[parts[1]] ?? parts[1];
    const year = parts[2];
    return `${day} | ${month} | ${year}`;
  }
  return dateStr;
}

function OrnamentDivider() {
  return (
    <div className="flex items-center justify-center w-full my-1">
      <svg width="120" height="18" viewBox="0 0 120 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="9" x2="50" y2="9" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.8"/>
        <path d="M55 9 L60 4 L65 9 L60 14 Z" fill="currentColor" fillOpacity="0.4"/>
        <line x1="70" y1="9" x2="120" y2="9" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.8"/>
      </svg>
    </div>
  );
}

function calculateTimeLeft(targetDate: string) {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;
  if (isNaN(target) || diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Countdown({ targetDate, labels }: { targetDate: string; labels: { days: string; hours: string; minutes: string; seconds: string; started: string } }) {
  const [timeLeft, setTimeLeft] = React.useState(() => calculateTimeLeft(targetDate));

  React.useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <p className="text-sm text-foreground/70">{labels.started}</p>;
  }

  const units = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 text-center w-full max-w-xs">
      {units.map((u) => (
        <div key={u.label} className="bg-white/50 rounded-lg p-2 border border-primary/10">
          <p className="text-xl font-bold text-primary">{u.value}</p>
          <p className="text-[9px] uppercase text-foreground/60">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.009-.57-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function RevealOnScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function normalizeContacts(raw: unknown, fallbackPhone?: string): { name: string; phone: string }[] {
  const parsed = Array.isArray(raw)
    ? raw
        .filter((c): c is { name?: unknown; phone?: unknown } => c && typeof c === "object")
        .map((c) => ({ name: String(c.name ?? ""), phone: String(c.phone ?? "") }))
    : [];
  if (parsed.length > 0) return parsed;
  if (fallbackPhone) return [{ name: "Contact", phone: fallbackPhone }];
  return [];
}

const CARD_TEXT = {
  ms: {
    coverTitle: "RAIKAN CINTA",
    greeting: "Assalamualaikum wbt & salam sejahtera",
    invitation: "Dengan penuh kesyukuran, kami menjemput Dato' | Datin | Tuan | Puan | Encik | Cik ke majlis perkahwinan anakanda kami.",
    prayer: "Ya Allah, berkatilah majlis perkahwinan kami. Satukanlah hati kami sebagaimana Engkau satukan hati Adam & Hawa.",
    rsvpPrompt: "Sila sahkan kehadiran anda.",
    setDateTime: "Sila tetapkan tarikh & masa majlis.",
    eventStarted: "Majlis telah bermula",
    guestWishes: "Ucapan dan doa daripada tetamu akan dipaparkan di sini.",
    dateLabel: "TARIKH",
    dayLabel: "HARI",
    timeLabel: "MASA",
    locationLabel: "LOKASI",
    programmeLabel: "ATUR CARA MAJLIS",
    dressCodeLabel: "TEMA PAKAIAN",
    prayerLabel: "Doa",
    countdownLabel: "Countdown",
    galleryLabel: "Galeri",
    attendanceLabel: "Kehadiran",
    wishesLabel: "Ucapan",
    contactLabel: "Hubungi",
    viewOnMap: "Buka Google Maps",
    days: "Hari",
    hours: "Jam",
    minutes: "Minit",
    seconds: "Saat",
  },
  en: {
    coverTitle: "Wedding Reception",
    greeting: "Assalamualaikum & warm greetings",
    invitation: "With heartfelt gratitude, we joyfully invite Dato' | Datin | Tuan | Puan | Mr. | Ms. to the wedding of our beloved children.",
    prayer: "O Allah, bless our wedding. Unite our hearts as You united the hearts of Adam & Hawa.",
    rsvpPrompt: "Please confirm your attendance.",
    setDateTime: "Please set the event date & time.",
    eventStarted: "The event has started",
    guestWishes: "Guest wishes and prayers will appear here.",
    dateLabel: "DATE",
    dayLabel: "DAY",
    timeLabel: "TIME",
    locationLabel: "LOCATION",
    programmeLabel: "EVENT PROGRAMME",
    dressCodeLabel: "DRESS CODE",
    prayerLabel: "Prayer",
    countdownLabel: "Countdown",
    galleryLabel: "Gallery",
    attendanceLabel: "RSVP",
    wishesLabel: "Wishes",
    contactLabel: "Contact",
    viewOnMap: "Open in Google Maps",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
  },
};

export function WeddingCard({ invitation, cardImageUrl, envelopeImageUrl, cardMaxWidth }: WeddingCardProps) {
  if (!invitation) return null;

  const maxWidth = cardMaxWidth || "420px";
  const inv = invitation as unknown as Record<string, unknown>;
  const lang = (inv.language as "ms" | "en") || "ms";
  const t = CARD_TEXT[lang];

  const coverTitle = (inv.coverTitle as string) || t.coverTitle;
  const hashtag = (inv.hashtag as string) || "";
  const greetingText = (inv.greetingText as string) || t.greeting;
  const invitationText = (inv.invitationText as string) || t.invitation;
  const doaText = (inv.doaText as string) || t.prayer;
  const schedule = inv.schedule as string | undefined;
  const showFrontText = inv.showFrontText !== false && inv.showFrontText !== "false";

  const brideShort = (inv.brideShortName as string | undefined)?.trim() || "";
  const groomShort = (inv.groomShortName as string | undefined)?.trim() || "";
  const shortCoupleName = (inv.shortCoupleName as string | undefined)?.trim() || "";
  const coupleParts = shortCoupleName.includes(" & ")
    ? shortCoupleName.split(" & ").map((s) => s.trim())
    : [];
  const brideName = brideShort || coupleParts[0] || invitation.brideName?.trim() || "";
  const groomName = groomShort || coupleParts[1] || invitation.groomName?.trim() || "";

  const nameStyle: React.CSSProperties = {
    fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
    fontSize: "var(--name-font-size, 3rem)",
    color: "var(--name-color, hsl(var(--foreground, 0 0% 10%)))",
    lineHeight: 1.15,
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
  };
  const bodyFontFamily = "var(--body-font-family, 'Dancing Script', cursive)";

  const sectionBase = "relative min-h-(--card-viewport-height,100dvh) flex flex-col items-center justify-center overflow-hidden";
  const coverPanelBase = "relative z-10 flex flex-col items-center text-center px-7 py-10 gap-4 w-full";
  const detailBlock = "w-full max-w-sm text-center space-y-4";
  const detailLabel = "text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase";

  const countdownLabels = { days: t.days, hours: t.hours, minutes: t.minutes, seconds: t.seconds, started: t.eventStarted };
  const bgUrl = cardImageUrl || envelopeImageUrl;

  function PageBackground({ imageUrl }: { imageUrl?: string }) {
    if (!imageUrl) return <div className="absolute inset-0 bg-secondary" />;
    return (
      <img
        src={imageUrl}
        aria-hidden
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />
    );
  }

  const contacts = normalizeContacts(inv.contacts, invitation.contactPhone);
  const mapsUrl = (inv.venueMapUrl as string) ||
    `https://maps.google.com/?q=${encodeURIComponent((invitation.venueName ?? "") + " " + (invitation.venueCity ?? ""))}`;

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth }}>
      {/* ── PAGE 1: MAIN INVITATION / COVER ── */}
      <section className={sectionBase}>
        <PageBackground imageUrl={bgUrl} />
        {showFrontText && (
          <div className={coverPanelBase}>
            <p className="text-[10px] font-semibold tracking-[0.35em] text-primary uppercase mb-8">{coverTitle}</p>
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm">{groomName}</h1>
            {(brideName && groomName) && (
              <span style={{ ...nameStyle, fontSize: "calc(var(--name-font-size, 3rem) * 0.5)" }} className="text-primary my-1 drop-shadow-sm">
                &amp;
              </span>
            )}
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm mb-4">{brideName}</h1>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-foreground/70 uppercase">{invitation.eventDay}</p>
            <p className="text-sm text-foreground/80 mt-1 mb-5 tracking-widest">{formatDatePipes(invitation.eventDate ?? "")}</p>
            {hashtag && (
              <p className="text-xs italic text-primary/80" style={{ fontFamily: bodyFontFamily }}>{hashtag}</p>
            )}
          </div>
        )}
      </section>

      {/* ── PAGE 2: WEDDING DETAILS (scrollable) ── */}
      <section
        className="relative"
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "scroll",
          backgroundColor: bgUrl ? undefined : "hsl(var(--secondary))",
        }}
      >
        <div className="absolute inset-0 bg-white/70 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-14 py-16 px-6">

          <RevealOnScroll>
          {/* Invitation Text */}
          <div className={detailBlock}>
            <p className="text-xl text-primary leading-snug" style={{ fontFamily: nameStyle.fontFamily }} dangerouslySetInnerHTML={{ __html: greetingText }} />
            <OrnamentDivider />
            {(invitation.brideParents || invitation.groomParents) && (
              <div className="space-y-1">
                {invitation.groomParents && (
                  <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: invitation.groomParents }} />
                )}
                {invitation.brideParents && invitation.groomParents && (
                  <p className="text-primary text-sm font-semibold">&amp;</p>
                )}
                {invitation.brideParents && (
                  <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: invitation.brideParents }} />
                )}
              </div>
            )}
            <p className="text-xs text-foreground/70 italic leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: invitationText }} />
            <div className="space-y-0.5">
              <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{invitation.groomName}</p>
              <p className="text-sm text-foreground/60">&amp;</p>
              <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{invitation.brideName}</p>
            </div>
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Date & Location */}
          <div className={detailBlock}>
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.dateLabel}</p>
            <OrnamentDivider />
            <div className="space-y-1">
              <p className={detailLabel}>{t.dayLabel}</p>
              <p className="font-bold text-sm text-foreground tracking-[0.2em] uppercase">{invitation.eventDay}</p>
              <p className="text-lg text-foreground tracking-widest" style={{ fontFamily: bodyFontFamily }}>{formatDatePipes(invitation.eventDate ?? "")}</p>
            </div>
            <div className="space-y-1">
              <p className={detailLabel}>{t.timeLabel}</p>
              <p className="text-base text-foreground" style={{ fontFamily: bodyFontFamily }}>{invitation.eventTime}</p>
            </div>
            <div className="space-y-1.5">
              <p className={detailLabel}>{t.locationLabel}</p>
              <p className="text-base italic text-primary" style={{ fontFamily: bodyFontFamily }}>{invitation.venueName}</p>
              {invitation.venueAddress && (
                <p className="text-xs text-foreground/70 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: invitation.venueAddress }} />
              )}
              <p className="text-xs text-foreground/60">{invitation.venueCity}, {invitation.venueState}</p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-2.5 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold tracking-wide shadow"
            >
              {t.viewOnMap}
            </a>
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Programme & Dress Code */}
          {schedule && (
            <div className={detailBlock}>
              <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.programmeLabel}</p>
              <OrnamentDivider />
              <p className="text-xs text-foreground/75 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: schedule }} />
              {invitation.dresscode && (
                <p className="text-[10px] text-foreground/60 border border-primary/25 bg-white/40 rounded-full px-5 py-1.5 inline-block tracking-wider">
                  {t.dressCodeLabel}: {invitation.dresscode.toUpperCase()}
                </p>
              )}
            </div>
          )}
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Prayer */}
          <div className={detailBlock}>
            <p className="text-sm text-foreground/80 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: doaText }} />
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Countdown */}
          <div className={detailBlock}>
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.countdownLabel}</p>
            <OrnamentDivider />
            {(inv.eventStartDateTime as string) ? (
              <Countdown targetDate={inv.eventStartDateTime as string} labels={countdownLabels} />
            ) : (
              <p className="text-sm text-foreground/70">{t.setDateTime}</p>
            )}
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* RSVP */}
          <div className={detailBlock}>
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.attendanceLabel}</p>
            <OrnamentDivider />
            <p className="text-sm text-foreground/70">{t.rsvpPrompt}</p>
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Wishes / Guestbook */}
          <div className={detailBlock}>
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.wishesLabel}</p>
            <OrnamentDivider />
            <p className="text-sm text-foreground/70" dangerouslySetInnerHTML={{ __html: (inv.message as string) || t.guestWishes }} />
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Contact */}
          {contacts.length > 0 && (
            <div className={detailBlock}>
              <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.contactLabel}</p>
              <OrnamentDivider />
              <div className="w-full space-y-3">
                {contacts.map((contact, idx) => {
                  const dial = contact.phone?.replace(/\D/g, "");
                  return (
                    <div
                      key={idx}
                      className="w-full bg-white/60 rounded-2xl p-4 border border-primary/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground" style={{ fontFamily: bodyFontFamily }}>{contact.name || "Contact"}</p>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: bodyFontFamily }}>{contact.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`tel:${contact.phone}`}
                          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                          aria-label={`Call ${contact.name}`}
                        >
                          <Phone size={18} />
                        </a>
                        {dial && (
                          <a
                            href={`https://wa.me/${dial}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                            aria-label={`WhatsApp ${contact.name}`}
                          >
                            <WhatsAppIcon className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Gallery */}
          <div className={detailBlock}>
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.galleryLabel}</p>
            <OrnamentDivider />
            {(() => {
              const images = Array.isArray(inv.galleryImages) ? (inv.galleryImages as string[]) : [];
              return images.length > 0 ? (
                <Carousel className="w-full max-w-xs">
                  <CarouselContent>
                    {images.map((url, idx) => {
                      const resolved = resolveImageUrl(url);
                      return (
                        <CarouselItem key={idx}>
                          <img
                            src={resolved}
                            alt={`${t.galleryLabel} ${idx + 1}`}
                            className="w-full aspect-[4/3] object-cover rounded-lg border border-primary/10"
                            loading="lazy"
                          />
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-primary/20" />
                  <CarouselNext className="right-2 bg-white/80 hover:bg-white border-primary/20" />
                </Carousel>
              ) : (
                <p className="text-sm text-foreground/70">{t.galleryLabel}.</p>
              );
            })()}
          </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
