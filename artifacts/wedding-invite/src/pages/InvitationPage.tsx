import React, { useState, useRef, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useGetInvitation, useListDesigns } from "@workspace/api-client-react";
import { EnvelopeDoors } from "@/components/EnvelopeDoors";
import { EnvelopeAnimation } from "@/components/EnvelopeAnimation";
import { WeddingCard } from "@/components/WeddingCard";
import { BottomNav } from "@/components/BottomNav";
import { RsvpModal } from "@/components/RsvpModal";
import { DetailPanel, type TabKey } from "@/components/DetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useDesign } from "@/hooks/use-design";

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
import { RotateCcw, Volume2, VolumeX } from "lucide-react";

import { resolveImageUrl } from "@/lib/r2-url";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const resolvedToken = token ?? "demo";
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const overrideDesignCode = urlParams.get("designCode");
  const { data: invitation, isLoading: invitationLoading } = useGetInvitation(resolvedToken);
  const { data: allDesigns = [], isLoading: designsLoading } = useListDesigns();

  // Resolve template early so we can pass its colors to useDesign
  const inv = invitation as Record<string, unknown> | undefined;
  const designCode = overrideDesignCode ?? (inv?.designCode as string | undefined) ?? "FL001";
  const templateDesign = allDesigns.find((d) => d.designCode === designCode);

  // CSS token overrides: template's colours as base, per-invitation overrides on top
  const { design, isLoading: designLoading } = useDesign(
    invitation
      ? {
          colorPrimary:    (inv?.colorPrimary    as string | undefined) ?? templateDesign?.colorPrimary    ?? undefined,
          colorSecondary:  (inv?.colorSecondary  as string | undefined) ?? templateDesign?.colorSecondary  ?? undefined,
          colorAccent:     (inv?.colorAccent     as string | undefined) ?? templateDesign?.colorAccent     ?? undefined,
          colorBackground: (inv?.colorBackground as string | undefined) ?? templateDesign?.colorBackground ?? undefined,
          colorCard:       (inv?.colorCard       as string | undefined) ?? templateDesign?.colorCard       ?? undefined,
          nameColor:       (inv?.nameColor       as string | undefined) ?? templateDesign?.nameColor       ?? undefined,
        }
      : undefined
  );

  // Opening animation and button text — invitation override → template → global design
  const openingAnimation = (inv?.openingAnimation as string | undefined) ?? templateDesign?.openingAnimation ?? design?.openingAnimation ?? "doors";
  const openButtonText = (inv?.openButtonText as string | undefined) ?? "BUKA";

  // Card/envelope images always come from the matched template
  const resolvedCardImageUrl = resolveImageUrl(templateDesign?.cardImageUrl ?? design?.cardImageUrl);
  const resolvedEnvelopeImageUrl = resolveImageUrl(templateDesign?.envelopeImageUrl ?? design?.envelopeImageUrl);

  const [isOpened, setIsOpened] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardScrollRef = useRef<HTMLDivElement | null>(null);

  const handleReplay = () => {
    setActiveTab(null);
    setIsOpened(false);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setReplayKey((k) => k + 1);
  };

  const musicUrl = templateDesign?.musicUrl ?? design?.musicUrl ?? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3";

  useEffect(() => {
    if (isOpened && musicUrl) {
      const audio = new Audio(musicUrl);
      audio.loop = true;
      audio.volume = 0.35;
      audio.play().catch(() => {});
      audioRef.current = audio;
      return () => {
        audio.pause();
        audio.src = "";
        audioRef.current = null;
      };
    }
    return undefined;
  }, [isOpened, musicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTabClick = (tab: TabKey) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  useEffect(() => {
    if (!isOpened || !cardScrollRef.current) {
      return;
    }

    const scrollContainer = cardScrollRef.current;
    const onScroll = () => {
      if (scrollContainer.scrollTop > 0) {
        setShowBottomNav(true);
      }
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [isOpened]);

  useEffect(() => {
    if (!isOpened) {
      setShowBottomNav(false);
    }
  }, [isOpened]);

  if (invitationLoading || designLoading || designsLoading) {
    return (
      <div className="min-h-dvh w-full bg-background flex items-center justify-center">
        <Skeleton className="w-75 h-100 rounded-2xl" />
      </div>
    );
  }

  const shortGroom = invitation.groomShortName?.trim() || "";
  const shortBride = invitation.brideShortName?.trim() || "";
  const coupleNames = invitation
    ? (shortGroom || shortBride)
      ? `${shortGroom || invitation.groomName} & ${shortBride || invitation.brideName}`
      : `${invitation.brideName} & ${invitation.groomName}`
    : "A & H";

  const cardFontVars = {
    "--name-font-family": fontFamilyStack(inv?.nameFontFamily as string | undefined),
    "--name-font-size":   (inv?.nameFontSize   as string | undefined) ? `${inv?.nameFontSize}px` : undefined,
    "--badge-font-size":  (inv?.badgeFontSize  as string | undefined) ? `${inv?.badgeFontSize}px` : undefined,
    "--name-color":       (inv?.nameColor       as string | undefined) ? `hsl(${inv?.nameColor})` : undefined,
    "--body-font-family": fontFamilyStack(inv?.bodyFontFamily as string | undefined),
  } as React.CSSProperties;

  return (
    <div
      className="relative min-h-dvh w-full bg-background overflow-hidden flex justify-center"
      style={cardFontVars}
    >
      {openingAnimation === "envelope" ? (
        <EnvelopeAnimation
          key={replayKey}
          isOpened={isOpened}
          onOpen={() => setIsOpened(true)}
          names={coupleNames}
          openButtonText={openButtonText}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
        />
      ) : (
        <EnvelopeDoors
          key={replayKey}
          isOpened={isOpened}
          onOpen={() => setIsOpened(true)}
          names={coupleNames}
          openButtonText={openButtonText}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          cardMaxWidth={templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? undefined}
        />
      )}

      {/* Card always rendered behind the doors so it peeks through the frosted glass */}
      <div
        ref={cardScrollRef}
        className={`w-full absolute inset-0 z-10 transition-all duration-700 ${
          isOpened ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden pointer-events-none"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        <WeddingCard
          invitation={invitation}
          cardImageUrl={resolvedCardImageUrl}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          cardMaxWidth={templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? undefined}
        />

        {isOpened && (
          <div
            className="sticky bottom-0 z-50 w-full mx-auto"
            style={{ maxWidth: templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? "420px" }}
          >
            <BottomNav
              activeTab={activeTab}
              isMuted={isMuted}
              onTabClick={handleTabClick}
              onRsvpClick={() => setIsRsvpModalOpen(true)}
              isVisible={showBottomNav}
              cardMaxWidth="100%"
              showRsvp={inv?.rsvpEnabled === true}
            />
          </div>
        )}
      </div>

      {/* Replay + Mute buttons — fixed top-left, only visible when card is open */}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ delay: 1.2, duration: 0.3 }}
            className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-auto"
          >
            <button
              onClick={handleReplay}
              type="button"
              title="Replay"
              className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-md flex items-center justify-center text-primary/70 hover:text-primary hover:bg-card transition-colors"
            >
              <RotateCcw size={15} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              type="button"
              title={isMuted ? "Unmute" : "Mute music"}
              className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-md flex items-center justify-center text-primary/70 hover:text-primary hover:bg-card transition-colors"
            >
              {isMuted ? <VolumeX size={15} strokeWidth={2} /> : <Volume2 size={15} strokeWidth={2} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpened && (
        <DetailPanel
          activeTab={activeTab}
          onClose={() => setActiveTab(null)}
          invitation={invitation}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          musicTitle={templateDesign?.musicTitle ?? design?.musicTitle ?? undefined}
          musicArtist={templateDesign?.musicArtist ?? design?.musicArtist ?? undefined}
        />
      )}

      <RsvpModal
        isOpen={isRsvpModalOpen}
        onClose={() => setIsRsvpModalOpen(false)}
        cardFontVars={cardFontVars}
        invitation={invitation}
        token={resolvedToken}
      />
    </div>
  );
}
