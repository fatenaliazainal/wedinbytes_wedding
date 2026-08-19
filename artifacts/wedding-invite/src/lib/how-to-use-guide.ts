// The tutorial PDF is pre-rendered to one image per page so the guide displays
// inline without an <iframe>. PDF iframes are unreliable: iOS Safari shows only
// the first page (or nothing), and strict CSP frame-src rules can block them.
// Modern browsers get AVIF/WebP; JPEG remains the fallback for older browsers.
// The original PDF stays available for "Open PDF" / download.
export const HOW_TO_USE_PDF_PATH = "/wedinstudio-tutorial-v1.pdf";
export const HOW_TO_USE_PAGE_COUNT = 24;

export function howToUsePagePaths(page: number): { avif: string; webp: string; jpeg: string } {
  const n = String(page).padStart(2, "0");
  return {
    avif: `/how-to-use/v2/page-${n}.avif`,
    webp: `/how-to-use/v2/page-${n}.webp`,
    jpeg: `/how-to-use/v1/page-${n}.jpg`,
  };
}