const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value.trim());
}

export function hslToHex(hslStr: string): string {
  if (isHexColor(hslStr)) return hslStr.trim().toLowerCase();

  const parts = (hslStr || "0 0% 0%").trim().split(/\s+/);
  const h = (parseFloat(parts[0]) || 0) / 360;
  const s = (parseFloat((parts[1] || "0").replace("%", "")) || 0) / 100;
  const l = (parseFloat((parts[2] || "0").replace("%", "")) || 0) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (point: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return point + (q - point) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return point + (q - point) * (2 / 3 - t) * 6;
      return point;
    };
    r = hue2rgb(p, h + 1 / 3);
    g = hue2rgb(p, h);
    b = hue2rgb(p, h - 1 / 3);
  }

  return `#${[r, g, b].map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;
}

export function hexToHsl(hex: string): string {
  const normalized = hex.trim().toLowerCase();
  if (!isHexColor(normalized)) return "";

  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const saturation = max === min
    ? 0
    : lightness > 0.5
      ? (max - min) / (2 - max - min)
      : (max - min) / (max + min);
  let hue = 0;

  if (max !== min) {
    if (max === r) hue = ((g - b) / (max - min) + 6) % 6;
    else if (max === g) hue = (b - r) / (max - min) + 2;
    else hue = (r - g) / (max - min) + 4;
    hue *= 60;
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function colorToHex(value: string, fallback = "#aaaaaa"): string {
  return isHexColor(value) ? value.trim().toLowerCase() : hslToHex(value || fallback);
}