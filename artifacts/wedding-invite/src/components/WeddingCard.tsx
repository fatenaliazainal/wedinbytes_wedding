import React from "react";
import { motion } from "framer-motion";
import { type Invitation } from "@workspace/api-client-react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Globe, Instagram, MessageCircle } from "lucide-react";
import { fallbackToR2Proxy, resolveImageUrl } from "@/lib/r2-url";

interface WeddingCardProps {
  invitation?: Invitation;
  cardImageUrl?: string;
  envelopeImageUrl?: string;
  cardMaxWidth?: string;
  guestWishes?: { name: string; message?: string | null; createdAt?: string }[];
  rsvpCount?: { attending: number; notAttending: number; totalGuests: number };
  onRsvpClick?: () => void;
}

const MONTH_MAP: Record<string, string> = {
  Januari: "01", Februari: "02", Mac: "03", April: "04",
  Mei: "05", Jun: "06", Julai: "07", Ogos: "08",
  September: "09", Oktober: "10", November: "11", Disember: "12",
  January: "01", February: "02", March: "03", May: "05",
  June: "06", July: "07", August: "08", October: "10", December: "12",
};

function GalleryCarousel({ images, label }: { images: string[]; label: string }) {
  const galleryImages = images.filter(Boolean);
  const AUTO_SLIDE_DELAY = 4500;
  const RESUME_DELAY = 2500;
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: galleryImages.length > 1,
    duration: 28,
  });
  const [activeIndex, setActiveIndex] = React.useState(0);
  const autoSlideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAutoSlide = React.useCallback(() => {
    if (autoSlideTimer.current) {
      clearTimeout(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
  }, []);
  const scheduleAutoSlide = React.useCallback((delay: number) => {
    clearAutoSlide();
    autoSlideTimer.current = setTimeout(() => {
      emblaApi?.scrollNext();
      scheduleAutoSlide(AUTO_SLIDE_DELAY);
    }, delay);
  }, [clearAutoSlide, emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;

    const updateActiveSlide = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    updateActiveSlide();
    emblaApi.on("select", updateActiveSlide);
    emblaApi.on("reInit", updateActiveSlide);

    return () => {
      emblaApi.off("select", updateActiveSlide);
      emblaApi.off("reInit", updateActiveSlide);
    };
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi || galleryImages.length <= 1) return;

    const pauseAutoSlide = () => clearAutoSlide();
    const resumeAutoSlide = () => scheduleAutoSlide(RESUME_DELAY);

    scheduleAutoSlide(AUTO_SLIDE_DELAY);
    emblaApi.on("pointerDown", pauseAutoSlide);
    emblaApi.on("pointerUp", resumeAutoSlide);

    return () => {
      clearAutoSlide();
      emblaApi.off("pointerDown", pauseAutoSlide);
      emblaApi.off("pointerUp", resumeAutoSlide);
    };
  }, [emblaApi, galleryImages.length]);

  const handleArrowInteraction = (scroll: () => void) => {
    scroll();
    scheduleAutoSlide(RESUME_DELAY);
  };

  return (
    <div className="w-full max-w-xs">
      <div className="relative">
        <div ref={viewportRef} className="overflow-hidden">
          <div className="flex -ml-4">
            {galleryImages.map((url, idx) => {
              const resolved = resolveImageUrl(url);
              return (
                <div
                  key={`${url}-${idx}`}
                  role="group"
                  aria-roledescription="slide"
                  className="min-w-0 shrink-0 grow-0 basis-full pl-4"
                >
                  <img
                    src={resolved}
                    alt={`${label} ${idx + 1}`}
                    onError={(e) => fallbackToR2Proxy(e, url)}
                    className="aspect-[4/3] w-full rounded-lg border border-primary/10 object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        </div>
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label={`Previous ${label.toLowerCase()}`}
              onClick={() => handleArrowInteraction(() => emblaApi?.scrollPrev())}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black/60 shadow-sm backdrop-blur-[2px] transition-colors hover:bg-white hover:text-black"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label={`Next ${label.toLowerCase()}`}
              onClick={() => handleArrowInteraction(() => emblaApi?.scrollNext())}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black/60 shadow-sm backdrop-blur-[2px] transition-colors hover:bg-white hover:text-black"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
      {galleryImages.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`${label} pagination`}>
          {galleryImages.map((url, idx) => (
            <span
              key={`dot-${url}-${idx}`}
              aria-current={activeIndex === idx ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx ? "w-5 bg-primary" : "w-1.5 bg-primary/25 hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
    eventDetailsLabel: "Butiran Majlis",
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
    attendingLabel: "Hadir",
    notAttendingLabel: "Tidak Hadir",
    wishesLabel: "Ucapan",
    contactLabel: "Hubungi",
    viewOnMap: "Buka Google Maps",
    days: "Hari",
    hours: "Jam",
    minutes: "Minit",
    seconds: "Saat",
    footerTextDefault: "Dapatkan kad digital anda di:",
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
    eventDetailsLabel: "Event Details",
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
    attendingLabel: "Attending",
    notAttendingLabel: "Not Attending",
    wishesLabel: "Wishes",
    contactLabel: "Contact",
    viewOnMap: "Open in Google Maps",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    footerTextDefault: "Get your digital card at:",
  },
};

export function WeddingCard({ invitation, cardImageUrl, envelopeImageUrl, cardMaxWidth, guestWishes, rsvpCount, onRsvpClick }: WeddingCardProps) {
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
  const groomName = invitation.groomName?.trim() || groomShort || coupleParts[0] || "";
  const brideName = invitation.brideName?.trim() || brideShort || coupleParts[1] || "";
  const groomInitial = (inv.groomInitial as string | undefined)?.trim() || groomName.charAt(0).toUpperCase();
  const brideInitial = (inv.brideInitial as string | undefined)?.trim() || brideName.charAt(0).toUpperCase();
  const coverGroomName = (inv.coverGroomName as string | undefined)?.trim() || groomInitial;
  const coverBrideName = (inv.coverBrideName as string | undefined)?.trim() || brideInitial;
  const page2Initials = (inv.page2Initials as string | undefined)?.trim() || `${groomInitial} & ${brideInitial}`;

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
  const sectionTitleCls = "text-primary";
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: nameStyle.fontFamily,
    fontSize: "var(--section-title-font-size, 1.25rem)",
  };

  const countdownLabels = { days: t.days, hours: t.hours, minutes: t.minutes, seconds: t.seconds, started: t.eventStarted };
  // Keep the two background groups explicit: the cover is group 1 and the
  // scrollable invitation details are group 2. Older templates may only have
  // one image, so each group falls back to the other image for compatibility.
  const groupOneBackgroundUrl = cardImageUrl || envelopeImageUrl;
  const groupTwoBackgroundUrl = envelopeImageUrl || cardImageUrl;

  function PageBackground({ imageUrl, overlay = false }: { imageUrl?: string; overlay?: boolean }) {
    return (
      <div className="sticky top-0 z-0 -mb-[100dvh] h-[100dvh] w-full pointer-events-none">
        {imageUrl ? (
          <img
            src={imageUrl}
            aria-hidden
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        {overlay && <div className="absolute inset-0 bg-white/70" />}
      </div>
    );
  }

  const mapsUrl = (inv.venueMapUrl as string) ||
    `https://maps.google.com/?q=${encodeURIComponent((invitation.venueName ?? "") + " " + (invitation.venueCity ?? ""))}`;
  const groomParents = invitation.groomParents?.trim() || "";
  const brideParents = invitation.brideParents?.trim() || "";
  const planner = inv.eventPlanner && typeof inv.eventPlanner === "object"
    ? inv.eventPlanner as {
        companyName?: string;
        displayName?: string;
        slug?: string;
        logoUrl?: string | null;
        whatsapp?: string | null;
        instagram?: string | null;
        website?: string | null;
      }
    : null;
  const externalUrl = (value?: string | null) => {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  };
  const whatsappUrl = planner?.whatsapp
    ? `https://wa.me/${planner.whatsapp.replace(/\D/g, "")}`
    : "";
  const instagramUrl = planner?.instagram
    ? (/^https?:\/\//i.test(planner.instagram)
      ? planner.instagram
      : `https://instagram.com/${planner.instagram.replace(/^@/, "")}`)
    : "";

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth }}>
      {/* ── BACKGROUND GROUP 1 / COVER ── */}
      <section className={sectionBase}>
        {groupOneBackgroundUrl ? (
          <img
            src={groupOneBackgroundUrl}
            aria-hidden
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        {showFrontText && (
          <div className={coverPanelBase}>
            <p className="text-xs font-semibold tracking-[0.35em] text-primary uppercase mb-8" style={{ fontFamily: bodyFontFamily }}>{coverTitle}</p>
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm">{coverGroomName}</h1>
            {(coverBrideName && coverGroomName) && (
              <span style={{ ...nameStyle, fontSize: "calc(var(--name-font-size, 3rem) * 0.5)" }} className="text-primary my-1 drop-shadow-sm">
                &amp;
              </span>
            )}
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm mb-4">{coverBrideName}</h1>
            <p className="text-xs font-semibold tracking-[0.3em] text-foreground/70 uppercase">{invitation.eventDay}</p>
            <p className="text-sm text-foreground/80 mt-1 mb-5 tracking-widest">{formatDatePipes(invitation.eventDate ?? "")}</p>
            {hashtag && (
              <p className="text-xs italic text-primary/80" style={{ fontFamily: bodyFontFamily }}>{hashtag}</p>
            )}
          </div>
        )}
      </section>

      {/* ── BACKGROUND GROUP 2 / ALL REMAINING INVITATION SECTIONS ── */}
      <section className="relative">
        <PageBackground imageUrl={groupTwoBackgroundUrl} overlay />
        <div className="relative z-10 flex flex-col items-center gap-14 py-16 px-6">

          <RevealOnScroll>
          {/* Invitation Text */}
          <div className={detailBlock}>
            <p className="text-xl text-primary leading-snug" style={{ fontFamily: nameStyle.fontFamily }} dangerouslySetInnerHTML={{ __html: greetingText }} />
            <OrnamentDivider />
            {(brideParents || groomParents) && (
              <div className="space-y-1">
                {groomParents && (
                  <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: groomParents }} />
                )}
                {brideParents && groomParents && (
                  <p className="text-primary text-sm font-semibold">&amp;</p>
                )}
                {brideParents && (
                  <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: brideParents }} />
                )}
              </div>
            )}
            <p className="text-xs text-foreground/70 italic leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: invitationText }} />
            <div className="space-y-0.5">
               <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{groomName}</p>
              <p className="text-sm text-foreground/60">&amp;</p>
               <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{brideName}</p>
            </div>
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
           {/* Event Details */}
          <div className={detailBlock}>
             <p className={sectionTitleCls} style={sectionTitleStyle}>{t.eventDetailsLabel}</p>
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
            {rsvpCount && (rsvpCount.attending > 0 || rsvpCount.notAttending > 0) && (
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-4">
                <div className="text-center">
                  <p className="text-3xl font-semibold text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{rsvpCount.attending}</p>
                  <p className="text-xs uppercase tracking-wider text-foreground/70" style={{ fontFamily: bodyFontFamily }}>{t.attendingLabel}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-semibold text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{rsvpCount.notAttending}</p>
                  <p className="text-xs uppercase tracking-wider text-foreground/70" style={{ fontFamily: bodyFontFamily }}>{t.notAttendingLabel}</p>
                </div>
              </div>
            )}
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

          {guestWishes && guestWishes.length > 0 && (
            <RevealOnScroll>
            {/* Wishes / Guestbook */}
            <div className={detailBlock}>
              <p className={sectionTitleCls} style={sectionTitleStyle}>{t.wishesLabel}</p>
              <OrnamentDivider />
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
            </div>
            </RevealOnScroll>
          )}

          <RevealOnScroll>
          {/* Gallery */}
          <div className={detailBlock}>
            <p className={sectionTitleCls} style={sectionTitleStyle}>{t.galleryLabel}</p>
            <OrnamentDivider />
            {(() => {
              const images = Array.isArray(inv.galleryImages) ? (inv.galleryImages as string[]) : [];
              return images.length > 0 ? (
                <GalleryCarousel images={images} label={t.galleryLabel} />
              ) : (
                <p className="text-sm text-foreground/70">{t.galleryLabel}.</p>
              );
            })()}
          </div>
          </RevealOnScroll>

          <RevealOnScroll>
          {planner && (
            <div className={detailBlock}>
              <OrnamentDivider />
              <div className="rounded-2xl border border-primary/15 bg-card/70 px-5 py-5 text-center shadow-sm">
                <p className={detailLabel}>Wedding Planner</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  {planner.logoUrl ? (
                    <img src={resolveImageUrl(planner.logoUrl)} alt="" className="h-12 w-12 rounded-full object-cover border border-primary/15" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {(planner.companyName || "P").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-foreground" style={{ fontFamily: bodyFontFamily }}>
                      {planner.companyName || "Event Planner"}
                    </p>
                    {planner.displayName && (
                      <p className="text-sm text-foreground/70" style={{ fontFamily: bodyFontFamily }}>
                        {planner.displayName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-foreground/70 hover:text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                  {instagramUrl && (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-foreground/70 hover:text-primary">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {externalUrl(planner.website) && (
                    <a href={externalUrl(planner.website)} target="_blank" rel="noopener noreferrer" aria-label="Website" className="text-foreground/70 hover:text-primary">
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          </RevealOnScroll>

          <RevealOnScroll>
          {/* Footer / Branding */}
          {inv.showFooter !== false && (
            <div className={detailBlock}>
              <OrnamentDivider />
              <div className="text-center space-y-3">
                <p className="text-sm text-foreground/70" style={{ fontFamily: bodyFontFamily }}>
                  {(inv.footerText as string) || t.footerTextDefault}
                </p>
                {(inv.footerUrl as string) && (
                  <a
                    href={`https://${(inv.footerUrl as string).replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-base font-medium text-primary hover:underline"
                    style={{ fontFamily: bodyFontFamily }}
                  >
                    {inv.footerUrl as string}
                  </a>
                )}
                {Array.isArray(inv.socialLinks) && (inv.socialLinks as { platform: string; url: string }[]).length > 0 && (
                  <div className="flex justify-center items-center gap-4 pt-2">
                    {(inv.socialLinks as { platform: string; url: string }[]).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground/70 hover:text-primary transition-colors"
                        aria-label={link.platform}
                      >
                        <SocialIcon platform={link.platform} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const className = "w-7 h-7";
  if (p === "website" || p === "brand" || p === "logo" || p === "wedinbytes") {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
        <rect x="4" y="12" width="32" height="16" rx="2" fill="currentColor" />
        <text x="20" y="23.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">M</text>
      </svg>
    );
  }
  if (p === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.5a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    );
  }
  if (p === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.69-4.92-4.92-.06-1.27-.07-1.65-.07-4.85 0-3.2.01-3.58.07-4.85.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.52.01-4.76.07-2.48.11-3.67 1.3-3.78 3.78-.05 1.24-.06 1.6-.06 4.76s.01 3.52.06 4.76c.11 2.48 1.3 3.67 3.78 3.78 1.24.05 1.6.06 4.76.06s3.52-.01 4.76-.06c2.48-.11 3.67-1.3 3.78-3.78.05-1.24.06-1.6.06-4.76s-.01-3.52-.06-4.76c-.11-2.48-1.3-3.67-3.78-3.78C15.52 3.97 15.16 3.96 12 3.96z"/>
        <path d="M12 7.86a4.14 4.14 0 1 0 0 8.28 4.14 4.14 0 0 0 0-8.28zm0 6.78a2.64 2.64 0 1 1 0-5.28 2.64 2.64 0 0 1 0 5.28z"/>
        <circle cx="17.48" cy="6.52" r="1.1"/>
      </svg>
    );
  }
  return <span className={className + " flex items-center justify-center text-xs font-bold"}>{platform[0]?.toUpperCase()}</span>;
}
