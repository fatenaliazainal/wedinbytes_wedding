const GOOGLE_DRIVE_TUTORIAL_URL =
  "https://drive.google.com/file/d/1BemKyypT9VduGeafDBOaRgAUNSuvnbWs/view?usp=sharing";

export function getHowToUsePdfUrls() {
  try {
    const url = new URL(GOOGLE_DRIVE_TUTORIAL_URL);
    if (url.hostname !== "drive.google.com" && url.hostname !== "docs.google.com") {
      return null;
    }

    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
    if (!fileId) return null;

    const encodedId = encodeURIComponent(fileId);
    return {
      previewUrl: `https://drive.google.com/file/d/${encodedId}/preview`,
      openUrl: `https://drive.google.com/file/d/${encodedId}/view`,
    };
  } catch {
    return null;
  }
}