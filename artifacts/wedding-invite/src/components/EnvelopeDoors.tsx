import React from "react";
import { motion } from "framer-motion";

interface EnvelopeDoorsProps {
  isOpened: boolean;
  onOpen: () => void;
  names?: string;
  initialsSize?: string;
  initialsImageUrl?: string;
  initialsImageScale?: number;
  waxSealImageUrl?: string;
  envelopeImageUrl?: string; // kept in interface; panels are pure CSS — no image rendered
  cardMaxWidth?: string;
}

export function EnvelopeDoors({
  isOpened,
  onOpen,
  names = "",
  initialsSize,
  initialsImageUrl,
  initialsImageScale = 100,
  waxSealImageUrl,
  cardMaxWidth,
}: EnvelopeDoorsProps) {
  const maxWidth = cardMaxWidth || "420px";

  // Both panels open simultaneously with the same timing — unchanged
  const panelTransition = { duration: 0.9, ease: [0.25, 1, 0.5, 1] as const };

  // Shared embossed-glass surface — fully determined by synchronous CSS,
  // no image load required, so no async grey-rectangle flash.
  const glassSurface: React.CSSProperties = {
    background: "rgba(255,255,255,0.23)",
    backdropFilter: "blur(2px)",
    boxShadow: [
      "inset 0 0 0 1px rgba(255,255,255,0.55)",   // strong rim highlight
      "inset 3px 0 14px rgba(255,255,255,0.22)",   // inner glow
      "inset -3px 0 14px rgba(0,0,0,0.10)",         // inner shadow
      "0 0 0 1px rgba(0,0,0,0.08)",                // outer ring
      "0 4px 16px rgba(0,0,0,0.06)",               // outer lift shadow
    ].join(", "),
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Constrained to card width; perspective set here for rotateY depth */}
      <div
        className={`relative h-full w-full flex items-center justify-center ${isOpened ? "pointer-events-none" : "pointer-events-auto"}`}
        style={{ maxWidth, perspective: "1000px" }}
      >

        {/* ── Left Door panel — hinge at outer-left edge ── */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: isOpened ? -95 : 0, opacity: isOpened ? 0 : 1 }}
          transition={panelTransition}
          className={`absolute inset-y-0 left-0 w-1/2 ${
            isOpened ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{
            ...glassSurface,
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
          }}
          onClick={!isOpened ? onOpen : undefined}
        >
          {/* Inner-edge emboss at the center seam */}
          <div
            className="absolute inset-y-0 right-0 w-8 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, rgba(0,0,0,0.07), transparent)",
            }}
          />
          {/* Outer-edge highlight */}
          <div
            className="absolute inset-y-0 left-0 w-4 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(255,255,255,0.12), transparent)",
            }}
          />
        </motion.div>

        {/* ── Right Door panel — hinge at outer-right edge ── */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: isOpened ? 95 : 0, opacity: isOpened ? 0 : 1 }}
          transition={panelTransition}
          className={`absolute inset-y-0 right-0 w-1/2 ${
            isOpened ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{
            ...glassSurface,
            transformOrigin: "right center",
            backfaceVisibility: "hidden",
          }}
          onClick={!isOpened ? onOpen : undefined}
        >
          {/* Inner-edge emboss at the center seam */}
          <div
            className="absolute inset-y-0 left-0 w-8 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.07), transparent)",
            }}
          />
          {/* Outer-edge highlight */}
          <div
            className="absolute inset-y-0 right-0 w-4 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, rgba(255,255,255,0.12), transparent)",
            }}
          />
        </motion.div>

        {/* ── Center seam line ── */}
        {!isOpened && (
          <div
            className="absolute inset-y-0 pointer-events-none"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              width: "1px",
              background: "rgba(255,255,255,0.18)",
              zIndex: 10,
            }}
          />
        )}

        {/* ── Central badge / seal — unchanged ── */}
        <motion.div
          animate={{ opacity: isOpened ? 0 : 1, scale: isOpened ? 1.5 : 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute z-20 flex flex-col items-center justify-center ${
            isOpened ? "pointer-events-none" : "pointer-events-auto cursor-pointer"
          }`}
          onClick={!isOpened ? onOpen : undefined}
        >
          <div
            className={`relative flex h-[126px] w-[126px] items-center justify-center rounded-full ${waxSealImageUrl ? "" : "bg-white shadow-[0_7px_20px_rgba(0,0,0,0.2)]"}`}
            aria-label={initialsImageUrl ? "Uploaded initials over wax seal" : waxSealImageUrl ? "Wax seal" : "Envelope initials"}
          >
            <motion.div
              animate={isOpened ? { scale: 1 } : { scale: [1, 1.05, 1] }}
              transition={
                isOpened
                  ? { duration: 0.2 }
                  : { repeat: Infinity, duration: 2 }
              }
              className="relative flex h-full w-full items-center justify-center"
            >
              {/* Wax seal — always rendered when present (background layer) */}
              {waxSealImageUrl && (
                <img
                  src={waxSealImageUrl}
                  alt="Wax seal"
                  className="absolute inset-0 h-full w-full rounded-full object-cover"
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
              ) : !waxSealImageUrl ? (
                <span
                  className="relative z-10 max-w-[82%] text-center leading-none text-[#5c4b52]"
                  style={{
                    fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
                    fontSize: initialsSize ? `${initialsSize}px` : "24px",
                  }}
                >
                  {names}
                </span>
              ) : names ? (
                <span
                  className="relative z-10 max-w-[82%] text-center leading-none text-[#5c4b52]"
                  style={{
                    fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
                    fontSize: initialsSize ? `${initialsSize}px` : "24px",
                  }}
                >
                  {names}
                </span>
              ) : null}
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
