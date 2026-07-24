import React, { useState, useRef, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useGetInvitation, useListDesigns, useListRsvps, useGetRsvpCount } from "@workspace/api-client-react";
import { InvitationRenderer } from "@/components/InvitationRenderer";
import { RsvpModal } from "@/components/RsvpModal";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useDesign } from "@/hooks/use-design";
import { type TabKey } from "@/components/DetailPanel";

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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const resolvedToken = token ?? "demo";
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const overrideDesignCode = urlParams.get("designCode");
  const { data: invitation, isLoading: invitationLoading } = useGetInvitation(resolvedToken);
  const { data: allDesigns = [], isLoading: designsLoading } = useListDesigns();
  const { data: rsvps = [] } = useListRsvps({
    query: {
      queryKey: ["rsvps", resolvedToken],
      queryFn: async () => {
        const res = await fetch(`/api/rsvp?invitationToken=${resolvedToken}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch RSVPs");
        return res.json();
      },
    },
  });

  const { data: rsvpCount } = useGetRsvpCount(
    resolvedToken ? { invitationToken: resolvedToken } : undefined,
  );

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

  const isPreviewMode = urlParams.get("preview") === "1";
  const [isOpened, setIsOpened] = useState(isPreviewMode);
  const [replayKey, setReplayKey] = useState(0);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement | null>(null);
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

  const musicUrl = (inv?.musicUrl as string | undefined) || templateDesign?.musicUrl || design?.musicUrl || "";
  const youtubeVideoId = musicUrl ? extractYouTubeId(musicUrl) : null;
  const isYouTubeMusic = Boolean(youtubeVideoId);

  useEffect(() => {
    if (!isOpened || !musicUrl) return undefined;

    if (isYouTubeMusic) {
      // YouTube iframe handles playback; mute is toggled by reloading the iframe.
      return undefined;
    }

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
  }, [isOpened, musicUrl, isYouTubeMusic]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTabClick = (tab: TabKey) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  if (invitationLoading || designLoading || designsLoading) {
    return (
      <div className="min-h-dvh w-full bg-background flex items-center justify-center">
        <Skeleton className="w-75 h-100 rounded-2xl" />
      </div>
    );
  }

  const guestWishes = (rsvps ?? [])
    .filter((r) => r.message && r.message.trim())
    .map((r) => ({ name: r.name, message: r.message, createdAt: r.createdAt }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Resolved design: invitation overrides take precedence over the template.
  const tpl = templateDesign as Record<string, unknown> | undefined;
  const active = design as Record<string, unknown> | undefined;
  const resolvedDesign = {
    designCode: templateDesign?.designCode ?? "FL001",
    openingAnimation: (inv?.openingAnimation as string | undefined) ?? tpl?.openingAnimation as string | undefined ?? active?.openingAnimation as string | undefined ?? "doors",
    openButtonText: (inv?.openButtonText as string | undefined) ?? tpl?.openButtonText as string | undefined ?? active?.openButtonText as string | undefined ?? "BUKA",
    colorPrimary: (inv?.colorPrimary as string | undefined) ?? tpl?.colorPrimary as string | undefined ?? active?.colorPrimary as string | undefined ?? undefined,
    colorSecondary: (inv?.colorSecondary as string | undefined) ?? tpl?.colorSecondary as string | undefined ?? active?.colorSecondary as string | undefined ?? undefined,
    colorAccent: (inv?.colorAccent as string | undefined) ?? tpl?.colorAccent as string | undefined ?? active?.colorAccent as string | undefined ?? undefined,
    colorBackground: (inv?.colorBackground as string | undefined) ?? tpl?.colorBackground as string | undefined ?? active?.colorBackground as string | undefined ?? undefined,
    colorCard: (inv?.colorCard as string | undefined) ?? tpl?.colorCard as string | undefined ?? active?.colorCard as string | undefined ?? undefined,
    nameColor: (inv?.nameColor as string | undefined) ?? tpl?.nameColor as string | undefined ?? active?.nameColor as string | undefined ?? undefined,
    nameFontFamily: (inv?.nameFontFamily as string | undefined) ?? tpl?.nameFontFamily as string | undefined ?? active?.nameFontFamily as string | undefined ?? undefined,
    nameFontSize: (inv?.nameFontSize as string | undefined) ?? tpl?.nameFontSize as string | undefined ?? active?.nameFontSize as string | undefined ?? undefined,
    badgeFontSize: (inv?.badgeFontSize as string | undefined) ?? tpl?.badgeFontSize as string | undefined ?? active?.badgeFontSize as string | undefined ?? undefined,
    bodyFontFamily: (inv?.bodyFontFamily as string | undefined) ?? tpl?.bodyFontFamily as string | undefined ?? active?.bodyFontFamily as string | undefined ?? undefined,
    musicTitle: (inv?.musicTitle as string | undefined) ?? tpl?.musicTitle as string | undefined ?? active?.musicTitle as string | undefined ?? undefined,
    musicArtist: (inv?.musicArtist as string | undefined) ?? tpl?.musicArtist as string | undefined ?? active?.musicArtist as string | undefined ?? undefined,
    cardImageUrl: templateDesign?.cardImageUrl ?? design?.cardImageUrl ?? undefined,
    envelopeImageUrl: templateDesign?.envelopeImageUrl ?? design?.envelopeImageUrl ?? undefined,
    cardMaxWidth: templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? undefined,
  };

  const cardFontVars = {
    "--name-font-family": fontFamilyStack(resolvedDesign.nameFontFamily),
    "--name-font-size":   resolvedDesign.nameFontSize ? `${resolvedDesign.nameFontSize}px` : undefined,
    "--badge-font-size":  resolvedDesign.badgeFontSize ? `${resolvedDesign.badgeFontSize}px` : undefined,
    "--name-color":       resolvedDesign.nameColor ? `hsl(${resolvedDesign.nameColor})` : undefined,
    "--body-font-family": fontFamilyStack(resolvedDesign.bodyFontFamily),
  } as React.CSSProperties;

  return (
    <div className="relative min-h-dvh w-full bg-background overflow-hidden flex justify-center">
      <InvitationRenderer
        key={replayKey}
        invitation={invitation}
        design={resolvedDesign}
        opened={isOpened}
        onOpen={() => setIsOpened(true)}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        onRsvpClick={() => setIsRsvpModalOpen(true)}
        rsvpCount={rsvpCount ?? undefined}
        guestWishes={guestWishes}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        cardScrollRef={cardScrollRef}
        className="w-full h-auto min-h-dvh"
      >
        {isOpened && youtubeVideoId && (
          <iframe
            key={`yt-${youtubeVideoId}-${isMuted ? "muted" : "unmuted"}`}
            ref={youtubeRef}
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&mute=${isMuted ? 1 : 0}&playsinline=1`}
            allow="autoplay"
            className="absolute left-0 top-0 w-px h-px opacity-0 pointer-events-none"
            title="Background music"
          />
        )}
      </InvitationRenderer>

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
