import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useGetInvitation, useListDesigns, useGetRsvpCount, useGetActiveDesign } from "@workspace/api-client-react";
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
import { Volume2, VolumeX, LockKeyhole } from "lucide-react";

import { resolveImageUrl } from "@/lib/r2-url";
import { extractYouTubeId } from "@/lib/youtube";

export default function InvitationPage() {
  const { token, dateCode, slug } = useParams<{ token?: string; dateCode?: string; slug?: string }>();
  const [, navigate] = useLocation();
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
        if (!cancelled) navigate("/", { replace: true });
      });
    return () => { cancelled = true; };
  }, [dateCode, slug, isPublicPath, navigate]);

  const resolvedToken = token ?? publicToken ?? "";
  const tokenReady = Boolean(resolvedToken);
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const overrideDesignCode = urlParams.get("designCode");
  const {
    data: invitation,
    isLoading: invitationLoading,
    isError: invitationError,
  } = useGetInvitation(resolvedToken, {
    query: {
      queryKey: [`/api/invitation/${resolvedToken}`],
      enabled: tokenReady,
      retry: false,
    },
  });

  useEffect(() => {
    if (!tokenReady || invitationLoading || !invitationError) return;
    navigate("/", { replace: true });
  }, [invitationError, invitationLoading, navigate, tokenReady]);
  const { data: allDesigns = [], isLoading: designsLoading } = useListDesigns();
  const { data: activeDesign } = useGetActiveDesign();
  const { data: rsvpCount } = useGetRsvpCount(
    tokenReady ? { invitationToken: resolvedToken } : undefined,
  );
  const [guestWishes, setGuestWishes] = useState<Array<{ name: string; message: string; createdAt: string }>>([]);

  useEffect(() => {
    if (!tokenReady) {
      setGuestWishes([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/rsvp/wishes?invitationToken=${encodeURIComponent(resolvedToken)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => response.ok ? response.json() : [])
      .then((wishes: Array<{ name: string; message: string; createdAt: string }>) => setGuestWishes(wishes))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setGuestWishes([]);
      });
    return () => controller.abort();
  }, [resolvedToken, tokenReady]);

  const refreshGuestWishes = () => {
    if (!tokenReady) return;
    fetch(`/api/rsvp/wishes?invitationToken=${encodeURIComponent(resolvedToken)}`, {
      cache: "no-store",
    })
      .then((response) => response.ok ? response.json() : [])
      .then((wishes: Array<{ name: string; message: string; createdAt: string }>) => setGuestWishes(wishes))
      .catch(() => {});
  };

  // Resolve template early so we can pass its colors to useDesign
  const inv = invitation as Record<string, unknown> | undefined;
  const isDemoInvitation = resolvedToken === "demo";
  // Both demo and real invitations use the active card design as the base template.
  // ?designCode= URL param wins (e.g. catalogue preview). Active design is next.
  // inv.designCode is kept only as a last resort when no design has been activated yet.
  const designCode = overrideDesignCode
    ?? activeDesign?.designCode
    ?? (inv?.designCode as string | undefined)
    ?? "FL001";
  const templateDesign = allDesigns.find((d) => d.designCode === designCode);
  // The demo invitation supplies sample content only. Its saved design values
  // must not override the catalogue template selected by ?designCode=.
  const invitationStyle = isDemoInvitation ? undefined : inv;

  // CSS token overrides: template's colours as base, per-invitation overrides on top
  const { design, isLoading: designLoading } = useDesign(
    invitation
      ? {
          colorPrimary:    (invitationStyle?.colorPrimary    as string | undefined) ?? templateDesign?.colorPrimary    ?? undefined,
          colorSecondary:  (invitationStyle?.colorSecondary  as string | undefined) ?? templateDesign?.colorSecondary  ?? undefined,
          colorAccent:     (invitationStyle?.colorAccent     as string | undefined) ?? templateDesign?.colorAccent     ?? undefined,
          colorBackground: (invitationStyle?.colorBackground as string | undefined) ?? templateDesign?.colorBackground ?? undefined,
          colorCard:       (invitationStyle?.colorCard       as string | undefined) ?? templateDesign?.colorCard       ?? undefined,
          nameColor:       (invitationStyle?.nameColor       as string | undefined) ?? templateDesign?.nameColor       ?? undefined,
          nameFontFamily:  (invitationStyle?.nameFontFamily  as string | undefined) ?? templateDesign?.nameFontFamily ?? templateDesign?.fontHeading ?? undefined,
          bodyFontFamily:  (invitationStyle?.bodyFontFamily  as string | undefined) ?? templateDesign?.fontBody ?? undefined,
          nameFontSize:    (invitationStyle?.nameFontSize    as string | undefined) ?? templateDesign?.nameFontSize ?? undefined,
          badgeFontSize:   (invitationStyle?.badgeFontSize   as string | undefined) ?? templateDesign?.badgeFontSize ?? undefined,
        }
      : undefined
  );

  // Opening animation and button text — invitation override → template → global design
  const openingAnimation = (invitationStyle?.openingAnimation as string | undefined) ?? templateDesign?.openingAnimation ?? design?.openingAnimation ?? "doors";

  // Card/envelope images always come from the matched template
  const resolvedCardImageUrl = resolveImageUrl(templateDesign?.cardImageUrl ?? design?.cardImageUrl);
  const resolvedEnvelopeImageUrl = resolveImageUrl(templateDesign?.envelopeImageUrl ?? design?.envelopeImageUrl);

  // "none" style: skip opening animation entirely — invitation is immediately visible
  const [isOpened, setIsOpened] = useState(openingAnimation === "none");
  // Tracks when the door/window panel animation has fully completed (0.9s after open click).
  // Used to reveal first-page content only after the doors have physically swung open.
  const [doorsComplete, setDoorsComplete] = useState(openingAnimation === "none");
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

  const musicUrl = (invitationStyle?.musicUrl as string | undefined) || templateDesign?.musicUrl || design?.musicUrl || "";
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

  // After the door/window panels finish rotating (0.9s), mark the reveal complete.
  // Envelope and none styles skip this — their content is never hidden.
  useEffect(() => {
    const usesDoors = openingAnimation !== "envelope" && openingAnimation !== "none";
    if (!isOpened || !usesDoors) return;
    const t = setTimeout(() => setDoorsComplete(true), 920);
    return () => clearTimeout(t);
  }, [isOpened, openingAnimation]);

  // designLoading is excluded: useGetActiveDesign returns 404 in production
  // (no "active" design row), so gating on it blocks the page unnecessarily.
  // Design tokens are applied via useEffect inside useDesign without needing to wait.
  if (invitationLoading || designsLoading || (isPublicPath && publicToken === null)) {
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
  const envelopeInitials = (invitationRecord?.envelopeInitials as string | undefined)?.trim() || "";
  const envelopeInitialsSize = (invitationRecord?.envelopeInitialsSize as string | undefined)?.trim() || "";
  const initialsImageUrl = resolveImageUrl((invitationRecord?.initialsImageUrl as string | undefined) || "");
  const initialsImageScale = Number(invitationRecord?.initialsImageScale) || 100;

  const cardFontVars = {
    "--name-font-family": fontFamilyStack((invitationStyle?.nameFontFamily as string | undefined) ?? templateDesign?.nameFontFamily ?? templateDesign?.fontHeading),
    "--name-font-size":   ((invitationStyle?.nameFontSize as string | undefined) ?? templateDesign?.nameFontSize) ? `${(invitationStyle?.nameFontSize as string | undefined) ?? templateDesign?.nameFontSize}px` : undefined,
    "--badge-font-size":  ((invitationStyle?.badgeFontSize as string | undefined) ?? templateDesign?.badgeFontSize) ? `${(invitationStyle?.badgeFontSize as string | undefined) ?? templateDesign?.badgeFontSize}px` : undefined,
    "--name-color":       ((invitationStyle?.nameColor as string | undefined) ?? templateDesign?.nameColor) ? `hsl(${(invitationStyle?.nameColor as string | undefined) ?? templateDesign?.nameColor})` : undefined,
    "--body-font-family": fontFamilyStack((invitationStyle?.bodyFontFamily as string | undefined) ?? templateDesign?.fontBody),
  } as React.CSSProperties;

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
          isOpened={isOpened}
          onOpen={() => setIsOpened(true)}
           initialsImageUrl={initialsImageUrl || undefined}
           initialsImageScale={initialsImageScale}
           names={envelopeInitials}
           initialsSize={envelopeInitialsSize}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
        />
      ) : (
        <EnvelopeDoors
          isOpened={isOpened}
          onOpen={() => setIsOpened(true)}
           initialsImageUrl={initialsImageUrl || undefined}
           initialsImageScale={initialsImageScale}
           names={envelopeInitials}
           initialsSize={envelopeInitialsSize}
          envelopeImageUrl={resolvedCardImageUrl}
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
          guestWishes={guestWishes}
          rsvpCount={rsvpCount ?? undefined}
          onRsvpClick={() => setIsRsvpModalOpen(true)}
          hideFirstPageContent={openingAnimation !== "envelope" && openingAnimation !== "none" && !doorsComplete}
          contentOverlayColor={templateDesign?.contentOverlayColor ?? undefined}
          contentOverlayOpacity={templateDesign?.contentOverlayOpacity ?? undefined}
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
          // Single fixed container anchored at viewport bottom, constrained to
          // invitation width. DetailPanel stacks above BottomNav so the footer
          // is never covered by the popup.
          <div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div
              className="w-full flex flex-col pointer-events-auto"
              style={{ maxWidth: templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? "420px" }}
            >
              <DetailPanel
                activeTab={activeTab}
                onClose={() => setActiveTab(null)}
                invitation={invitation}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted((prev) => !prev)}
                musicTitle={(invitationStyle?.musicTitle as string | undefined) ?? templateDesign?.musicTitle ?? design?.musicTitle ?? undefined}
                musicArtist={(invitationStyle?.musicArtist as string | undefined) ?? templateDesign?.musicArtist ?? design?.musicArtist ?? undefined}
                inset
              />
              <BottomNav
                activeTab={activeTab}
                isMuted={isMuted}
                onTabClick={handleTabClick}
                onRsvpClick={() => setIsRsvpModalOpen(true)}
                isVisible={showBottomNav}
                cardMaxWidth="100%"
                showRsvp={inv?.rsvpEnabled === true}
                showGift={inv?.giftDisplay === true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unpaid buyer invitations remain visible as a reference preview until
          payment is completed. The admin demo card is never watermarked. */}
      {resolvedToken !== "demo" && invitationRecord?.isPurchased !== true && (
        <div
          className="fixed inset-x-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center pointer-events-none"
          style={{ background: "rgba(80, 80, 80, 0.28)", height: 30 }}
        >
          <span
            className="select-none text-[11px] font-medium uppercase tracking-[0.18em] text-white/75"
          >
            PREVIEW
          </span>
        </div>
      )}

      {/* Mute button — fixed top-left, only visible when card is open */}
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
        onSubmitted={refreshGuestWishes}
        cardFontVars={cardFontVars}
        invitation={invitation}
        token={resolvedToken}
      />
    </div>
  );
}
