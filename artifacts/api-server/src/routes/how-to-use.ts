import { Router } from "express";

const router = Router();

const GOOGLE_DRIVE_FILE_ID = "1BemKyypT9VduGeafDBOaRgAUNSuvnbWs";
const GOOGLE_DRIVE_DOWNLOAD_URL =
  `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FILE_ID}`;
const CACHE_DURATION_MS = 10 * 60 * 1000;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

let cachedPdf: { body: Buffer; expiresAt: number } | null = null;

async function getTutorialPdf(): Promise<Buffer> {
  if (cachedPdf && cachedPdf.expiresAt > Date.now()) {
    return cachedPdf.body;
  }

  const upstream = await fetch(GOOGLE_DRIVE_DOWNLOAD_URL, {
    redirect: "follow",
    headers: { "User-Agent": "Wedinstudio Tutorial PDF Viewer" },
  });

  if (!upstream.ok) {
    throw new Error(`Google Drive returned HTTP ${upstream.status}`);
  }

  const declaredLength = Number(upstream.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PDF_BYTES) {
    throw new Error("Tutorial PDF exceeds the 10 MB limit");
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_PDF_BYTES) {
    throw new Error("Tutorial PDF has an unsupported size");
  }

  cachedPdf = { body, expiresAt: Date.now() + CACHE_DURATION_MS };
  return body;
}

router.get("/how-to-use-pdf", async (_req, res) => {
  try {
    const pdf = await getTutorialPdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="wedinstudio-how-to-use.pdf"');
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(pdf);
  } catch (error) {
    console.error("Failed to load How To Use PDF", error);
    res.status(502).json({ error: "The tutorial PDF is temporarily unavailable." });
  }
});

export default router;