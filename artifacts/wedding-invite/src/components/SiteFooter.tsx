import React from "react";
import { useLocation } from "wouter";
import { Heart, Facebook, Instagram, Twitter, Youtube, Mail } from "lucide-react";

export default function SiteFooter() {
  const [, navigate] = useLocation();

  return (
    <footer className="mt-auto border-t border-black/10 bg-[#f2f2f0] px-4 py-8 sm:px-6 sm:py-9">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f25c4c] text-white">
              <Heart size={18} fill="currentColor" />
            </div>
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
              <button onClick={() => navigate("/home")} className="text-left hover:text-black transition-colors">About Us</button>
              <button onClick={() => navigate("/home")} className="text-left hover:text-black transition-colors">Contact Us</button>
              <button onClick={() => navigate("/home")} className="text-left hover:text-black transition-colors">FAQ</button>
              <button onClick={() => navigate("/home")} className="text-left hover:text-black transition-colors">Terms & Conditions</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-black/45">FOLLOW US</p>
            <div className="mt-3 flex items-center gap-2.5">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Twitter, label: "Twitter" },
                { icon: Youtube, label: "Youtube" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black/70 hover:text-black hover:shadow-sm transition-colors"
                  aria-label={label}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
