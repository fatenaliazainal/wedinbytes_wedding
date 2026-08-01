import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EnvelopeAnimationProps {
  isOpened: boolean;
  onOpen: () => void;
  names?: string;
  initialsSize?: string;
  initialsImageUrl?: string;
  initialsImageScale?: number;
  envelopeImageUrl?: string; // kept in interface; not used for CSS envelope rendering
  /** Admin-selected wax seal image URL. When provided it REPLACES the default circle entirely. */
  waxSealImageUrl?: string;
}

export function EnvelopeAnimation({
  isOpened,
  onOpen,
  names = "",
  initialsSize,
  initialsImageUrl,
  initialsImageScale = 100,
  waxSealImageUrl,
}: EnvelopeAnimationProps) {
  const [phase, setPhase] = useState<"idle" | "flap" | "done">("idle");

  // unchanged — same timing as before
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
            {/* Envelope wrapper — tap anywhere to trigger open */}
            <div
              className="relative w-[300px] h-[200px] cursor-pointer"
              style={{ perspective: 1200 }}
              onClick={handleOpen}
            >

              {/* ── Body — translucent frosted glass base ── */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(7px)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  boxShadow: [
                    "inset 0 1px 0 rgba(255,255,255,0.38)",   // top rim highlight
                    "inset 0 -1px 0 rgba(0,0,0,0.04)",         // bottom rim shadow
                    "0 4px 24px rgba(0,0,0,0.06)",              // outer lift
                  ].join(", "),
                }}
              />

              {/* ── Left fold crease — shadow side (top-left triangle) ── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom right, rgba(0,0,0,0.055) 50%, transparent 50%)",
                }}
              />
              {/* ── Left fold crease — highlight side ── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom right, transparent 50%, rgba(255,255,255,0.16) 50%)",
                }}
              />

              {/* ── Right fold crease — shadow side (top-right triangle) ── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom left, rgba(0,0,0,0.055) 50%, transparent 50%)",
                }}
              />
              {/* ── Right fold crease — highlight side ── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom left, transparent 50%, rgba(255,255,255,0.16) 50%)",
                }}
              />

              {/* ── Bottom fold triangle ── */}
              <div
                className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-2xl pointer-events-none"
                style={{ height: "45%", zIndex: 3 }}
              >
                {/* Fill */}
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                    background: "rgba(255,255,255,0.07)",
                  }}
                />
                {/* Emboss highlight along top edge of bottom fold */}
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, transparent 30%)",
                  }}
                />
              </div>

              {/* ── Seal on face — wax seal image (when selected) or default initials circle ── */}
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
                  className={
                    waxSealImageUrl
                      ? "flex h-[122px] w-[122px] items-center justify-center"
                      : "flex h-[122px] w-[122px] items-center justify-center rounded-full bg-white shadow-[0_7px_20px_rgba(0,0,0,0.2)]"
                  }
                  aria-label={initialsImageUrl ? "Uploaded initials over wax seal" : waxSealImageUrl ? "Wax seal" : "Envelope initials"}
                >
                  {/* Wax seal — always rendered when present (background layer) */}
                  {waxSealImageUrl && (
                    <img
                      src={waxSealImageUrl}
                      alt="Wax seal"
                      className="absolute inset-0 h-full w-full object-contain"
                      draggable={false}
                    />
                  )}
                  {/* Initials / logo — rendered on top of wax seal when present */}
                  {initialsImageUrl ? (
                    <img
                      src={initialsImageUrl}
                      alt="Uploaded initials"
                      className="relative z-10 h-[76%] w-[76%] object-contain"
                      style={{ transform: `scale(${initialsImageScale / 100})` }}
                      draggable={false}
                    />
                  ) : (
                    <span
                      className={`relative z-10 max-w-[82%] text-center leading-none text-[#5c4b52]`}
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

              {/* ── Top flap — unchanged rotateX animation, CSS visual ── */}
              <motion.div
                className="absolute top-0 left-0 right-0 z-20 origin-top"
                style={{ height: "55%", transformStyle: "preserve-3d" }}
                animate={{ rotateX: phase !== "idle" ? -175 : 0 }}
                transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Front face — frosted triangle */}
                <div
                  className="absolute inset-0 rounded-t-2xl overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: "rgba(255,255,255,0.13)",
                    backdropFilter: "blur(7px)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Emboss highlights along the two diagonal edges */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: [
                        "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, transparent 35%)",
                        "linear-gradient(225deg, rgba(255,255,255,0.30) 0%, transparent 35%)",
                        "linear-gradient(to bottom, rgba(255,255,255,0.14) 0%, transparent 25%)",
                      ].join(", "),
                    }}
                  />
                </div>
                {/* Back face — shown when flap flips open */}
                <div
                  className="absolute inset-0 rounded-t-2xl"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: "rgba(255,255,255,0.07)",
                    backfaceVisibility: "hidden",
                    transform: "rotateX(180deg)",
                  }}
                />
              </motion.div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
