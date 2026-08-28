import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useGetInvitation, useListDesigns, useGetRsvpCount, useGetActiveDesign } from "@workspace/api-client-react";
import { EnvelopeDoors } from "@/components/EnvelopeDoors";
import { EnvelopeAnimation } from "@/components/EnvelopeAnimation";
import { InvitationLoader } from "@/components/InvitationLoader";
import { WeddingCard } from "@/components/WeddingCard";
import { BottomNav } from "@/components/BottomNav";
import { RsvpModal } from "@/components/RsvpModal";
import { DetailPanel, type TabKey, type RegistryItem } from "@/components/DetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useDesign } from "@/hooks/use-design";

// Minimal typings for the YouTube IFrame Player API (window.YT).
// We only declare what we actually call so there is no dependency on @types/youtube.
interface YTPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  getPlayerState(): number;
  destroy(): void;
}
type YTStatusType = "idle" | "loading" | "ready" | "playing" | "paused" | "blocked" | "error";
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT?: { Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayerInstance };
    onYouTubeIframeAPIReady?: () => void;
  }
}

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
  const initialsImageCacheBust = useRef(Date.now()).current;
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
        // Server returns rsvpToken (not token) on the public slug URL so the
        // private editor token is never exposed in the network response.
        if (!cancelled) setPublicToken((data as Record<string, unknown>).rsvpToken as string ?? data.token);
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
  // ?designCode= URL param wins (e.g. catalogue preview).
  // For real invitations, buyer's saved designCode is next.
  // Active global design is a fallback (used for demo or when buyer has no saved choice).
  const designCode = overrideDesignCode
    ?? (isDemoInvitation ? undefined : (inv?.designCode as string | undefined))
    ?? activeDesign?.designCode
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
          colorForeground: (invitationStyle?.colorForeground as string | undefined) ?? templateDesign?.colorForeground ?? undefined,
          colorHeading:    (invitationStyle?.colorHeading    as string | undefined) ?? templateDesign?.colorHeading    ?? undefined,
          colorMuted:      (invitationStyle?.colorMuted      as string | undefined) ?? templateDesign?.colorMuted      ?? undefined,
          nameColor:       (invitationStyle?.nameColor       as string | undefined) ?? templateDesign?.nameColor       ?? undefined,
          nameFontFamily:  (invitationStyle?.nameFontFamily  as string | undefined) ?? templateDesign?.nameFontFamily ?? templateDesign?.fontHeading ?? undefined,
          bodyFontFamily:  (invitationStyle?.bodyFontFamily  as string | undefined) ?? templateDesign?.fontBody ?? undefined,
          nameFontSize:    (invitationStyle?.nameFontSize    as string | undefined) ?? templateDesign?.nameFontSize ?? undefined,
          badgeFontSize:   (invitationStyle?.badgeFontSize   as string | undefined) ?? templateDesign?.badgeFontSize ?? undefined,
          greetingFontSize: (invitationStyle?.greetingFontSize as string | undefined) ?? (templateDesign as any)?.greetingFontSize ?? undefined,
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
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>([]);
  useEffect(() => {
    if (!resolvedToken) return;
    fetch(`/api/registry/${resolvedToken}`)
      .then(r => r.ok ? r.json() : [])
      .then((items: RegistryItem[]) => setRegistryItems(Array.isArray(items) ? items : []))
      .catch(() => {});
  }, [resolvedToken]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  // ── Audio ────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStartedRef = useRef(false);
  const cardScrollRef = useRef<HTMLDivElement | null>(null);

  const musicUrl = (invitationStyle?.musicUrl as string | undefined) || (inv?.musicUrl as string | undefined) || templateDesign?.musicUrl || design?.musicUrl || "";
  const youtubeVideoId = musicUrl ? extractYouTubeId(musicUrl) : null;
  const isYouTubeMusic = Boolean(youtubeVideoId);

  // Debug: log resolved music values every time they change.
  // Safe to leave in production — console.debug is silent unless DevTools open.
  React.useEffect(() => {
    console.log("[music] musicUrl:", musicUrl || "(none)");
    console.log("[music] youtubeVideoId:", youtubeVideoId ?? "(not YouTube)");
    console.log("[music] isYouTubeMusic:", isYouTubeMusic);
  }, [musicUrl, youtubeVideoId, isYouTubeMusic]);

  // ── iOS Safari detection ─────────────────────────────────────────────────
  // iOS Safari cannot propagate user-activation from a parent frame click into
  // an iframe's audio context. We detect iOS once at mount and use a different
  // UX: a visible mini YouTube player the user taps directly instead.
  //
  // Newer iPads (M1/M2) report userAgent as "Macintosh" — check maxTouchPoints
  // to catch them too.

  // ── HTML5 audio (non-YouTube direct URLs) ────────────────────────────────
  useEffect(() => {
    if (!musicUrl || isYouTubeMusic) return undefined;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = false;
    audio.preload = "auto";

    // Diagnostic event listeners — help identify if the URL is unreachable
    // or the browser cannot decode the audio resource.
    audio.addEventListener("loadedmetadata", () =>
      console.log("[music] audio: loadedmetadata — duration:", audio.duration));
    audio.addEventListener("canplay", () =>
      console.log("[music] audio: canplay"));
    audio.addEventListener("playing", () =>
      console.log("[music] audio: playing ✓"));
    audio.addEventListener("pause", () =>
      console.log("[music] audio: paused"));
    audio.addEventListener("stalled", () =>
      console.log("[music] audio: stalled (network issue?)"));
    audio.addEventListener("ended", () =>
      console.log("[music] audio: ended (loop not working?)"));
    audio.addEventListener("error", () => {
      const e = audio.error;
      const codes: Record<number, string> = {
        1: "ABORTED", 2: "NETWORK", 3: "DECODE", 4: "SRC_NOT_SUPPORTED",
      };
      console.log("[music] audio error — code:", e?.code,
        codes[e?.code ?? 0] ?? "unknown", "message:", e?.message ?? "(none)");
    });

    audio.load();
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      audioStartedRef.current = false;
    };
  }, [musicUrl, isYouTubeMusic]);

  // Retry on next interaction if .play() was blocked by autoplay policy.
  const attachInteractionRetry = useCallback(() => {
    console.log("[music] autoplay blocked — waiting for next user interaction to retry");
    const retry = () => {
      if (!audioRef.current || audioStartedRef.current) return;
      console.log("[music] retry: calling audio.play() on next interaction");
      audioRef.current.play()
        .then(() => {
          audioStartedRef.current = true;
          console.log("[music] retry: audio.play() ✓ started");
        })
        .catch((err: Error) => {
          console.log("[music] retry: audio.play() ✗ still blocked:", err.name, err.message);
        });
    };
    document.addEventListener("touchstart", retry, { once: true, capture: true });
    document.addEventListener("click",      retry, { once: true, capture: true });
  }, []);

  // Called synchronously inside the envelope tap — works on all platforms for
  // direct audio URLs (HTML5 <audio> .play() inside gesture is universally ok).
  // Per spec: do NOT mark audioStartedRef true until play() actually resolves.
  const playAudioNow = useCallback(() => {
    if (!audioRef.current || audioStartedRef.current) return;
    console.log("[music] audio.play() calling...");
    audioRef.current.play()
      .then(() => {
        audioStartedRef.current = true;
        console.log("[music] audio.play() ✓ started");
      })
      .catch((err: Error) => {
        console.log("[music] audio.play() ✗ blocked:", err.name, "-", err.message);
        attachInteractionRetry();
      });
  }, [attachInteractionRetry]);

  // Fallback for openingAnimation="none" (no envelope tap): try autoplay on open.
  useEffect(() => {
    if (!isOpened || !musicUrl || isYouTubeMusic) return undefined;
    if (!audioStartedRef.current && audioRef.current) {
      console.log("[music] fallback autoplay (no-envelope mode): calling audio.play()");
      audioRef.current.play()
        .then(() => {
          audioStartedRef.current = true;
          console.log("[music] fallback autoplay ✓ started");
        })
        .catch((err: Error) => {
          console.log("[music] fallback autoplay ✗ blocked:", err.name, "-", err.message);
          attachInteractionRetry();
        });
    }
    return undefined;
  }, [isOpened, musicUrl, isYouTubeMusic, attachInteractionRetry]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  // ── YouTube music — official IFrame Player API ───────────────────────────
  // We load https://www.youtube.com/iframe_api, create a YT.Player with
  // autoplay:0, then call player.playVideo() from the real envelope gesture.
  //
  // Muted-autoplay + gesture-unmute strategy (works on iOS Safari too):
  //   1. Player loads with autoplay:1 mute:1 → starts playing silently immediately.
  //      iOS allows muted autoplay (same as <video muted autoplay>).
  //   2. User taps envelope → ytPlay() → unMute() + setVolume(100) called
  //      synchronously IN the gesture handler → iOS allows unmuting during gesture.
  //   3. Music becomes audible — no extra taps needed on any platform.
  //
  // Tap-before-ready timing:
  //   If the user taps before onReady fires, ytTapPendingRef=true.
  //   onReady then calls unMute()+setVolume(100)+playVideo() immediately.
  const ytPlayerRef    = useRef<YTPlayerInstance | null>(null);
  const ytPlayerDivRef = useRef<HTMLDivElement | null>(null);
  const ytTapPendingRef = useRef(false);  // user tapped before player was ready
  const ytStartedRef   = useRef(false);
  const [ytStatus, setYtStatus] = useState<YTStatusType>("idle");

  const YT_STATE: Record<number, string> = {
    [-1]: "unstarted", 0: "ended", 1: "playing", 2: "paused", 3: "buffering", 5: "cued",
  };
  const YT_ERROR: Record<number, string> = {
    2: "invalid parameter", 5: "HTML5 player error", 100: "video not found / private",
    101: "embedding not allowed", 150: "embedding not allowed",
  };

  // Called once the API script is loaded and window.YT.Player is available.
  const initYtPlayer = useCallback((videoId: string) => {
    if (ytPlayerRef.current || !window.YT?.Player) return;
    console.log("[music] YT: initializing YT.Player for", videoId);

    const div = document.createElement("div");
    div.id = "yt-bg-player";
    // Player must be in the viewport for YouTube's autoplay to trigger.
    // We keep it at top:0 left:0 (corner of the viewport) but fully invisible
    // via opacity:0 and z-index:-1 (behind all page content).
    // 320×180 satisfies YouTube's minimum viewport size requirement.
    // pointer-events:none ensures it never intercepts user touches.
    div.style.cssText =
      "position:fixed;top:0;left:0;" +
      "width:320px;height:180px;" +
      "opacity:0;pointer-events:none;z-index:-1;overflow:hidden;";
    document.body.appendChild(div);
    ytPlayerDivRef.current = div;

    console.log("[music] YouTube origin:", window.location.origin);

    ytPlayerRef.current = new window.YT.Player(div, {
      videoId,
      playerVars: {
        // autoplay:1 + mute:1 — start playing silently as soon as the player
        // is ready. iOS allows muted autoplay; we unmute on the envelope tap
        // gesture so no extra taps are needed on any platform.
        autoplay: 1,
        mute: 1,
        loop: 1,
        playlist: videoId,    // required for loop to work
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin,
        enablejsapi: 1,
      },
      events: {
        onReady: (e: { target: YTPlayerInstance }) => {
          console.log("[music] YouTube player ready");
          // Log the actual iframe src so we can confirm origin= is correct.
          const iframe = div.querySelector("iframe");
          if (iframe) {
            console.log("[music] YouTube iframe src:", iframe.src);
          }
          setYtStatus("ready");
          // If the user tapped the envelope while the API was still loading,
          // unmute + ensure playing now (still within the user-activation window).
          if (ytTapPendingRef.current) {
            console.log("[music] YT onReady: tap was pending → unmuting + playing");
            e.target.unMute();
            e.target.setVolume(100);
            e.target.playVideo();
          }
        },
        onStateChange: (e: { data: number }) => {
          const label = YT_STATE[e.data] ?? `unknown(${e.data})`;
          console.log("[music] YouTube state:", e.data, label);
          if (e.data === 1) {
            // Actually playing
            setYtStatus("playing");
            ytStartedRef.current = true;
            ytTapPendingRef.current = false;
          } else if (e.data === 2) {
            setYtStatus("paused");
          } else if (e.data === -1 && ytTapPendingRef.current) {
            // State -1 (unstarted) after we called playVideo() means autoplay blocked
            console.log("[music] YT: state -1 after playVideo() — autoplay blocked by browser");
            setYtStatus("blocked");
          }
        },
        onError: (e: { data: number }) => {
          const label = YT_ERROR[e.data] ?? `unknown error code ${e.data}`;
          console.log("[music] YouTube error:", e.data, "→", label);
          setYtStatus("error");
        },
      },
    } as Record<string, unknown>);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the YouTube IFrame API script once when we know the video ID.
  useEffect(() => {
    if (!youtubeVideoId) return;
    setYtStatus("loading");
    console.log("[music] YT: setting up for video", youtubeVideoId);

    // Chain any pre-existing global callback so we don't overwrite it.
    const prevCb = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCb?.();
      console.log("[music] YT IFrame API ready (global callback)");
      initYtPlayer(youtubeVideoId);
    };

    // API might already be present from a previous load (e.g. HMR / re-render).
    if (window.YT?.Player) {
      console.log("[music] YT API already present — init player immediately");
      initYtPlayer(youtubeVideoId);
    } else if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
      console.log("[music] YT IFrame API script injected");
    }

    return () => {
      // Tear down the player when the component unmounts or the video ID changes.
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
        ytPlayerRef.current = null;
      }
      if (ytPlayerDivRef.current) {
        ytPlayerDivRef.current.remove();
        ytPlayerDivRef.current = null;
      }
      ytStartedRef.current   = false;
      ytTapPendingRef.current = false;
      setYtStatus("idle");
    };
  }, [youtubeVideoId, initYtPlayer]);

  // Called synchronously from the envelope tap gesture (all platforms including iOS).
  // Strategy: player is already playing muted (autoplay:1 mute:1).
  // We just unmute it here — this single call is allowed by iOS Safari
  // because it happens synchronously within the user's gesture handler.
  const ytPlay = useCallback(() => {
    if (!youtubeVideoId) {
      console.log("[music] ytPlay: no videoId");
      return;
    }
    if (ytPlayerRef.current) {
      console.log("[music] ytPlay: unmuting player in gesture context");
      ytPlayerRef.current.unMute();
      ytPlayerRef.current.setVolume(100);
      ytPlayerRef.current.playVideo(); // ensure playing if autoplay was blocked
      setIsMuted(false);
    } else {
      // Player still loading — store intent; onReady will unmute for us.
      console.log("[music] ytPlay: player not ready yet → storing tap intent");
      ytTapPendingRef.current = true;
    }
  }, [youtubeVideoId]);

  const toggleMute = useCallback(() => {
    if (isYouTubeMusic) {
      if (isMuted) {
        ytPlayerRef.current?.unMute();
        setIsMuted(false);
      } else {
        ytPlayerRef.current?.mute();
        setIsMuted(true);
      }
    } else {
      setIsMuted((prev) => !prev);
    }
  }, [isMuted, isYouTubeMusic]);

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
    if (!isOpened) {
      setShowBottomNav(false);
    } else {
      // Reset card scroll to top when envelope opens so back-navigation
      // doesn't restore a mid-scroll position that shows blank content.
      if (cardScrollRef.current) cardScrollRef.current.scrollTop = 0;
      // Auto-show footer after 2 seconds so guests know they can scroll down.
      const t = setTimeout(() => setShowBottomNav(true), 2000);
      return () => clearTimeout(t);
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

  // Wax seal: invitation override → design default → none.
  // For the demo invitation, always use the card design's seal so each catalog
  // card shows its own wax seal instead of a value stored on the shared demo row.
  // Must be declared before any early returns to satisfy the rules of hooks.
  const waxSealId = isDemoInvitation
    ? ((templateDesign?.waxSealId as number | undefined) ?? null)
    : ((inv?.waxSealId as number | undefined) ?? (templateDesign?.waxSealId as number | undefined) ?? null);
  const [waxSealImageUrl, setWaxSealImageUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!waxSealId) { setWaxSealImageUrl(undefined); return; }
    fetch(`/api/wax-seals/${waxSealId}`)
      .then(r => r.ok ? r.json() : null)
      .then((seal: { imageUrl?: string } | null) => {
        if (seal?.imageUrl) setWaxSealImageUrl(resolveImageUrl(seal.imageUrl) || undefined);
      })
      .catch(() => {});
  }, [waxSealId]);

  // designLoading is excluded: useGetActiveDesign returns 404 in production
  // (no "active" design row), so gating on it blocks the page unnecessarily.
  // Design tokens are applied via useEffect inside useDesign without needing to wait.
  if (invitationLoading || designsLoading || (isPublicPath && publicToken === null)) {
    return <InvitationLoader />;
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
  const resolvedInitialsImageUrl = resolveImageUrl((invitationRecord?.initialsImageUrl as string | undefined) || "");
  const initialsImageUrl = resolvedInitialsImageUrl
    ? `${resolvedInitialsImageUrl}&t=${initialsImageCacheBust}`
    : "";

  const initialsImageScale = Number(invitationRecord?.initialsImageScale) || 100;

  const resolvedColorHeading = (invitationStyle?.colorHeading as string | undefined) ?? templateDesign?.colorHeading ?? undefined;
  const resolvedColorMuted   = (invitationStyle?.colorMuted   as string | undefined) ?? templateDesign?.colorMuted   ?? undefined;

  const cardFontVars = {
    "--name-font-family":  fontFamilyStack((invitationStyle?.nameFontFamily as string | undefined) ?? templateDesign?.nameFontFamily ?? templateDesign?.fontHeading),
    "--name-font-size":    ((invitationStyle?.nameFontSize as string | undefined) ?? templateDesign?.nameFontSize) ? `${(invitationStyle?.nameFontSize as string | undefined) ?? templateDesign?.nameFontSize}px` : undefined,
    "--badge-font-size":   ((invitationStyle?.badgeFontSize as string | undefined) ?? templateDesign?.badgeFontSize) ? `${(invitationStyle?.badgeFontSize as string | undefined) ?? templateDesign?.badgeFontSize}px` : undefined,
    "--greeting-font-size": ((invitationStyle?.greetingFontSize as string | undefined) ?? (templateDesign as any)?.greetingFontSize) ? `${(invitationStyle?.greetingFontSize as string | undefined) ?? (templateDesign as any)?.greetingFontSize}px` : undefined,
    "--greeting-color": ((invitationStyle?.greetingColor as string | undefined) ?? (templateDesign as any)?.greetingColor) ? `hsl(${(invitationStyle?.greetingColor as string | undefined) ?? (templateDesign as any)?.greetingColor})` : undefined,
    "--eyebrow-font-size": ((invitationStyle?.eyebrowFontSize as string | undefined) ?? (templateDesign as any)?.eyebrowFontSize) ? `${(invitationStyle?.eyebrowFontSize as string | undefined) ?? (templateDesign as any)?.eyebrowFontSize}px` : undefined,
    "--day-font-size": ((invitationStyle?.dayFontSize as string | undefined) ?? (templateDesign as any)?.dayFontSize) ? `${(invitationStyle?.dayFontSize as string | undefined) ?? (templateDesign as any)?.dayFontSize}px` : undefined,
    "--date-font-size": ((invitationStyle?.dateFontSize as string | undefined) ?? (templateDesign as any)?.dateFontSize) ? `${(invitationStyle?.dateFontSize as string | undefined) ?? (templateDesign as any)?.dateFontSize}px` : undefined,
    "--hashtag-font-size": ((invitationStyle?.hashtagFontSize as string | undefined) ?? (templateDesign as any)?.hashtagFontSize) ? `${(invitationStyle?.hashtagFontSize as string | undefined) ?? (templateDesign as any)?.hashtagFontSize}px` : undefined,
    "--name-color":        ((invitationStyle?.nameColor as string | undefined) ?? templateDesign?.nameColor) ? `hsl(${(invitationStyle?.nameColor as string | undefined) ?? templateDesign?.nameColor})` : undefined,
    "--body-font-family":  fontFamilyStack((invitationStyle?.bodyFontFamily as string | undefined) ?? templateDesign?.fontBody),
    // Section title color — falls back to --primary so existing designs are unchanged
    "--color-heading":     resolvedColorHeading ? `hsl(${resolvedColorHeading})` : undefined,
    // Muted text color — falls back to foreground/60 so existing designs are unchanged
    "--color-muted":       resolvedColorMuted   ? `hsl(${resolvedColorMuted})`   : undefined,
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
          onTap={() => {
            console.log("[music] envelope tap (EnvelopeAnimation) — isYouTubeMusic:", isYouTubeMusic);
            if (isYouTubeMusic) { ytPlay(); }
            else { playAudioNow(); }
          }}
          onOpen={() => { setIsOpened(true); }}
          initialsImageUrl={initialsImageUrl || undefined}
          initialsImageScale={initialsImageScale}
          names={envelopeInitials}
          initialsSize={envelopeInitialsSize}
          envelopeImageUrl={resolvedEnvelopeImageUrl}
          waxSealImageUrl={waxSealImageUrl}
        />
      ) : (
        <EnvelopeDoors
          isOpened={isOpened}
          onOpen={() => {
            console.log("[music] envelope open (EnvelopeDoors) — isYouTubeMusic:", isYouTubeMusic);
            if (isYouTubeMusic) { ytPlay(); }
            else { playAudioNow(); }
            setIsOpened(true);
          }}
          initialsImageUrl={initialsImageUrl || undefined}
          initialsImageScale={initialsImageScale}
          names={envelopeInitials}
          initialsSize={envelopeInitialsSize}
          envelopeImageUrl={resolvedCardImageUrl}
          waxSealImageUrl={waxSealImageUrl}
          cardMaxWidth={templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? undefined}
        />
      )}

      {/* Card always rendered behind the doors so it peeks through the frosted glass */}
      <div
        ref={cardScrollRef}
        className={`w-full absolute inset-0 z-10 transition-all duration-700 ${
          !isOpened
            ? "overflow-hidden pointer-events-none"
            : (activeTab || isRsvpModalOpen)
              ? "overflow-hidden overflow-x-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
              : "overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
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
          overlayEnabled={
            !designsLoading &&
            templateDesign !== undefined &&
            (templateDesign as Record<string, unknown>).overlayEnabled !== false &&
            (invitation as Record<string, unknown> | undefined)?.overlayEnabled !== false
          }
        />

        {isOpened && (
          // Single fixed container anchored at viewport bottom, constrained to
          // invitation width. DetailPanel stacks above BottomNav so the footer
          // is never covered by the popup.
          <div
            className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
          >
            <div
              className="w-full mx-auto flex flex-col pointer-events-auto"
              style={{ maxWidth: templateDesign?.cardMaxWidth ?? design?.cardMaxWidth ?? "462px" }}
            >
              <RsvpModal
                isOpen={isRsvpModalOpen}
                onClose={() => setIsRsvpModalOpen(false)}
                onSubmitted={refreshGuestWishes}
                cardFontVars={cardFontVars}
                invitation={invitation}
                token={resolvedToken}
                inset
              />
              <DetailPanel
                activeTab={activeTab}
                onClose={() => setActiveTab(null)}
                invitation={invitation}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                musicTitle={(invitationStyle?.musicTitle as string | undefined) ?? templateDesign?.musicTitle ?? design?.musicTitle ?? undefined}
                musicArtist={(invitationStyle?.musicArtist as string | undefined) ?? templateDesign?.musicArtist ?? design?.musicArtist ?? undefined}
                registryItems={registryItems}
                inset
              />
              <BottomNav
                activeTab={activeTab}
                isMuted={isMuted}
                onTabClick={handleTabClick}
                onRsvpClick={() => setIsRsvpModalOpen(true)}
                isVisible={showBottomNav}
                cardMaxWidth="100%"
                showRsvp={isDemoInvitation || inv?.rsvpEnabled !== false}
                showGift={isDemoInvitation || inv?.giftDisplay === true || registryItems.length > 0}
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

      {/* Music controls — fixed top-left, only visible when card is open.
          iOS + YouTube: shows 🎵 button → reveals mini visible player to tap.
          Desktop / Android / direct audio: shows standard mute toggle.
          ytStatus badge shown while diagnosing autoplay behaviour. */}
      <AnimatePresence>
        {isOpened && musicUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ delay: 1.2, duration: 0.3 }}
            className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-auto"
          >
            <button
              onClick={toggleMute}
              type="button"
              title={isMuted ? "Unmute" : "Mute music"}
              className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-md flex items-center justify-center text-primary/70 hover:text-primary hover:bg-card transition-colors"
            >
              {isMuted ? <VolumeX size={15} strokeWidth={2} /> : <Volume2 size={15} strokeWidth={2} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
}
