import React from "react";
import { useLocation } from "wouter";
import logo from "@assets/logo-wedinstudio.png";

const SOCIAL_ICONS = [
  { src: "/icons/instagram2.png", label: "Instagram" },
  { src: "/icons/threads2.png",   label: "Threads"   },
  { src: "/icons/tiktok2.png",    label: "TikTok"    },
  { src: "/icons/whatsapp2.png",  label: "WhatsApp"  },
  { src: "/icons/globe2.png",     label: "Website"   },
  { src: "/icons/email2.png",     label: "Email"     },
];

export default function SiteFooter() {
  const [, navigate] = useLocation();

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
              <button onClick={() => navigate("/about")} className="text-left hover:text-black transition-colors">About Us</button>
              <button onClick={() => navigate("/contact")} className="text-left hover:text-black transition-colors">Contact Us</button>
              <button onClick={() => navigate("/faq")} className="text-left hover:text-black transition-colors">FAQ</button>
              <button onClick={() => navigate("/terms")} className="text-left hover:text-black transition-colors">Terms & Conditions</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-black/45">FOLLOW US</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {SOCIAL_ICONS.map(({ src, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white hover:shadow-sm transition-all"
                  aria-label={label}
                >
                  <img src={src} alt={label} className="h-[18px] w-[18px] rounded-sm object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
