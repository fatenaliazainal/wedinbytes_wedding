import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

const SITE_NAME = "Wedinstudio";
const DEFAULT_DESCRIPTION =
  "Cipta kad jemputan kahwin digital yang cantik dalam minit. Koleksi reka bentuk eksklusif, RSVP masa nyata, dan pautan unik untuk tetamu anda.";
const DEFAULT_OG_IMAGE = "https://wedinstudio.com/og-image.png";

/**
 * Sets document title and meta tags for SEO on each page.
 * Call at the top of every public-facing page component.
 */
export function usePageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
}: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;

    setMeta("description", description);
    setMetaProperty("og:title", fullTitle);
    setMetaProperty("og:description", description);
    setMetaProperty("og:image", ogImage);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      // Restore base title on unmount so stale titles don't linger
      document.title = `Kad Jemputan Kahwin Digital | ${SITE_NAME} — E-Invitation Online Malaysia`;
    };
  }, [title, description, canonical, ogImage]);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}
