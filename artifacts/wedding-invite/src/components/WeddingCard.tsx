import React from "react";
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
  guestWishes?: { name: string; message?: string | null; createdAt?: string }[];
  onRsvpClick?: () => void;
}

const MONTH_MAP: Record<string, string> = {
  Januari: "01", Februari: "02", Mac: "03", April: "04",
  Mei: "05", Jun: "06", Julai: "07", Ogos: "08",
  September: "09", Oktober: "10", November: "11", Disember: "12",
  January: "01", February: "02", March: "03", May: "05",
  June: "06", July: "07", August: "08", October: "10", December: "12",
};

function formatDatePipes(dateStr: string): string {
  if (!dateStr) return "";
  const s = dateStr.trim();
  // ISO / date-picker format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [year, month, day] = s.split("-");
    const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    return `${parseInt(day, 10)} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }
  // Display format: "15 November 2025"
  const parts = s.split(" ");
  if (parts.length === 3) {
    return `${parseInt(parts[0], 10)} ${parts[1]} ${parts[2]}`;
  }
  return s;
}

function formatDateBlock(dateStr: string, dayStr: string, lang: "ms" | "en"): string {
  if (!dateStr) return "";
  const dateText = formatDatePipes(dateStr);
  if (!dateText) return dayStr || "";
  return dayStr ? `${dayStr}\n${dateText}` : dateText;
}

function getCountdownTarget(dateStr: string, timeStr?: string): string | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  let datePart: string | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    datePart = s;
  } else {
    const parts = s.split(" ");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = MONTH_MAP[parts[1]] ?? "01";
      const year = parts[2];
      datePart = `${year}-${month}-${day}`;
    }
  }

  if (!datePart) return null;

  // Try to extract a start time from the freeform eventTime string
  let timePart = "12:00:00";
  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toLowerCase();
      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
      timePart = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }
  }

  return `${datePart}T${timePart}`;
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

function Countdown({ targetDate, labels, bodyFontFamily }: { targetDate: string; labels: { days: string; hours: string; minutes: string; seconds: string; started: string }; bodyFontFamily: string }) {
  const [timeLeft, setTimeLeft] = React.useState(() => calculateTimeLeft(targetDate));

  React.useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <p className="text-sm text-foreground/70" style={{ fontFamily: bodyFontFamily }}>{labels.started}</p>;
  }

  const units = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 text-center w-full max-w-xs" style={{ fontFamily: bodyFontFamily }}>
      {units.map((u) => (
        <div key={u.label} className="bg-white/50 rounded-lg p-2 border border-primary/10">
          <p className="text-xl font-bold text-primary">{u.value}</p>
          <p className="text-xs uppercase text-foreground/60">{u.label}</p>
        </div>
      ))}
    </div>
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
    dateLabel: "Tarikh",
    dayLabel: "Hari",
    timeLabel: "Masa",
    locationLabel: "Lokasi",
    programmeLabel: "Atur Cara Majlis",
    dressCodeLabel: "Tema Pakaian",
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
    dateLabel: "Date",
    dayLabel: "Day",
    timeLabel: "Time",
    locationLabel: "Location",
    programmeLabel: "Event Programme",
    dressCodeLabel: "Dress Code",
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

export function WeddingCard({ invitation, cardImageUrl, envelopeImageUrl, cardMaxWidth, guestWishes, onRsvpClick }: WeddingCardProps) {
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
  const detailLabel = "text-xs font-semibold tracking-[0.28em] text-foreground/50 uppercase";
  const sectionTitleCls = "text-xl text-primary";
  const sectionTitleStyle: React.CSSProperties = { fontFamily: nameStyle.fontFamily };

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

  const mapsUrl = (inv.venueMapUrl as string) ||
    `https://maps.google.com/?q=${encodeURIComponent((invitation.venueName ?? "") + " " + (invitation.venueCity ?? ""))}`;

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth }}>
      {/* ── PAGE 1: MAIN INVITATION / COVER ── */}
      <section className={sectionBase}>
        <PageBackground imageUrl={bgUrl} />
        {showFrontText && (
          <div className={coverPanelBase}>
            <p className="text-xs font-semibold tracking-[0.35em] text-primary uppercase mb-8" style={{ fontFamily: bodyFontFamily }}>{coverTitle}</p>
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm">{groomName}</h1>
            {(brideName && groomName) && (
              <span style={{ ...nameStyle, fontSize: "calc(var(--name-font-size, 3rem) * 0.5)" }} className="text-primary my-1 drop-shadow-sm">
                &amp;
              </span>
            )}
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm mb-4">{brideName}</h1>
            <p className="text-xs font-semibold tracking-[0.3em] text-foreground/70 uppercase">{invitation.eventDay}</p>
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
          backgroundAttachment: "fixed",
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
            <p className={sectionTitleCls} style={sectionTitleStyle}>{t.dateLabel}</p>
            <OrnamentDivider />
            <div className="space-y-1">
              <p className="text-lg text-foreground whitespace-pre-line" style={{ fontFamily: bodyFontFamily }}>
                {formatDateBlock(invitation.eventDate ?? "", invitation.eventDay ?? "", lang)}
              </p>
              {(inv.venueHijriDate as string) && (
                <p className="text-sm text-foreground/70" style={{ fontFamily: bodyFontFamily }}>{inv.venueHijriDate as string}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className={detailLabel} style={{ fontFamily: bodyFontFamily }}>{t.timeLabel}</p>
              <p className="text-base text-foreground" style={{ fontFamily: bodyFontFamily }}>{invitation.eventTime}</p>
            </div>
            <div className="space-y-1.5">
              <p className={detailLabel} style={{ fontFamily: bodyFontFamily }}>{t.locationLabel}</p>
              <p className="text-base italic text-primary" style={{ fontFamily: bodyFontFamily }}>{invitation.venueName}</p>
              {invitation.venueAddress && (
                <p className="text-xs text-foreground/70 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: invitation.venueAddress }} />
              )}
              <p className="text-xs text-foreground/60" style={{ fontFamily: bodyFontFamily }}>{invitation.venueCity}, {invitation.venueState}</p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-2.5 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold tracking-wide shadow"
              style={{ fontFamily: bodyFontFamily }}
            >
              {t.viewOnMap}
            </a>
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Programme & Dress Code */}
          {(Array.isArray(inv.itinerary) && (inv.itinerary as { time?: string; event?: string }[]).length > 0 ? true : Boolean(schedule)) && (
            <div className={detailBlock}>
              <p className={sectionTitleCls} style={sectionTitleStyle}>{t.programmeLabel}</p>
              <OrnamentDivider />
              {Array.isArray(inv.itinerary) && (inv.itinerary as { time?: string; event?: string }[]).length > 0 ? (
                <div className="space-y-4" style={{ fontFamily: bodyFontFamily }}>
                  {(inv.itinerary as { time?: string; event?: string }[]).map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="text-sm font-semibold text-primary">{item.time || "—"}</p>
                      <p className="text-sm text-foreground/80">{item.event || "—"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground/75 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: schedule as string }} />
              )}
              {invitation.dresscode && (
                <p className="text-xs text-foreground/60 border border-primary/25 bg-white/40 rounded-full px-5 py-1.5 inline-block tracking-wider" style={{ fontFamily: bodyFontFamily }}>
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
            <p className={sectionTitleCls} style={sectionTitleStyle}>{t.countdownLabel}</p>
            <OrnamentDivider />
            {(() => {
              const target = getCountdownTarget(invitation.eventDate ?? "", invitation.eventTime ?? "");
              return target ? (
                <Countdown targetDate={target} labels={countdownLabels} bodyFontFamily={bodyFontFamily} />
              ) : (
                <p className="text-sm text-foreground/70">{t.setDateTime}</p>
              );
            })()}
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* RSVP */}
          <div className={detailBlock}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>{t.attendanceLabel}</p>
            <OrnamentDivider />
            <p className="text-sm text-foreground/70" style={{ fontFamily: bodyFontFamily }}>{t.rsvpPrompt}</p>
            {onRsvpClick && (
              <button
                onClick={onRsvpClick}
                className="mt-2 px-6 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                style={{ fontFamily: bodyFontFamily }}
              >
                {inv.rsvpEnabled === false ? "RSVP Ditutup" : "Sahkan Kehadiran"}
              </button>
            )}
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Wishes / Guestbook */}
          <div className={detailBlock}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>{t.wishesLabel}</p>
            <OrnamentDivider />
            {(inv.message as string) && (
              <p className="text-sm text-foreground/70 mb-4" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: inv.message as string }} />
            )}
            {guestWishes && guestWishes.length > 0 ? (
              <div className="w-full max-w-xs">
                <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
                  {guestWishes.map((wish, idx) => (
                    <div
                      key={idx}
                      className="bg-white/60 rounded-xl p-4 border border-primary/10 text-left"
                    >
                      <p className="text-sm font-semibold text-foreground" style={{ fontFamily: bodyFontFamily }}>
                        {wish.name}
                      </p>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap" style={{ fontFamily: bodyFontFamily }}>
                        {wish.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/70" style={{ fontFamily: bodyFontFamily }}>{t.guestWishes}</p>
            )}
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Gallery */}
          <div className={detailBlock}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>{t.galleryLabel}</p>
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
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f3f4f6'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14'%3EImage not found%3C/text%3E%3C/svg%3E";
                            }}
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
