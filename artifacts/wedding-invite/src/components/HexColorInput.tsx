import { useEffect, useState } from "react";
import { colorToHex, isHexColor } from "@/lib/color-format";

type HexColorInputProps = {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  helperText?: string;
  compact?: boolean;
  testId?: string;
};

export function HexColorInput({ value, onChange, label, helperText, compact = false, testId }: HexColorInputProps) {
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
    </div>
  );
}