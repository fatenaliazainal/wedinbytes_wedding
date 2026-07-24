import React from "react";
import { type Invitation } from "@workspace/api-client-react";

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
  const panelBase = "relative z-10 flex flex-col items-center text-center px-7 py-10 gap-4 w-full";

  const countdownLabels = { days: t.days, hours: t.hours, minutes: t.minutes, seconds: t.seconds, started: t.eventStarted };
  const sameImage = cardImageUrl && envelopeImageUrl && cardImageUrl === envelopeImageUrl;

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth }}>
      {sameImage && (
        <img
          src={cardImageUrl}
          aria-hidden
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />
      )}

      {/* ── PAGE 1: COVER ── */}
      <section className={sectionBase}>
        {!sameImage && (cardImageUrl ? (
          <img
            src={cardImageUrl}
            aria-hidden
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        ))}
        {showFrontText && (
          <div className={panelBase}>
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

      {/* ── PAGE 2: INVITATION TEXT ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
        <div className={panelBase}>
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
      </section>

      {/* ── PAGE 3: DATE, TIME & LOCATION ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">{t.dateLabel}</p>
            <p className="font-bold text-sm text-foreground tracking-[0.2em] uppercase">{invitation.eventDay}</p>
            <p className="text-lg text-foreground tracking-widest" style={{ fontFamily: bodyFontFamily }}>{formatDatePipes(invitation.eventDate ?? "")}</p>
          </div>
          <OrnamentDivider />
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">{t.timeLabel}</p>
            <p className="text-base text-foreground" style={{ fontFamily: bodyFontFamily }}>{invitation.eventTime}</p>
          </div>
          <OrnamentDivider />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">{t.locationLabel}</p>
            <p className="text-base italic text-primary" style={{ fontFamily: bodyFontFamily }}>{invitation.venueName}</p>
            {invitation.venueAddress && (
              <p className="text-xs text-foreground/70 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: invitation.venueAddress }} />
            )}
            <p className="text-xs text-foreground/60">{invitation.venueCity}, {invitation.venueState}</p>
          </div>
        </div>
      </section>

      {/* ── PAGE 4: PROGRAMME & DRESS CODE ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          {schedule && (
            <div className="space-y-2 w-full">
              <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">{t.programmeLabel}</p>
              <p className="text-xs text-foreground/75 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: schedule }} />
            </div>
          )}
          {invitation.dresscode && (
            <>
              <OrnamentDivider />
              <p className="text-[10px] text-foreground/60 border border-primary/25 bg-white/40 rounded-full px-5 py-1.5 inline-block tracking-wider">
                {t.dressCodeLabel}: {invitation.dresscode.toUpperCase()}
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── PAGE 5: PRAYER ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          <p className="text-sm text-foreground/80 leading-relaxed" style={{ fontFamily: bodyFontFamily }} dangerouslySetInnerHTML={{ __html: doaText }} />
        </div>
      </section>

      {/* ── PAGE 6: COUNTDOWN ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.countdownLabel}</p>
          <OrnamentDivider />
          {(inv.eventStartDateTime as string) ? (
            <Countdown targetDate={inv.eventStartDateTime as string} labels={countdownLabels} />
          ) : (
            <p className="text-sm text-foreground/70">{t.setDateTime}</p>
          )}
        </div>
      </section>

      {/* ── PAGE 7: GALLERY ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.galleryLabel}</p>
          <OrnamentDivider />
          <p className="text-sm text-foreground/70">{t.galleryLabel}.</p>
        </div>
      </section>

      {/* ── PAGE 8: ATTENDANCE (RSVP) ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.attendanceLabel}</p>
          <OrnamentDivider />
          <p className="text-sm text-foreground/70">{t.rsvpPrompt}</p>
        </div>
      </section>

      {/* ── PAGE 9: WISHES ── */}
      <section className={sectionBase}>
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
        <div className={panelBase}>
          <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{t.wishesLabel}</p>
          <OrnamentDivider />
          <p className="text-sm text-foreground/70" dangerouslySetInnerHTML={{ __html: (inv.message as string) || t.guestWishes }} />
        </div>
      </section>
    </div>
  );
}
