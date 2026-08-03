import { useEffect, useState } from "react";
import { colorToHex, isHexColor } from "@/lib/color-format";

export type PreviewKind =
  | { type: "text";     sample: string; font?: "script" | "heading" | "muted" | "sans" }
  | { type: "button";   sample: string }
  | { type: "surface";  sample: string }
  | { type: "ornament"; sample: string };

type HexColorInputProps = {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  helperText?: string;
  preview?: PreviewKind;
  compact?: boolean;
  testId?: string;
};

export function HexColorInput({ value, onChange, label, helperText, preview, compact = false, testId }: HexColorInputProps) {
  const safeValue = value ?? "";
  const [draft, setDraft] = useState(() => colorToHex(safeValue));
  const hexValue = colorToHex(safeValue);

  useEffect(() => {
    setDraft(hexValue);
  }, [hexValue]);

  function commit(nextValue: string) {
    const nextHex = nextValue.trim().toLowerCase();
    setDraft(nextHex);
    if (isHexColor(nextHex)) onChange(nextHex);
  }

  function renderPreview() {
    if (!preview) return null;

    if (preview.type === "text") {
      const isScript  = preview.font === "script";
      const isHeading = preview.font === "heading";
      const isMuted   = preview.font === "muted";
      return (
        <span
          style={{ color: hexValue }}
          className={[
            isScript  ? "font-semibold italic text-[11px]" : "",
            isHeading ? "font-semibold tracking-widest uppercase text-[9px]" : "",
            isMuted   ? "text-[9px] opacity-80" : "",
            !isScript && !isHeading && !isMuted ? "text-[11px] font-medium" : "",
          ].join(" ")}
        >
          {preview.sample}
        </span>
      );
    }

    if (preview.type === "button") {
      return (
        <span
          style={{ backgroundColor: hexValue }}
          className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap"
        >
          {preview.sample}
        </span>
      );
    }

    if (preview.type === "ornament") {
      return (
        <span style={{ color: hexValue }} className="text-[11px] tracking-widest">
          {preview.sample}
        </span>
      );
    }

    if (preview.type === "surface") {
      return (
        <span
          style={{ backgroundColor: hexValue }}
          className="h-6 w-10 rounded-md border border-border/60 block"
          title={preview.sample}
        />
      );
    }

    return null;
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <label
        className={`${compact ? "h-10 w-10" : "h-8 w-8"} relative shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow-md`}
        style={{ backgroundColor: hexValue }}
        title={hexValue}
      >
        <input
          type="color"
          value={hexValue}
          onChange={(event) => commit(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label ?? "Choose colour"}
          data-testid={testId ? `${testId}-picker` : undefined}
        />
      </label>

      <div className="min-w-0 flex-1">
        {label && <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">{label}</p>}
        {helperText && <p className="mb-0.5 text-[10px] text-muted-foreground/70 italic">{helperText}</p>}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(event.currentTarget.value);
            }
          }}
          placeholder="#6C5F41"
          maxLength={7}
          spellCheck={false}
          className={`${compact ? "w-24" : "w-full"} rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs uppercase outline-none focus:ring-1 focus:ring-primary/30`}
          aria-label={`${label ?? "Colour"} HEX value`}
          data-testid={testId ? `${testId}-hex` : undefined}
        />
      </div>

      {/* Live mini-preview */}
      {preview && (
        <div className="shrink-0 flex flex-col items-center justify-center gap-0.5 min-w-[52px]">
          {renderPreview()}
          <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap">{preview.sample}</span>
        </div>
      )}
    </div>
  );
}
