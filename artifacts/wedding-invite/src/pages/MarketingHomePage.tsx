import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Heart, User } from "lucide-react";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { CardThumbnail } from "@/components/CardThumbnail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import type { SiteNavItem } from "@/components/SiteHeader";

import hero1 from "@assets/Screenshot_2026-05-10-16-48-46-99_40deb401b9ffe8e1df2f1cc5ba48_1778402959136.jpg";
import hero2 from "@assets/Screenshot_2026-05-10-16-48-53-68_40deb401b9ffe8e1df2f1cc5ba48_1778402959164.jpg";
import hero3 from "@assets/Screenshot_2026-05-10-16-52-42-93_40deb401b9ffe8e1df2f1cc5ba48_1778403190193.jpg";
import hero4 from "@assets/Screenshot_2026-05-10-16-55-23-24_40deb401b9ffe8e1df2f1cc5ba48_1778403366199.jpg";

const SLIDES = [
  {
    img: hero1,
    eyebrow: "Malaysia's #1 Digital Invitation Platform",
    heading: "Beautiful Digital\nWedding Cards",
    sub: "Customise, share & track RSVPs in real-time.",
    cta: "Explore Collection",
    ctaLink: "/weddingcards/home",
  },
  {
    img: hero2,
    eyebrow: "Over 24 Exclusive Designs",
    heading: "Beautiful Designs\nFor Your Big Day",
    sub: "Choose the perfect design and personalise it with ease.",
    cta: "View All Designs",
    ctaLink: "/weddingcards/home",
  },
  {
    img: hero3,
    eyebrow: "Share in Seconds",
    heading: "Send Invitations\nVia WhatsApp",
    sub: "Your unique link can be shared directly with guests.",
    cta: "Try Demo",
    ctaLink: "/invite/demo",
  },
  {
    img: hero4,
    eyebrow: "Real-Time RSVP",
    heading: "Track Guest\nAttendance",
    sub: "An easy-to-understand RSVP dashboard, updated automatically.",
    cta: "Get Started",
    ctaLink: "/register",
  },
];

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/home" },
  { label: "INFO", href: "/home" },
  { label: "FAQs", href: "/home" },
];

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto bg-gray-900 shadow-xl"
      style={{
        width: 90,
        height: 182,
        borderRadius: 18,
        border: "4px solid #1f2937",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-gray-900"
        style={{ width: 26, height: 10, borderRadius: "0 0 8px 8px" }}
      />
      <div
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-white/30 rounded-full"
        style={{ width: 26, height: 3 }}
      />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

export default function MarketingHomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const dragStartX = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: designs = [], isLoading } = useListDesigns();
  const { data: demoInvitation } = useGetInvitation("demo");

  const previewCards = designs.slice(0, 8);

  const goNext = useCallback(() => setSlide((s) => (s + 1) % SLIDES.length), []);
  const goPrev = useCallback(() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    autoRef.current = setInterval(goNext, 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [goNext]);

  const resetAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(goNext, 5000);
  };

  const handlePrev = () => { goPrev(); resetAuto(); };
  const handleNext = () => { goNext(); resetAuto(); };

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };

  const onDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const endX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const delta = dragStartX.current - endX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) handleNext();
      else handlePrev();
    }
  };

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <SiteHeader
        navItems={NAV_ITEMS}
        activeLabel="HOME"
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User size={18} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors tracking-widest"
              >
                LOG IN
              </button>
              <button
                onClick={() => navigate("/register")}
                className="hidden sm:inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded hover:bg-gray-700 transition-colors tracking-widest"
              >
                <Heart size={12} />
                SIGN UP
              </button>
            </>
          )
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={
          user ? (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate("/dashboard"); setNavOpen(false); }}
                className="w-full rounded bg-gray-900 text-white text-sm font-bold py-2.5 tracking-widest"
              >
                GO TO DASHBOARD
              </button>
            </div>
          ) : (
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                onClick={() => { navigate("/register"); setNavOpen(false); }}
                className="w-full rounded bg-gray-900 text-white text-sm font-bold py-2.5 tracking-widest"
              >
                SIGN UP FREE
              </button>
              <button
                onClick={() => { navigate("/login"); setNavOpen(false); }}
                className="w-full rounded border border-gray-200 text-sm font-bold py-2.5 tracking-widest text-gray-600"
              >
                LOG IN
              </button>
            </div>
          )
        }
      />

      <div
        className="relative w-full overflow-hidden select-none"
        style={{ height: "clamp(260px, 52vw, 520px)" }}
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
        onTouchStart={onDragStart}
        onTouchEnd={onDragEnd}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0"
            draggable={false}
          >
            <img src={current.img} alt={current.heading} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-5xl mx-auto w-full px-6 sm:px-10">
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/75 text-xs font-semibold tracking-widest uppercase mb-2">
                  {current.eyebrow}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="text-white text-3xl sm:text-5xl font-bold leading-tight whitespace-pre-line mb-3 drop-shadow">
                  {current.heading}
                </motion.h2>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="text-white/85 text-sm sm:text-base max-w-sm mb-5">
                  {current.sub}
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                  onClick={() => navigate(current.ctaLink)}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-xs tracking-widest px-5 py-3 rounded hover:bg-gray-100 transition-colors shadow-lg"
                >
                  {current.cta}
                  <ChevronRight size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors" aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors" aria-label="Next">
          <ChevronRight size={18} />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlide(i); resetAuto(); }}
              className={`rounded-full transition-all duration-300 ${i === slide ? "bg-white w-5 h-2" : "bg-white/50 w-2 h-2"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Exclusive Collection</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Featured Digital Cards</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Every card is designed for your event. Choose, personalise and share in minutes.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {previewCards.map((design) => (
                <div key={design.id} className="flex flex-col items-center gap-3">
                  <IPhoneFrame>
                    {demoInvitation ? (
                      <CardThumbnail invitation={demoInvitation} design={design} containerWidth={82} />
                    ) : (
                      <div className="w-full h-full" style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }} />
                    )}
                  </IPhoneFrame>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{design.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono tracking-wider">#{String(design.id).padStart(4, "0")}</p>
                  </div>

                  <button
                    onClick={() => navigate(`/weddingcards/home/${design.id}`)}
                    className="flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-bold tracking-widest px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                  >
                    <ShoppingBag size={10} />
                    GET IT NOW
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button onClick={() => navigate("/weddingcards/home")} className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-xs font-bold tracking-widest px-8 py-3 rounded hover:bg-gray-50 transition-colors">
              VIEW ALL CARDS
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <SiteFooter />

      <div className="bg-gray-900 text-white/60 text-xs text-center py-4 tracking-wide">
        © {new Date().getFullYear()} WedInBytes · All rights reserved
      </div>
    </div>
  );
}
