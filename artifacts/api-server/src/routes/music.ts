import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /api/music/validate?videoId=XXX
 *
 * Checks whether a YouTube video ID is embeddable by querying YouTube's
 * public oEmbed endpoint.  The result is used by all three editors
 * (Admin, Buyer, Business) before allowing a musicUrl to be saved.
 *
 * Response shape:
 *   { embeddable: true }
 *   { embeddable: false, reason: "not_embeddable" }   // error 101 / 150
 *   { embeddable: false, reason: "not_found" }        // error 100 / 404
 *   { embeddable: false, reason: "unavailable" }      // timeout / other
 */
router.get("/music/validate", async (req, res) => {
  const { videoId } = req.query;

  if (typeof videoId !== "string" || !videoId.trim()) {
    res.status(400).json({ error: "videoId query parameter is required." });
    return;
  }

  const oembedUrl =
    `https://www.youtube.com/oembed` +
    `?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId.trim()}`)}` +
    `&format=json`;

  try {
    const upstream = await fetch(oembedUrl, {
      // 5-second hard timeout so slow YouTube responses don't stall the editor.
      signal: AbortSignal.timeout(5000),
    });

    if (upstream.ok) {
      res.json({ embeddable: true });
      return;
    }

    if (upstream.status === 401 || upstream.status === 403) {
      // YouTube returns 401 for embedding-disabled videos (error 101 / 150).
      res.json({ embeddable: false, reason: "not_embeddable" });
      return;
    }

    if (upstream.status === 404) {
      // Video does not exist or is private.
      res.json({ embeddable: false, reason: "not_found" });
      return;
    }

    res.json({ embeddable: false, reason: "unavailable" });
  } catch {
    // Network error, timeout, or DNS failure — be lenient so a slow YouTube
    // response does not permanently block editors.
    res.json({ embeddable: false, reason: "unavailable" });
  }
});

export default router;
