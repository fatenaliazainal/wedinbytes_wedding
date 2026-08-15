/**
 * /api/music/stream?videoId=XXXXXXXXXXX
 *
 * Proxies the highest-quality M4A (AAC) audio track from a YouTube video
 * through our same-origin server so that browsers — including iOS Safari —
 * can play it via a plain <audio> element with .play() inside a gesture handler.
 *
 * Why a proxy instead of a redirect?
 *   YouTube audio stream URLs are signed and CORS-restricted; the browser
 *   cannot fetch them cross-origin from a plain <audio src> tag.  Routing
 *   through our server makes the request same-origin, which works everywhere.
 *
 * Caching:
 *   ytdl.getInfo() is rate-limited by YouTube, so we cache the resolved
 *   audio URL in memory for 50 minutes (well within the ~6 h expiry window
 *   of signed YouTube URLs).  Cache is keyed by videoId.
 */

import { Router } from "express";
import ytdl from "@distube/ytdl-core";
import { Readable } from "stream";
import { logger as rootLogger } from "../lib/logger.js";

const router = Router();
const logger = rootLogger.child({ module: "music" });

// ── In-memory cache of resolved audio format URLs ───────────────────────────
interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength: string;
  cachedAt: number;
}
const formatCache = new Map<string, CachedFormat>();
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

async function resolveAudioFormat(videoId: string): Promise<CachedFormat> {
  const cached = formatCache.get(videoId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);

  // Prefer M4A / AAC container — supported by every browser including iOS Safari.
  // WebM/Opus is NOT supported on iOS Safari so we must exclude it.
  const format = ytdl.chooseFormat(info.formats, {
    quality: "highestaudio",
    filter: (f) =>
      (f.container === "mp4" || (f.mimeType ?? "").includes("audio/mp4")) &&
      f.hasAudio === true &&
      f.hasVideo === false,
  });

  if (!format?.url) {
    throw new Error(`No M4A audio format found for videoId ${videoId}`);
  }

  const entry: CachedFormat = {
    url: format.url,
    mimeType: format.mimeType ?? "audio/mp4",
    contentLength: format.contentLength ?? "",
    cachedAt: Date.now(),
  };
  formatCache.set(videoId, entry);
  return entry;
}

// ── GET /api/music/stream?videoId=XXXXXXXXXXX ────────────────────────────────
router.get("/music/stream", async (req, res) => {
  const videoId = req.query.videoId as string | undefined;

  if (!videoId || !VIDEO_ID_RE.test(videoId)) {
    res.status(400).json({ error: "Missing or invalid videoId" });
    return;
  }

  try {
    const { url, mimeType, contentLength } = await resolveAudioFormat(videoId);

    // Forward Range header from the browser so iOS Safari partial-content
    // (range) requests are satisfied.  Without this, Safari may stall.
    const rangeHeader = req.headers.range as string | undefined;
    const fetchHeaders: Record<string, string> = {
      // A realistic UA prevents some YouTube anti-bot rejections.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    };
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    const ytResponse = await fetch(url, { headers: fetchHeaders });

    // Propagate status (200 or 206 Partial Content) and key headers.
    res.status(ytResponse.status);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-cache");

    const forward = ["content-length", "content-range"];
    forward.forEach((h) => {
      const v = ytResponse.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    // Fall back to the format's stated content-length when the response
    // doesn't include one (happens on non-range full responses from YouTube).
    if (!ytResponse.headers.get("content-length") && contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (!ytResponse.body) {
      res.status(500).json({ error: "Empty body from YouTube" });
      return;
    }

    // Stream the audio body to the client.
    const reader = ytResponse.body.getReader();
    const readable = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.from(value));
          }
        } catch {
          this.destroy();
        }
      },
    });

    // Abort the upstream fetch when the client disconnects.
    req.on("close", () => readable.destroy());
    readable.pipe(res);
  } catch (err) {
    logger.error({ err }, "Music stream failed");
    // Invalidate the cache entry so the next request re-fetches info.
    formatCache.delete(videoId);
    if (!res.headersSent) {
      res.status(502).json({ error: "Failed to stream audio from YouTube" });
    }
  }
});

export default router;
