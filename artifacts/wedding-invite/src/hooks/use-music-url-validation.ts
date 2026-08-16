import { useState, useEffect, useRef } from "react";
import { extractYouTubeId } from "@/lib/youtube";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MusicValidationStatus =
  | "idle"           // URL is empty — music is optional, save allowed
  | "checking"       // Creating a test YouTube player to verify embeddability
  | "valid"          // YT player onReady fired — video is embeddable
  | "not-embeddable" // YT player onError 101/150 — owner disabled embedding
  | "unavailable"    // YT player onError 100 — video not found / private
  | "invalid-url"    // Unparseable string OR YouTube host with no video ID
  | "direct-audio";  // Valid non-YouTube URL — treat as direct audio

export interface MusicValidation {
  status: MusicValidationStatus;
  /** User-facing message (empty string when nothing should be shown). */
  message: string;
  /** True = save button must be disabled until status resolves. */
  isBlocking: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESSAGES: Record<MusicValidationStatus, string> = {
  idle:             "",
  checking:         "Checking this video…",
  valid:            "✓ This video is ready to use.",
  "not-embeddable": "⚠️ This YouTube video can't be played on the invitation website. Please choose another video.",
  unavailable:      "⚠️ This YouTube video is unavailable. Please choose another video.",
  "invalid-url":    "⚠️ Please enter a valid YouTube or audio link.",
  "direct-audio":   "",
};

const BLOCKING: Record<MusicValidationStatus, boolean> = {
  idle:             false,
  checking:         true,
  valid:            false,
  "not-embeddable": true,
  unavailable:      true,
  "invalid-url":    true,
  "direct-audio":   false,
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be",
]);

function isYouTubeUrl(url: string): boolean {
  try {
    return YOUTUBE_HOSTS.has(new URL(url).hostname.replace(/^www\./, ""));
  } catch { return false; }
}

// ── YT IFrame API loader ──────────────────────────────────────────────────────
// Shared promise so we only load the script once across all hook instances.
let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady as (() => void) | undefined;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    }
  });

  return ytApiPromise;
}

/**
 * Creates a hidden temporary YT.Player to test whether the given videoId
 * can actually be embedded.  Resolves with:
 *   "valid"           — onReady fired (embeddable ✓)
 *   "not-embeddable"  — onError 101 / 150 (owner disabled embedding)
 *   "unavailable"     — onError 100 (video not found / private)
 *   "idle"            — timeout or unrecognised error (don't block save)
 *
 * The temporary player and div are cleaned up after the result is known.
 */
function testEmbeddability(
  videoId: string,
  signal: AbortSignal,
): Promise<MusicValidationStatus> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    let done = false;
    // eslint-disable-next-line prefer-const
    let player: { destroy: () => void } | null = null;

    const finish = (status: MusicValidationStatus) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { player?.destroy(); } catch { /* ignore */ }
      div.remove();
      resolve(status);
    };

    // 10-second timeout — if YouTube hasn't responded by then, don't block save.
    const timer = setTimeout(() => finish("idle"), 10_000);

    // Abort support: if the hook re-runs (URL changed), stop waiting.
    signal.addEventListener("abort", () => finish("idle"), { once: true });

    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    document.body.appendChild(div);

    player = new w.YT.Player(div, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        origin: window.location.origin,
        host: "https://www.youtube-nocookie.com",
      },
      events: {
        onReady: () => finish("valid"),
        onError: (e: { data: number }) => {
          if (e.data === 100) finish("unavailable");
          else if (e.data === 101 || e.data === 150) finish("not-embeddable");
          else finish("idle"); // e.g. e.data === 5 (HTML5 player error) — don't block
        },
      },
    });
  });
}

const DEBOUNCE_MS = 700;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Validates a music URL and returns the current validation state.
 *
 * For YouTube URLs the hook uses a real hidden YT.Player to detect
 * embedding restrictions accurately — the same player that InvitationPage
 * uses.  This means it will correctly catch error 150 (embedding disabled)
 * which the oEmbed API cannot detect.
 *
 * Classification:
 *   - empty           → idle      (no message, save allowed)
 *   - non-URL text    → invalid-url (blocked)
 *   - YouTube + ID    → real YT.Player check (blocking while checking)
 *   - YouTube, no ID  → invalid-url (blocked)
 *   - other valid URL → direct-audio (allowed, existing MP3 behaviour)
 */
export function useMusicUrlValidation(url: string): MusicValidation {
  const [status, setStatus] = useState<MusicValidationStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-progress check from the previous URL.
    abortRef.current?.abort();
    abortRef.current = null;

    const trimmed = url.trim();

    // ── Empty ───────────────────────────────────────────────────────────
    if (!trimmed) {
      setStatus("idle");
      return undefined;
    }

    // ── URL parse ──────────────────────────────────────────────────────
    let isValidUrl = false;
    try { new URL(trimmed); isValidUrl = true; } catch { /* falls through */ }

    if (!isValidUrl) {
      setStatus("invalid-url");
      return undefined;
    }

    // ── YouTube URL ────────────────────────────────────────────────────
    if (isYouTubeUrl(trimmed)) {
      const videoId = extractYouTubeId(trimmed);
      if (!videoId) {
        setStatus("invalid-url");
        return undefined;
      }

      setStatus("checking");
      const controller = new AbortController();
      abortRef.current = controller;

      // Debounce: wait for user to stop typing before spinning up a player.
      const timer = setTimeout(() => {
        loadYouTubeApi()
          .then(() => testEmbeddability(videoId, controller.signal))
          .then((result) => {
            if (!controller.signal.aborted) setStatus(result);
          })
          .catch(() => {
            if (!controller.signal.aborted) setStatus("idle");
          });
      }, DEBOUNCE_MS);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    // ── Direct audio / non-YouTube URL ─────────────────────────────────
    setStatus("direct-audio");
    return undefined;
  }, [url]);

  return {
    status,
    message: MESSAGES[status],
    isBlocking: BLOCKING[status],
  };
}
