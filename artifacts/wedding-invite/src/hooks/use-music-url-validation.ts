import { useState, useEffect, useRef } from "react";
import { extractYouTubeId } from "@/lib/youtube";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MusicValidationStatus =
  | "idle"           // URL is empty — music is optional, save allowed
  | "checking"       // Calling /api/music/validate (oEmbed check)
  | "valid"          // Video exists and oEmbed confirms it is accessible
  | "not-embeddable" // oEmbed 401/403 — owner disabled embedding (error 101/150)
  | "unavailable"    // oEmbed 404 — video not found / private
  | "invalid-url"    // Non-parseable string OR YouTube host with no video ID
  | "direct-audio";  // Valid non-YouTube URL — treat as direct audio (allowed)

// Note: validation and actual IFrame playback are separate checks.
// The runtime YouTube player in InvitationPage remains responsible for
// reporting playback errors (153, 101, 150, 100, 5, 2) after the fix.

export interface MusicValidation {
  status: MusicValidationStatus;
  /** User-facing message (empty string when nothing should be shown). */
  message: string;
  /** True = save button must be disabled until status resolves. */
  isBlocking: boolean;
  /** YouTube video title, populated when status === "valid". Null otherwise. */
  title: string | null;
  /** YouTube channel/artist name, populated when status === "valid". Null otherwise. */
  author: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESSAGES: Record<MusicValidationStatus, string> = {
  idle:             "",
  checking:         "Checking this video…",
  valid:            "✓ This video is ready to use.",
  "not-embeddable": "⚠️ This YouTube video can't be embedded on other websites. Please choose another video.",
  unavailable:      "⚠️ This YouTube video is unavailable or private. Please choose another video.",
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

const DEBOUNCE_MS = 600;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Validates a music URL using the server-side /api/music/validate endpoint
 * (YouTube oEmbed check).  This catches videos that don't exist or have
 * embedding disabled at the metadata level (error 101/150).
 *
 * Note: runtime errors such as Error 153 (Referrer-Policy misconfiguration)
 * are server/browser config issues, not per-video issues, and are handled
 * separately by the Referrer-Policy header in app.ts.
 */
export function useMusicUrlValidation(url: string): MusicValidation {
  const [status, setStatus] = useState<MusicValidationStatus>("idle");
  const [title,  setTitle]  = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-progress check from the previous URL value.
    abortRef.current?.abort();
    abortRef.current = null;

    const trimmed = url.trim();

    // ── Empty ──────────────────────────────────────────────────────────
    if (!trimmed) {
      setStatus("idle");
      setTitle(null);
      setAuthor(null);
      return undefined;
    }

    // ── URL parse ──────────────────────────────────────────────────────
    let isValidUrl = false;
    try { new URL(trimmed); isValidUrl = true; } catch { /* not a URL */ }

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

      const timer = setTimeout(() => {
        fetch(`/api/music/validate?videoId=${encodeURIComponent(videoId)}`, {
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((data: { embeddable?: boolean; reason?: string; title?: string | null; author?: string | null }) => {
            if (controller.signal.aborted) return;
            if (data.embeddable === true) {
              setStatus("valid");
              setTitle(data.title ?? null);
              setAuthor(data.author ?? null);
            } else if (data.reason === "not_embeddable") {
              setStatus("not-embeddable");
              setTitle(null); setAuthor(null);
            } else if (data.reason === "not_found") {
              setStatus("unavailable");
              setTitle(null); setAuthor(null);
            } else {
              // Network issue / unavailable — don't block save on transient errors
              setStatus("idle");
              setTitle(null); setAuthor(null);
            }
          })
          .catch((err: unknown) => {
            if (controller.signal.aborted) return;
            if ((err as Error)?.name === "AbortError") return;
            // Network error — be lenient, don't permanently block save
            setStatus("idle");
          });
      }, DEBOUNCE_MS);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    // ── Direct audio / non-YouTube URL ─────────────────────────────────
    setStatus("direct-audio");
    setTitle(null);
    setAuthor(null);
    return undefined;
  }, [url]);

  return {
    status,
    message: MESSAGES[status],
    isBlocking: BLOCKING[status],
    title,
    author,
  };
}
