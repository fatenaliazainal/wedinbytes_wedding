import React, { useState, useCallback } from "react";
import Editor, {
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnStrikeThrough,
  Separator,
  createDropdown,
  type ContentEditableEvent,
} from "react-simple-wysiwyg";

const ALLOWED_TAGS = [
  "b", "strong", "i", "em", "u", "s", "strike", "br", "p", "div", "span", "font",
];
const ALLOWED_ATTRS = ["style", "size", "face"];

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  function cleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode();
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.includes(tag)) {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) {
          const cleaned = cleanNode(el.firstChild);
          if (cleaned) fragment.appendChild(cleaned);
          el.removeChild(el.firstChild);
        }
        return fragment;
      }
      const newEl = document.createElement(tag);
      for (const attr of ALLOWED_ATTRS) {
        if (el.hasAttribute(attr)) {
          newEl.setAttribute(attr, el.getAttribute(attr) || "");
        }
      }
      while (el.firstChild) {
        const cleaned = cleanNode(el.firstChild);
        if (cleaned) newEl.appendChild(cleaned);
        el.removeChild(el.firstChild);
      }
      return newEl;
    }
    return null;
  }

  const fragment = document.createDocumentFragment();
  while (body.firstChild) {
    const cleaned = cleanNode(body.firstChild);
    if (cleaned) fragment.appendChild(cleaned);
    body.removeChild(body.firstChild);
  }
  const div = document.createElement("div");
  div.appendChild(fragment);
  return div.innerHTML;
}

const FONT_SIZE_ITEMS = [
  ["10px", "fontSize", "1"],
  ["13px", "fontSize", "2"],
  ["16px", "fontSize", "3"],
  ["18px", "fontSize", "4"],
  ["24px", "fontSize", "5"],
  ["32px", "fontSize", "6"],
  ["48px", "fontSize", "7"],
];

const FONT_FAMILY_ITEMS = [
  ["Poppins", "fontName", "Poppins"],
  ["Lato", "fontName", "Lato"],
  ["Dancing Script", "fontName", "Dancing Script"],
  ["Playfair Display", "fontName", "Playfair Display"],
  ["Great Vibes", "fontName", "Great Vibes"],
  ["Alex Brush", "fontName", "Alex Brush"],
  ["Allura", "fontName", "Allura"],
  ["Georgia", "fontName", "Georgia, serif"],
  ["Arial", "fontName", "Arial, sans-serif"],
];

const BtnSize = createDropdown("Size", FONT_SIZE_ITEMS as any);
const BtnFont = createDropdown("Font", FONT_FAMILY_ITEMS as any);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiLine?: boolean;
  showFontSize?: boolean;
  showFontFamily?: boolean;
  className?: string;
  inputStyle?: React.CSSProperties;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  multiLine = true,
  showFontSize = false,
  showFontFamily = false,
  className = "",
  inputStyle,
}: RichTextEditorProps) {
  const [html, setHtml] = useState(sanitizeHtml(value || ""));

  const handleChange = useCallback((e: ContentEditableEvent) => {
    const cleaned = sanitizeHtml(e.target.value);
    setHtml(cleaned);
    onChange(cleaned);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!multiLine && e.key === "Enter") {
      e.preventDefault();
      return;
    }

    if (multiLine && e.key === "Enter") {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const lineBreak = document.createElement("br");
      range.insertNode(lineBreak);
      range.setStartAfter(lineBreak);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      const cleaned = sanitizeHtml(e.currentTarget.innerHTML);
      setHtml(cleaned);
      onChange(cleaned);
    }
  };

  return (
    <div className={`border border-gray-200 rounded bg-white ${className}`}>
      <Editor
        value={html}
        onChange={handleChange}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        style={{
          ...inputStyle,
          color: "#111",
          minHeight: multiLine ? "5rem" : "2.5rem",
          whiteSpace: multiLine ? "pre-wrap" : "nowrap",
          overflow: multiLine ? "auto" : "hidden",
        }}
        containerProps={{ className: "rich-text-editor" }}
      >
        <Toolbar>
          <BtnBold />
          <BtnItalic />
          <BtnUnderline />
          <BtnStrikeThrough />
          {showFontSize && (
            <>
              <Separator />
              <BtnSize />
            </>
          )}
          {showFontFamily && (
            <>
              <Separator />
              <BtnFont />
            </>
          )}
        </Toolbar>
      </Editor>
    </div>
  );
}
