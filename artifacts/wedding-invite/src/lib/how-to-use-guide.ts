// The tutorial PDF is pre-rendered to one JPEG per page so the guide displays
// inline without an <iframe>. PDF iframes are unreliable: iOS Safari shows only
// the first page (or nothing), and strict CSP frame-src rules can block them.
// Plain <img> tags have neither problem. The original PDF stays available for
// "Open PDF" / download. Version the folder (v1 → v2) when the guide changes.
export const HOW_TO_USE_PDF_PATH = "/wedinstudio-tutorial-v1.pdf";
export const HOW_TO_USE_PAGE_COUNT = 24;

export function howToUsePageImagePath(page: number): string {
  return `/how-to-use/v1/page-${String(page).padStart(2, "0")}.jpg`;
}