import { useState, useEffect } from "react";
import { extractYouTubeId } from "@/lib/youtube";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MusicValidationStatus =
  | "idle"           // URL is empty — music is optional, save allowed
  | "checking"       // Waiting for YouTube embeddability check
  | "valid"          // YouTube URL confirmed embeddable
  | "not-embeddable" // YouTube URL but embedding disabled on this video
  | "unavailable"    // YouTube URL but video not found / private
  | "invalid-url"    // Unparseable string OR YouTube host with no valid video ID
  | "direct-audio";  // Valid non-YouTube URL — treat as direct audio, no validation

export interface MusicValidation {
  status: MusicValidationStatus;
  /** User-facing message (empty string when nothing should be shown). */
  message: string;
  /** True = save button must be disabled until status resolves. */
  isBlocking: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESSAGES: Record<MusicValidationStatus, string> = {
  idle:            "",
  checking:        "Checking this video…",
  valid:           "✓ This video is ready to use.",
  "not-embeddable":"⚠️ This YouTube video can't be played on the invitation website. Please choose another video.",
  unavailable:     "⚠️ This YouTube video is unavailable. Please choose another video.",
  "invalid-url":   "⚠️ Please enter a valid YouTube or audio link.",
  "direct-audio":  "",
};

const BLOCKING: Record<MusicValidationStatus, boolean> = {
  idle:            false,
  checking:        true,
  valid:           false,
  "not-embeddable":true,
  unavailable:     true,
  "invalid-url":   true,
  "direct-audio":  false,
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
 * Validates a music URL and returns the current validation state.
 *
 * Classification:
 *   - empty              → idle      (no message, save allowed)
 *   - non-URL text       → invalid-url (blocked)
 *   - YouTube URL + ID   → async check via /api/music/validate (blocking while checking)
 *   - YouTube URL, no ID → invalid-url (blocked)
 *   - other valid URL    → direct-audio (allowed, existing MP3 behaviour)
 */
export function useMusicUrlValidation(url: string): MusicValidation {
  const [status, setStatus] = useState<MusicValidationStatus>("idle");

  useEffect(() => {
    const trimmed = url.trim();

    // ── Empty ─────────────────────────────────────────────────────────────
    if (!trimmed) {
      setStatus("idle");
      return;
    }

    // ── URL parse check ───────────────────────────────────────────────────
    let isValidUrl = false;
    try {
      new URL(trimmed);
      isValidUrl = true;
    } catch {
      /* falls through */
    }

    if (!isValidUrl) {
      setStatus("invalid-url");
      return;
    }

    // ── YouTube URL ────────────────────────────────────────────────────────
    if (isYouTubeUrl(trimmed)) {
      const videoId = extractYouTubeId(trimmed);
      if (!videoId) {
        // YouTube hostname but no recognisable video ID.
        setStatus("invalid-url");
        return;
      }

      setStatus("checking");
      const controller = new AbortController();

      const timer = setTimeout(() => {
        fetch(`/api/music/validate?videoId=${encodeURIComponent(videoId)}`, {
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((data: { embeddable: boolean; reason?: string }) => {
            if (data.embeddable) {
              setStatus("valid");
            } else if (data.reason === "not_embeddable") {
              setStatus("not-embeddable");
            } else if (data.reason === "not_found") {
              setStatus("unavailable");
            } else {
              // Timeout / network error from the server — don't permanently
              // block the editor, just clear to idle so save is unblocked.
              setStatus("idle");
            }
          })
          .catch(() => {
            // Cancelled (URL changed mid-flight) or network failure.
            // Do not block save for transient network issues.
            setStatus("idle");
          });
      }, DEBOUNCE_MS);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    // ── Direct audio / non-YouTube URL ────────────────────────────────────
    setStatus("direct-audio");
    return undefined;
  }, [url]);

  return {
    status,
    message: MESSAGES[status],
    isBlocking: BLOCKING[status],
  };
}
