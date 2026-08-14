import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import logo from "@assets/logo-wedinstudio.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type QuickLink  = { label: string; url: string };
type SocialLink = { platform: string; icon: string; url: string; enabled: boolean };

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { label: "About Us",           url: "/about"   },
  { label: "Contact Us",         url: "/contact" },
  { label: "FAQ",                url: "/faq"     },
  { label: "Terms & Conditions", url: "/terms"   },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "Instagram", icon: "/icons/instagram2.png", url: "", enabled: true },
  { platform: "Threads",   icon: "/icons/threads2.png",   url: "", enabled: true },
  { platform: "TikTok",    icon: "/icons/tiktok2.png",    url: "", enabled: true },
  { platform: "WhatsApp",  icon: "/icons/whatsapp2.png",  url: "", enabled: true },
  { platform: "Website",   icon: "/icons/globe2.png",     url: "", enabled: true },
  { platform: "Email",     icon: "/icons/email2.png",     url: "", enabled: true },
];

let cachedSettings: { quickLinks: QuickLink[]; socialLinks: SocialLink[] } | null = null;

export default function SiteFooter() {
  const [, navigate] = useLocation();
  const [quickLinks,  setQuickLinks]  = useState<QuickLink[]>(DEFAULT_QUICK_LINKS);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    if (cachedSettings) {
      setQuickLinks(cachedSettings.quickLinks);
      setSocialLinks(cachedSettings.socialLinks);
      return;
    }
    fetch(`${BASE}/api/site-settings`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { quickLinks: QuickLink[]; socialLinks: SocialLink[] } | null) => {
        if (!data) return;
        cachedSettings = { quickLinks: data.quickLinks, socialLinks: data.socialLinks };
        setQuickLinks(data.quickLinks?.length  ? data.quickLinks  : DEFAULT_QUICK_LINKS);
        setSocialLinks(data.socialLinks?.length ? data.socialLinks : DEFAULT_SOCIAL_LINKS);
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  function handleLink(url: string) {
    if (!url) return;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      navigate(url);
    }
  }

  const visibleSocial = socialLinks.filter(s => s.enabled);

  return (
    <footer className="mt-auto border-t border-black/10 bg-[#f2f2f0] px-4 py-8 sm:px-6 sm:py-9">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wedinstudio logo" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-base font-semibold tracking-tight text-black">Wedinstudio</p>
              <p className="text-xs sm:text-sm text-black/55">Digital invitation cards for your event.</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-black/60">
            Create, customise and share digital wedding cards with premium designs and effortless RSVP management.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-black/45">QUICK LINKS</p>
            <div className="mt-3 flex flex-col gap-2.5 text-sm text-black/70">
              {quickLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => handleLink(link.url)}
                  className="text-left hover:text-black transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {visibleSocial.length > 0 && (
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-black/45">FOLLOW US</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {visibleSocial.map((s) => (
                  <button
                    key={s.platform}
                    type="button"
                    onClick={() => s.url ? handleLink(s.url) : undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white hover:shadow-sm transition-all"
                    aria-label={s.platform}
                    title={s.platform}
                  >
                    <img src={s.icon} alt={s.platform} className="h-[18px] w-[18px] rounded-sm object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
