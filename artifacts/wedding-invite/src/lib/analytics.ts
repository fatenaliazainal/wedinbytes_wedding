const GA_MEASUREMENT_ID = "G-ZWK5MC9DM4";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: Gtag;
  }
}

let initialized = false;

export function initGoogleAnalytics() {
  if (typeof window === "undefined" || initialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer.push(args);
    });

  if (!document.querySelector(`script[data-ga4="${GA_MEASUREMENT_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.dataset.ga4 = GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
  initialized = true;
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  initGoogleAnalytics();
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}