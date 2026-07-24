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

  // Cover names: always render as two separate lines (groom top, bride bottom).
  // Prefer the new short-name fields; if those are empty, split the legacy
  // shortCoupleName on " & " (legacy format is "Bride & Groom"); finally fall
  // back to the full names. This guarantees the cover never shows one combined line.
  const brideShort = (inv.brideShortName as string | undefined)?.trim() || "";
  const groomShort = (inv.groomShortName as string | undefined)?.trim() || "";
  const shortCoupleName = (inv.shortCoupleName as string | undefined)?.trim() || "";
  const coupleParts = shortCoupleName.includes(" & ")
    ? shortCoupleName.split(" & ").map((s) => s.trim())
    : [];
  // Cover names: short names → legacy couple name → full names.
  // Initials are not used on the cover.
  const brideName = brideShort || coupleParts[0] || invitation.brideName?.trim() || "";
  const groomName = groomShort || coupleParts[1] || invitation.groomName?.trim() || "";

  // Name styling — read from CSS custom properties set by the EditorPage preview container
  // Falls back to sensible defaults if not set (e.g. on the live invitation page)
  const nameStyle: React.CSSProperties = {
    fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
    fontSize: "var(--name-font-size, 3rem)",
    color: "var(--name-color, hsl(var(--foreground, 0 0% 10%)))",
    lineHeight: 1.15,
    dropShadow: "0 1px 2px rgba(0,0,0,0.15)",
  };

  // Body text styling — controlled by --body-font-family CSS var
  const bodyFontFamily = "var(--body-font-family, 'Dancing Script', cursive)";

  // If the same image is used for both card and envelope, render it as one
  // continuous full-cover background for the whole card instead of showing it
  // twice (once in hero, once in detail). Using an <img> with object-cover is
  // more reliable than background-image for avoiding tiling/height issues.
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

      {/* ── HERO SECTION ── card-floral background, full first screen */}
      <div className="relative min-h-(--card-viewport-height,100dvh) flex flex-col items-center justify-center overflow-hidden">
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
          <div className="relative z-10 flex flex-col items-center text-center px-10 py-16 w-full">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-primary uppercase mb-8"
              dangerouslySetInnerHTML={{ __html: invitation.eventType || "" }}
            />

            <h1 style={nameStyle} className="leading-tight drop-shadow-sm">
              {groomName}
            </h1>
            {(brideName && groomName) && (
              <span style={{ ...nameStyle, fontSize: "calc(var(--name-font-size, 3rem) * 0.5)" }} className="text-primary my-1 drop-shadow-sm">
                &amp;
              </span>
            )}
            <h1 style={nameStyle} className="leading-tight drop-shadow-sm mb-4">
              {brideName}
            </h1>

            {additionalInfo && (
              <p
                className="text-sm italic text-primary/80 mb-4 leading-snug"
                style={{ fontFamily: bodyFontFamily }}
                dangerouslySetInnerHTML={{ __html: additionalInfo }}
              />
            )}

            <p className="text-[11px] font-semibold tracking-[0.3em] text-foreground/70 uppercase">
              {invitation.eventDay}
            </p>
            <p className="text-sm text-foreground/80 mt-1 mb-5 tracking-widest"
              dangerouslySetInnerHTML={{ __html: coverDateText || pipeDate }}
            />

            <p className="text-base italic text-primary leading-snug" style={{ fontFamily: bodyFontFamily }}>
              {invitation.venueName}
            </p>
            <p className="text-[10px] tracking-[0.25em] text-foreground/60 uppercase mt-1">
              {invitation.venueCity}, {invitation.venueState}
            </p>
          </div>
        )}
      </div>

      {/* ── DETAIL SECTION ── envelope-floral background, scrollable */}
      {/* Only show a second background image if it differs from the hero card image.
          Otherwise the same image appears duplicated behind the content. */}
      <div
        className="relative min-h-(--card-viewport-height,100dvh) bg-cover bg-center"
        style={
          envelopeImageUrl && envelopeImageUrl !== cardImageUrl
            ? {
                backgroundImage: `url(${envelopeImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
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
            <p
              className="text-xl text-primary leading-snug"
              style={{ fontFamily: nameStyle.fontFamily }}
              dangerouslySetInnerHTML={{ __html: greetingText }}
            />
          </div>

          <OrnamentDivider />

          {(invitation.brideParents || invitation.groomParents) && (
            <div className="space-y-1">
              {invitation.brideParents && (
                <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: invitation.brideParents }} />
              )}
              {invitation.brideParents && invitation.groomParents && (
                <p className="text-primary text-sm font-semibold">&amp;</p>
              )}
              {invitation.groomParents && (
                <p className="text-sm font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: invitation.groomParents }} />
              )}
            </div>
          )}

          <p className="text-xs text-foreground/70 italic leading-relaxed" style={{ fontFamily: bodyFontFamily }}
            dangerouslySetInnerHTML={{ __html: invitationText }}
          />

          <div className="space-y-0.5">
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{invitation.brideName}</p>
            <p className="text-sm text-foreground/60">&amp;</p>
            <p className="text-xl text-primary" style={{ fontFamily: nameStyle.fontFamily }}>{invitation.groomName}</p>
          </div>

          <OrnamentDivider />

          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">
              EVENT DATE
            </p>
            <p className="font-bold text-sm text-foreground tracking-[0.2em] uppercase">
              {invitation.eventDay}
            </p>
            <p className="text-lg text-foreground tracking-widest" style={{ fontFamily: bodyFontFamily }}
              dangerouslySetInnerHTML={{ __html: coverDateText || pipeDate }}
            />
            {venueHijriDate && (
              <p className="text-xs text-foreground/55 italic">{venueHijriDate}</p>
            )}
          </div>

          <OrnamentDivider />

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-foreground/50 uppercase">
              EVENT VENUE
            </p>
            <p className="text-base italic text-primary" style={{ fontFamily: bodyFontFamily }}>{invitation.venueName}</p>
            {invitation.venueAddress && (
              <p className="text-xs text-foreground/70 leading-relaxed" style={{ fontFamily: bodyFontFamily }}
                dangerouslySetInnerHTML={{ __html: invitation.venueAddress }}
              />
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
                <p className="text-xs text-foreground/75 leading-relaxed" style={{ fontFamily: bodyFontFamily }}
                  dangerouslySetInnerHTML={{ __html: schedule }}
                />
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
            <span className="font-bold text-primary"
              dangerouslySetInnerHTML={{ __html: `before ${coverDateText || pipeDate}` }}
            />
          </p>

          <OrnamentDivider />

          <div className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
