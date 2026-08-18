/**
 * Safe HTML sanitizer for user-controlled content rendered via dangerouslySetInnerHTML.
 *
 * Allows basic formatting tags (br, b, strong, i, em, u, p, span) and safe attributes
 * (style, class). Strips scripts, event handlers, javascript: URLs, and all other
 * executable content.
 */
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["br", "b", "strong", "i", "em", "u", "span", "wbr", "font"];
const ALLOWED_ATTR = ["style", "class", "size"];

/** Maps <font size="N"> to the exact px labels shown in the editor Size dropdown. */
const FONT_SIZE_PX: Record<string, string> = {
  "1": "10px", "2": "13px", "3": "16px", "4": "18px",
  "5": "24px", "6": "32px", "7": "48px",
};

/**
 * Convert legacy <font size="N"> tags to <span style="font-size:Xpx"> before
 * DOMPurify runs. Inline style has the highest CSS priority and is never
 * overridden by Tailwind classes, unlike <font size> presentational hints
 * which have specificity 0 in the author stylesheet cascade.
 */
function convertFontSizeTags(html: string): string {
  return html
    .replace(/<font\b([^>]*)>/gi, (_, attrs: string) => {
      const m = attrs.match(/\bsize="(\d)"/i);
      const px = m ? (FONT_SIZE_PX[m[1]] ?? "16px") : null;
      return px ? `<span style="font-size:${px}">` : "<span>";
    })
    .replace(/<\/font>/gi, "</span>");
}

/**
 * react-simple-wysiwyg wraps each editor "line" in a <div> or <p>. Block
 * elements not in ALLOWED_TAGS would be stripped by DOMPurify and merge all
 * lines together; <p> in ALLOWED_TAGS renders with browser block margins that
 * create huge gaps inside an outer element. Normalize both: strip opening tags
 * and convert closing tags to <br> so line breaks are preserved without
 * block-level margin side-effects.
 */
function normalizeDivLineBreaks(html: string): string {
  return html
    .replace(/<(div|p)[^>]*>/gi, "")    // strip opening <div …> and <p …>
    .replace(/<\/(div|p)>/gi, "<br>");   // closing </div> and </p> → <br>
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(normalizeDivLineBreaks(convertFontSizeTags(html)), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
