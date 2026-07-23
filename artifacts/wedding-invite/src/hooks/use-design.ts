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
  colorBackground?: string | null;
  colorCard?: string | null;
  nameFontFamily?: string | null;
};

function applyOverrides(overrides: DesignOverrides) {
  const root = document.documentElement;
  if (overrides.colorPrimary) root.style.setProperty("--primary", overrides.colorPrimary);
  if (overrides.colorSecondary) root.style.setProperty("--secondary", overrides.colorSecondary);
  if (overrides.colorBackground) root.style.setProperty("--background", overrides.colorBackground);
  if (overrides.colorCard) {
    root.style.setProperty("--card", overrides.colorCard);
    root.style.setProperty("--popover", overrides.colorCard);
  }
}

export function useDesign(overrides?: DesignOverrides) {
  const { data: design, isLoading } = useGetActiveDesign();

  useEffect(() => {
    if (design) {
      applyDesignTokens(design);
      // Apply per-invitation overrides on top of global design
      if (overrides) applyOverrides(overrides);
    }
  }, [design, overrides]);

  return { design, isLoading };
}
