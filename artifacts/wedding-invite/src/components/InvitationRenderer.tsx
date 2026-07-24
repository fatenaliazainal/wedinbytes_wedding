import React from "react";
import { EnvelopeDoors } from "@/components/EnvelopeDoors";
import { EnvelopeAnimation } from "@/components/EnvelopeAnimation";
import { WeddingCard } from "@/components/WeddingCard";
import { BottomNav } from "@/components/BottomNav";
import { DetailPanel, type TabKey } from "@/components/DetailPanel";
import { resolveImageUrl } from "@/lib/r2-url";

// Legacy custom fonts that are not loaded as web fonts — map to real Google Fonts.
const FONT_ALIASES: Record<string, string> = {
  Magnolia: "Great Vibes",
  Esthetique: "Alex Brush",
};

function normalizeFont(fontName?: string | null): string {
  if (!fontName) return "Dancing Script";
  return FONT_ALIASES[fontName] || fontName;
}

function fontFamilyStack(fontName?: string | null): string {
  const normalized = normalizeFont(fontName);
  if (normalized.includes(",")) return normalized;
  return `'${normalized}', 'Dancing Script', cursive`;
}

export interface InvitationRendererProps {
  invitation?: any;
  design: {
    designCode?: string;
    openingAnimation?: string;
    openButtonText?: string;
    colorPrimary?: string | null;
    colorSecondary?: string | null;
    colorAccent?: string | null;
    colorBackground?: string | null;
    colorCard?: string | null;
    nameColor?: string | null;
    nameFontFamily?: string | null;
    nameFontSize?: string | number | null;
    badgeFontSize?: string | number | null;
    bodyFontFamily?: string | null;
    musicTitle?: string | null;
    musicArtist?: string | null;
    cardImageUrl?: string | null;
    envelopeImageUrl?: string | null;
    cardMaxWidth?: string | null;
  };
  opened: boolean;
  onOpen: () => void;
  activeTab: TabKey | null;
  onTabClick: (tab: TabKey) => void;
  onRsvpClick: () => void;
  rsvpCount?: { attending: number; notAttending: number; totalGuests: number };
  guestWishes?: { name: string; message?: string | null; createdAt?: string }[];
  isMuted?: boolean;
  onToggleMute?: () => void;
  cardScrollRef?: React.RefObject<HTMLDivElement | null>;
  previewMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function InvitationRenderer({
  invitation,
  design,
  opened,
  onOpen,
  activeTab,
  onTabClick,
  onRsvpClick,
  rsvpCount,
  guestWishes,
  isMuted = false,
  onToggleMute,
  cardScrollRef,
  previewMode = false,
  className = "",
  style,
  children,
}: InvitationRendererProps) {
  const resolvedCardImageUrl = resolveImageUrl(
    design.cardImageUrl || "wed_card_design/20260531-041903-27796.jpg"
  );
  const resolvedEnvelopeImageUrl = resolveImageUrl(
    design.envelopeImageUrl || "wed_card_design/20260531-041903-27796.jpg"
  );
  const cardMaxWidth = design.cardMaxWidth || "420px";
  const openingAnimation = design.openingAnimation || "doors";
  const openButtonText = design.openButtonText || "BUKA";

  const inv = invitation as Record<string, unknown> | undefined;

  const shortGroom = (inv?.groomShortName as string | undefined)?.trim() || "";
  const shortBride = (inv?.brideShortName as string | undefined)?.trim() || "";
  const coupleNames = invitation
    ? (shortGroom || shortBride)
      ? `${shortGroom || (inv?.groomName as string) || ""} & ${shortBride || (inv?.brideName as string) || ""}`
      : `${inv?.brideName as string || ""} & ${inv?.groomName as string || ""}`
    : "A & H";

  const cssVars = {
    "--primary": design.colorPrimary || "142 45% 35%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": design.colorSecondary || "142 30% 92%",
    "--background": design.colorBackground || "142 20% 96%",
    "--card": design.colorCard || "0 0% 100%",
    "--popover": design.colorCard || "0 0% 100%",
    "--border": "142 20% 80%",
    "--muted": "142 15% 94%",
    "--muted-foreground": "142 10% 45%",
    "--name-font-family": fontFamilyStack(design.nameFontFamily as string | undefined),
    "--name-font-size": `${Number(design.nameFontSize) || 38}px`,
    "--badge-font-size": `${Number(design.badgeFontSize) || 24}px`,
    "--name-color": design.nameColor ? `hsl(${design.nameColor})` : "hsl(20 50% 25%)",
    "--body-font-family": fontFamilyStack(design.bodyFontFamily as string | undefined),
  } as React.CSSProperties;

  return (
    <div
      className={`relative w-full h-full bg-background overflow-hidden ${className}`}
      style={{ ...cssVars, ...style }}
    >
      <div
        ref={cardScrollRef}
        className={`absolute inset-0 z-10 transition-all duration-700 ${
          opened
            ? "overflow-y-auto overflow-x-hidden"
            : "overflow-hidden pointer-events-none"
        }`}
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <WeddingCard
          invitation={invitation as any}
          cardImageUrl={resolvedCardImageUrl}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          cardMaxWidth={cardMaxWidth}
          guestWishes={guestWishes}
          rsvpCount={rsvpCount}
          onRsvpClick={onRsvpClick}
        />
        {children}
      </div>

      {openingAnimation === "envelope" ? (
        <EnvelopeAnimation
          isOpened={opened}
          onOpen={onOpen}
          names={coupleNames}
          openButtonText={openButtonText}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
        />
      ) : (
        <EnvelopeDoors
          isOpened={opened}
          onOpen={onOpen}
          names={coupleNames}
          openButtonText={openButtonText}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          cardMaxWidth={cardMaxWidth}
        />
      )}

      {previewMode && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: "rotate(-30deg)", zIndex: 40 }}
        >
          <span
            className="text-white/20 font-black tracking-[0.3em] select-none"
            style={{ fontSize: 52 }}
          >
            PREVIEW
          </span>
        </div>
      )}

      {opened && (
        <div
          className="absolute bottom-0 left-0 right-0 z-50 flex justify-center"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
        >
          <div className="w-full mx-auto" style={{ maxWidth: cardMaxWidth }}>
            <BottomNav
              activeTab={activeTab}
              isMuted={isMuted}
              onTabClick={onTabClick}
              onRsvpClick={onRsvpClick}
              isVisible={true}
              cardMaxWidth="100%"
              showRsvp={inv?.rsvpEnabled === true}
            />
          </div>
        </div>
      )}

      {opened && activeTab && (
        <DetailPanel
          activeTab={activeTab}
          onClose={() => onTabClick(activeTab)}
          invitation={invitation as any}
          isMuted={isMuted}
          onToggleMute={onToggleMute || (() => {})}
          musicTitle={design.musicTitle || undefined}
          musicArtist={design.musicArtist || undefined}
          previewMode={previewMode}
        />
      )}
    </div>
  );
}
