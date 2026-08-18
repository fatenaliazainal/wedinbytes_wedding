/**
 * Safe HTML sanitizer for user-controlled content rendered via dangerouslySetInnerHTML.
 *
 * Allows basic formatting tags (br, b, strong, i, em, u, p, span) and safe attributes
 * (style, class). Strips scripts, event handlers, javascript: URLs, and all other
 * executable content.
 */
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["br", "b", "strong", "i", "em", "u", "p", "span", "wbr", "font"];
const ALLOWED_ATTR = ["style", "class", "size"];

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
