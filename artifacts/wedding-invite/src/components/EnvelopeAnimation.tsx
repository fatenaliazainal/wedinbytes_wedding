import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DesignImage } from "@/components/DesignImage";
import defaultEnvelopeRef from "@assets/Screenshot_2026-05-03-00-19-07-34_40deb401b9ffe8e1df2f1cc5ba48_1777739356642.jpg";

interface EnvelopeAnimationProps {
  isOpened: boolean;
  onOpen: () => void;
  names?: string;
  initialsSize?: string;
  initialsImageUrl?: string;
  initialsImageScale?: number;
  envelopeImageUrl?: string;
  openButtonText?: string;
}

export function EnvelopeAnimation({
  isOpened,
  onOpen,
  names = "",
  initialsSize,
  initialsImageUrl,
  initialsImageScale = 100,
  envelopeImageUrl,
  openButtonText = "BUKA",
}: EnvelopeAnimationProps) {
  const [phase, setPhase] = useState<"idle" | "flap" | "done">("idle");
  const bgImage = envelopeImageUrl || defaultEnvelopeRef;

  const handleOpen = () => {
    if (phase !== "idle") return;
    setPhase("flap");
    setTimeout(() => {
      setPhase("done");
      onOpen();
    }, 1400);
  };

  return (
    <AnimatePresence>
      {!isOpened && (
        <motion.div
          key="envelope-screen"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
        >
          <div
            className="relative flex flex-col items-center"
            style={{ perspective: 1200 }}
          >
            {/* Envelope wrapper */}
            <div
              className="relative w-[300px] h-[200px]"
              style={{ perspective: 1200 }}
            >
              {/* ── Body ── */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
                <DesignImage src={bgImage} opacity={0.25} />
                <div className="absolute inset-0 bg-secondary/80" />
              </div>

              {/* ── Side fold lines (V-shape decorative) ── */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom right, hsl(var(--primary)/0.08) 50%, transparent 50%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom left, hsl(var(--primary)/0.08) 50%, transparent 50%)",
                  }}
                />
              </div>

              {/* ── Names on face ── */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <motion.div
                  animate={
                    phase === "idle"
                      ? { scale: [1, 1.05, 1] }
                      : { scale: 1, opacity: 0.4 }
                  }
                  transition={
                    phase === "idle"
                      ? { repeat: Infinity, duration: 2 }
                      : { duration: 0.2 }
                  }
                  className="flex h-[87px] w-[87px] items-center justify-center rounded-full bg-white shadow-[0_5px_14px_rgba(0,0,0,0.2)]"
                  aria-label={initialsImageUrl ? "Uploaded initials" : "Envelope initials"}
                >
                  {initialsImageUrl ? (
                    <img
                      src={initialsImageUrl}
                      alt="Uploaded initials"
                      className="h-[76%] w-[76%] object-contain"
                      style={{ transform: `scale(${initialsImageScale / 100})` }}
                      draggable={false}
                    />
                  ) : (
                    <span
                      className="max-w-[82%] text-center leading-none text-[#5c4b52]"
                      style={{
                        fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
                        fontSize: initialsSize ? `${initialsSize}px` : "24px",
                      }}
                    >
                      {names}
                    </span>
                  )}
                </motion.div>
              </div>

              {/* ── Top flap ── */}
              <motion.div
                className="absolute top-0 left-0 right-0 z-20 origin-top"
                style={{ height: "55%", transformStyle: "preserve-3d" }}
                animate={{ rotateX: phase !== "idle" ? -175 : 0 }}
                transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Front face of flap */}
                <div
                  className="absolute inset-0 rounded-t-2xl overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: "hsl(var(--secondary))",
                    borderBottom: "1px solid hsl(var(--primary)/0.15)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <DesignImage src={bgImage} opacity={0.2} />
                </div>
                {/* Back face of flap (shown after flip) */}
                <div
                  className="absolute inset-0 rounded-t-2xl"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: "hsl(var(--card))",
                    backfaceVisibility: "hidden",
                    transform: "rotateX(180deg)",
                  }}
                />
              </motion.div>

              {/* ── Bottom triangle fold (decorative) ── */}
              <div
                className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-2xl"
                style={{ height: "45%", zIndex: 5 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                    background: "hsl(var(--primary)/0.12)",
                  }}
                />
              </div>
            </div>

            {/* ── BUKA button ── */}
            <motion.button
              onClick={handleOpen}
              animate={
                phase === "idle"
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1, opacity: 0.4 }
              }
              transition={
                phase === "idle"
                  ? { repeat: Infinity, duration: 2 }
                  : { duration: 0.2 }
              }
              disabled={phase !== "idle"}
              className="mt-8 px-8 py-2 bg-primary text-primary-foreground rounded-full tracking-widest text-sm shadow-md font-semibold cursor-pointer disabled:cursor-default"
              dangerouslySetInnerHTML={{ __html: openButtonText }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
