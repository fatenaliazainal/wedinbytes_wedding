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

export function WeddingCard({ invitation, cardImageUrl, envelopeImageUrl, cardMaxWidth }: WeddingCardProps) {
  if (!invitation) return null;

  const maxWidth = cardMaxWidth || "420px";
  // Use unknown cast so we can access fields that may not be in the generated TS type
  const inv = invitation as unknown as Record<string, unknown>;

  const greetingText = (inv.greetingText as string) || "Assalamualaikum & warm greetings";
  const invitationText = (inv.invitationText as string) ||
    "With heartfelt gratitude, we joyfully invite\nyou to celebrate the wedding of our beloved child.";
  const venueHijriDate = inv.venueHijriDate as string | undefined;
  const schedule = inv.schedule as string | undefined;
  const additionalInfo = inv.additionalInfo as string | undefined;
  const coverDateText = inv.coverDateText as string | undefined;
  // showFrontText defaults to true; false only when explicitly set to boolean false
  const showFrontText = inv.showFrontText !== false && inv.showFrontText !== "false";

  const pipeDate = formatDatePipes(invitation.eventDate ?? "");

  // Name styling — read from CSS custom properties set by the EditorPage preview container
  // Falls back to sensible defaults if not set (e.g. on the live invitation page)
  const nameStyle: React.CSSProperties = {
    fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
    fontSize: "var(--name-font-size, 3rem)",
    color: "var(--name-color, hsl(var(--foreground, 0 0% 10%)))",
    lineHeight: 1.15,
    dropShadow: "0 1px 2px rgba(0,0,0,0.15)",
  };

  return (
    <div className="relative w-full h-full mx-auto" style={{ maxWidth }}>

      {/* ── HERO SECTION ── card-floral background, full first screen */}
      <div className="relative min-h-(--card-viewport-height,100dvh) flex flex-col items-center justify-center overflow-hidden">
        {cardImageUrl ? (
          <img
            src={cardImageUrl}
            aria-hidden
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}

        {showFrontText && (
          <div className="relative z-10 flex flex-col items-center text-center px-10 py-16 w-full">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-primary uppercase mb-8">
              {invitation.eventType}
            </p>

            <h1 style={nameStyle} className="leading-tight drop-shadow-sm">
              {invitation.brideName}
            </h1>
            <span style={{ ...nameStyle, fontSize: "calc(var(--name-font-size, 3rem) * 0.5)" }} className="text-primary my-1 drop-shadow-sm">
              &amp;
            </span>
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm mb-4">
              {invitation.groomName}
            </h1>

            {additionalInfo && (
              <p
                className="text-sm italic text-primary/80 mb-4 whitespace-pre-line leading-snug"
                style={{ fontFamily: "Dancing Script, cursive" }}
              >
                {additionalInfo}
              </p>
            )}

            <p className="text-[11px] font-semibold tracking-[0.3em] text-foreground/70 uppercase">
              {invitation.eventDay}
            </p>
            <p className="text-sm text-foreground/80 mt-1 mb-5 tracking-widest">
              {coverDateText || pipeDate}
            </p>

            <p className="font-serif text-base italic text-primary leading-snug">
              {invitation.venueName}
            </p>
            <p className="text-[10px] tracking-[0.25em] text-foreground/60 uppercase mt-1">
              {invitation.venueCity}, {invitation.venueState}
            </p>
          </div>
        )}
      </div>

      {/* ── DETAIL SECTION ── envelope-floral background, scrollable */}
      <div
        className="relative min-h-(--card-viewport-height,100dvh) bg-fixed bg-cover bg-center"
        style={
          envelopeImageUrl
            ? {
                backgroundImage: `url(${envelopeImageUrl})`,
                backgroundAttachment: "fixed",
                backgroundSize: "contain",
                backgroundPosition: "center top",
              }
            : {
                backgroundColor: "hsl(var(--background))",
              }
        }
      >
        {/* White overlay for readability */}
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-7 pt-10 pb-6 gap-4">

          <div>
            <p className="font-serif text-xl text-primary italic leading-snug">Undangan</p>
            <p className="font-serif text-xl text-primary italic leading-snug">Wedding Ceremony</p>
          </div>

          <OrnamentDivider />

          <p className="text-xs text-foreground/70 tracking-wide">{greetingText}</p>

          {(invitation.brideParents || invitation.groomParents) && (
            <div className="space-y-1">
              {invitation.brideParents && (
                <p className="text-sm font-semibold text-foreground">{invitation.brideParents}</p>
              )}
              {invitation.brideParents && invitation.groomParents && (
                <p className="text-primary text-sm font-semibold">&amp;</p>
              )}
              {invitation.groomParents && (
                <p className="text-sm font-semibold text-foreground">{invitation.groomParents}</p>
              )}
            </div>
          )}

          <p className="text-xs text-foreground/70 italic leading-relaxed whitespace-pre-line">
            {invitationText}
          </p>

          <div className="space-y-0.5">
            <p className="font-serif text-xl text-primary">{invitation.brideName}</p>
            <p className="text-sm text-foreground/60">&amp;</p>
            <p className="font-serif text-xl text-primary">{invitation.groomName}</p>
          </div>

          <OrnamentDivider />

          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">
              EVENT DATE
            </p>
            <p className="font-bold text-sm text-foreground tracking-[0.2em] uppercase">
              {invitation.eventDay}
            </p>
            <p className="font-serif text-lg text-foreground tracking-widest">{coverDateText || pipeDate}</p>
            {venueHijriDate && (
              <p className="text-xs text-foreground/55 italic">{venueHijriDate}</p>
            )}
          </div>

          <OrnamentDivider />

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">
              EVENT VENUE
            </p>
            <p className="font-serif text-base italic text-primary">{invitation.venueName}</p>
            {invitation.venueAddress && (
              <p className="text-xs text-foreground/70 whitespace-pre-line leading-relaxed">
                {invitation.venueAddress}
              </p>
            )}
            <p className="text-xs text-foreground/60">
              {invitation.venueCity}, {invitation.venueState}
            </p>
          </div>

          {schedule && (
            <>
              <OrnamentDivider />
              <div className="space-y-2 w-full">
                <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">
                  EVENT PROGRAMME
                </p>
                <p className="text-xs text-foreground/75 whitespace-pre-line leading-relaxed">
                  {schedule}
                </p>
              </div>
            </>
          )}

          {invitation.dresscode && (
            <>
              <OrnamentDivider />
              <p className="text-[10px] text-foreground/60 border border-primary/25 bg-white/40 rounded-full px-5 py-1.5 inline-block tracking-wider">
                DRESS CODE: {invitation.dresscode.toUpperCase()}
              </p>
            </>
          )}

          <OrnamentDivider />
          <p className="text-xs text-foreground/70 leading-relaxed">
            Please <span className="font-bold text-foreground">RSVP</span> your attendance{" "}
            <span className="font-bold text-primary">before {coverDateText || pipeDate}</span>
          </p>

          <OrnamentDivider />

          <div className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
