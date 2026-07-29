import React, { useState, useRef, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useGetInvitation, useListDesigns, useListRsvps, useGetRsvpCount } from "@workspace/api-client-react";
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
import { RotateCcw, Volume2, VolumeX, LockKeyhole } from "lucide-react";

import { resolveImageUrl } from "@/lib/r2-url";
import { extractYouTubeId } from "@/lib/youtube";

export default function InvitationPage() {
  const { token, dateCode, slug } = useParams<{ token?: string; dateCode?: string; slug?: string }>();
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const isPublicPath = Boolean(dateCode && slug);
  useEffect(() => {
    if (!isPublicPath) return;
    let cancelled = false;
    fetch(`/api/invitation/public/${encodeURIComponent(dateCode!)}/${encodeURIComponent(slug!)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Invitation not found");
        return response.json() as Promise<{ token: string }>;
      })
      .then((data) => {
        if (!cancelled) setPublicToken(data.token);
      })
      .catch(() => {
        if (!cancelled) setPublicToken("");
      });
    return () => { cancelled = true; };
  }, [dateCode, slug, isPublicPath]);

  const resolvedToken = token ?? publicToken ?? "";
  const tokenReady = Boolean(resolvedToken);
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const overrideDesignCode = urlParams.get("designCode");
  const { data: invitation, isLoading: invitationLoading } = useGetInvitation(resolvedToken, {
    query: {
      queryKey: [`/api/invitation/${resolvedToken}`],
      enabled: tokenReady,
    },
  });
  const { data: allDesigns = [], isLoading: designsLoading } = useListDesigns();
  const { data: rsvps = [] } = useListRsvps({
    query: {
      queryKey: ["rsvps", resolvedToken],
      queryFn: async () => {
        const res = await fetch(`/api/rsvp?invitationToken=${resolvedToken}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch RSVPs");
        return res.json();
      },
      enabled: tokenReady,
    },
  });

  const { data: rsvpCount } = useGetRsvpCount(
    tokenReady ? { invitationToken: resolvedToken } : undefined,
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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
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

  const isLocked = Boolean(inv?.isLocked);
  const verifyPin = async () => {
    if (!/^\d{4}$/.test(unlockPin)) {
      setUnlockError("Please enter your 4-digit PIN.");
      return;
    }
    setUnlocking(true);
    setUnlockError("");
    try {
      const response = await fetch(`/api/invitation/${resolvedToken}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: unlockPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Incorrect PIN");
      setIsUnlocked(true);
      setUnlockPin("");
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : "Incorrect PIN");
    } finally {
      setUnlocking(false);
    }
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

  if (invitationLoading || designLoading || designsLoading || (isPublicPath && publicToken === null)) {
    return (
      <div className="min-h-dvh w-full bg-background flex items-center justify-center">
        <Skeleton className="w-75 h-100 rounded-2xl" />
      </div>
    );
  }

  const invitationRecord = invitation as Record<string, unknown> | undefined;
  const shortGroom = (invitationRecord?.groomShortName as string | undefined)?.trim() || "";
  const shortBride = (invitationRecord?.brideShortName as string | undefined)?.trim() || "";
  const coupleNames = invitation
    ? (shortGroom || shortBride)
      ? `${shortGroom || invitation.groomName} & ${shortBride || invitation.brideName}`
      : `${invitation.groomName} & ${invitation.brideName}`
    : "A & H";
  const envelopeInitials =
    (invitationRecord?.envelopeInitials as string | undefined)?.trim() ||
    `${(invitationRecord?.groomInitial as string | undefined)?.trim() || invitation?.groomName?.trim()?.charAt(0) || ""} & ${(invitationRecord?.brideInitial as string | undefined)?.trim() || invitation?.brideName?.trim()?.charAt(0) || ""}`;
  const logoInitialsUrl = (invitationRecord?.logoInitialsUrl as string | undefined) || undefined;

  const cardFontVars = {
    "--name-font-family": fontFamilyStack(inv?.nameFontFamily as string | undefined),
    "--name-font-size":   (inv?.nameFontSize   as string | undefined) ? `${inv?.nameFontSize}px` : undefined,
    "--badge-font-size":  (inv?.badgeFontSize  as string | undefined) ? `${inv?.badgeFontSize}px` : undefined,
    "--name-color":       (inv?.nameColor       as string | undefined) ? `hsl(${inv?.nameColor})` : undefined,
    "--body-font-family": fontFamilyStack(inv?.bodyFontFamily as string | undefined),
  } as React.CSSProperties;

  const guestWishes = (rsvps ?? [])
    .filter((r) => r.message && r.message.trim())
    .map((r) => ({ name: r.name, message: r.message, createdAt: r.createdAt }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLocked && !isUnlocked) {
    return (
      <div className="min-h-dvh w-full bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl bg-white px-7 py-9 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-xl font-normal text-gray-900">This Invitation is Protected</h1>
          <p className="mt-2 text-sm text-gray-500">Enter the 4-digit PIN to view this invitation.</p>
          <input
            value={unlockPin}
            onChange={(event) => { setUnlockPin(event.target.value.replace(/\D/g, "").slice(0, 4)); setUnlockError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") void verifyPin(); }}
            inputMode="numeric"
            maxLength={4}
            type="password"
            placeholder="••••"
            className="mx-auto mt-7 block w-full max-w-xs rounded-lg border border-gray-300 px-4 py-3 text-center tracking-[0.5em] outline-none focus:border-gray-700"
            aria-label="4-digit PIN"
            autoFocus
          />
          {unlockError && <p className="mt-3 text-xs text-red-600">{unlockError}</p>}
          <button onClick={verifyPin} disabled={unlocking} className="mt-5 w-full max-w-xs bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50">
            {unlocking ? "Checking..." : "VIEW INVITATION"}
          </button>
        </div>
      </div>
    );
  }

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
          names={envelopeInitials || coupleNames}
          openButtonText={openButtonText}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          logoInitialsUrl={logoInitialsUrl ? resolveImageUrl(logoInitialsUrl) : undefined}
        />
      ) : (
        <EnvelopeDoors
          key={replayKey}
          isOpened={isOpened}
          onOpen={() => setIsOpened(true)}
          names={envelopeInitials || coupleNames}
          openButtonText={openButtonText}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          cardMaxWidth={templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? undefined}
          logoInitialsUrl={logoInitialsUrl ? resolveImageUrl(logoInitialsUrl) : undefined}
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
          logoInitialsUrl={logoInitialsUrl ? resolveImageUrl(logoInitialsUrl) : undefined}
          cardMaxWidth={templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? undefined}
          guestWishes={guestWishes}
          rsvpCount={rsvpCount ?? undefined}
          onRsvpClick={() => setIsRsvpModalOpen(true)}
        />

        {/* Hidden YouTube player for background music */}
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

      {/* Unpaid buyer invitations remain visible as a reference preview until
          payment is completed. The admin demo card is never watermarked. */}
      {resolvedToken !== "demo" && invitationRecord?.isPurchased !== true && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          style={{ transform: "rotate(-30deg)" }}
        >
          <span
            className="font-black tracking-[0.3em] text-black/25 select-none"
            style={{ fontSize: "clamp(2rem, 8vw, 5rem)", textShadow: "0 1px 3px rgba(255,255,255,0.45)" }}
          >
            PREVIEW
          </span>
        </div>
      )}

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
          musicTitle={(inv?.musicTitle as string | undefined) ?? templateDesign?.musicTitle ?? design?.musicTitle ?? undefined}
          musicArtist={(inv?.musicArtist as string | undefined) ?? templateDesign?.musicArtist ?? design?.musicArtist ?? undefined}
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
