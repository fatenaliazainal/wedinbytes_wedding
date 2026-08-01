import { useEffect } from "react";
import { useGetActiveDesign } from "@workspace/api-client-react";
import type { CardDesign } from "@workspace/api-client-react";

function injectGoogleFont(families: string[]) {
  const id = "dynamic-google-fonts";
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const query = families.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;600;700`).join("&");
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  document.head.appendChild(link);
}

function applyDesignTokens(design: CardDesign) {
  const root = document.documentElement;
  if (design.colorPrimary) root.style.setProperty("--primary", design.colorPrimary);
  if (design.colorSecondary) root.style.setProperty("--secondary", design.colorSecondary);
  if (design.colorAccent) root.style.setProperty("--accent", design.colorAccent);
  if (design.colorBackground) root.style.setProperty("--background", design.colorBackground);
  if (design.colorCard) {
    root.style.setProperty("--card", design.colorCard);
    root.style.setProperty("--popover", design.colorCard);
  }
  if (design.colorForeground) root.style.setProperty("--foreground", design.colorForeground);

  const fonts: string[] = [];
  if (design.fontHeading) fonts.push(design.fontHeading);
  if (design.fontBody) fonts.push(design.fontBody);
  if (fonts.length) {
    injectGoogleFont(fonts);
    if (design.fontHeading)
      root.style.setProperty("--font-heading", `"${design.fontHeading}", serif`);
    if (design.fontBody)
      root.style.setProperty("--font-body", `"${design.fontBody}", serif`);
  }
}

export type DesignOverrides = {
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  colorAccent?: string | null;
  colorBackground?: string | null;
  colorCard?: string | null;
  colorForeground?: string | null;
  nameColor?: string | null;
  nameFontFamily?: string | null;
  bodyFontFamily?: string | null;
  nameFontSize?: string | null;
  badgeFontSize?: string | null;
};

function applyOverrides(overrides: DesignOverrides) {
  const root = document.documentElement;
  if (overrides.colorPrimary) root.style.setProperty("--primary", overrides.colorPrimary);
  if (overrides.colorSecondary) root.style.setProperty("--secondary", overrides.colorSecondary);
  if (overrides.colorAccent) root.style.setProperty("--accent", overrides.colorAccent);
  if (overrides.colorBackground) root.style.setProperty("--background", overrides.colorBackground);
  if (overrides.colorCard) {
    root.style.setProperty("--card", overrides.colorCard);
    root.style.setProperty("--popover", overrides.colorCard);
  }
  if (overrides.colorForeground) root.style.setProperty("--foreground", overrides.colorForeground);
  if (overrides.nameColor) root.style.setProperty("--name-color", overrides.nameColor);
  if (overrides.nameFontFamily) {
    root.style.setProperty("--name-font-family", `"${overrides.nameFontFamily}", cursive`);
  }
  if (overrides.bodyFontFamily) {
    root.style.setProperty("--body-font-family", `"${overrides.bodyFontFamily}", sans-serif`);
  }
  if (overrides.nameFontSize) root.style.setProperty("--name-font-size", `${overrides.nameFontSize}px`);
  if (overrides.badgeFontSize) {
    root.style.setProperty("--badge-font-size", `${overrides.badgeFontSize}px`);
    root.style.setProperty("--section-title-font-size", `${overrides.badgeFontSize}px`);
  }
}

export function useDesign(overrides?: DesignOverrides) {
  const { data: design, isLoading } = useGetActiveDesign();

  useEffect(() => {
    if (design) {
      applyDesignTokens(design);
      const overrideFonts = [
        overrides?.nameFontFamily,
        overrides?.bodyFontFamily,
      ].filter((font): font is string => Boolean(font));
      if (overrideFonts.length) injectGoogleFont(overrideFonts);
      // Apply per-invitation overrides on top of global design
      if (overrides) applyOverrides(overrides);
    }
  }, [design, overrides]);

  return { design, isLoading };
}
