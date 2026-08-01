import React from "react";
import { motion } from "framer-motion";
import defaultEnvelopeRef from "@assets/Screenshot_2026-05-03-00-19-07-34_40deb401b9ffe8e1df2f1cc5ba48_1777739356642.jpg";

interface EnvelopeDoorsProps {
  isOpened: boolean;
  onOpen: () => void;
  names?: string;
  initialsSize?: string;
  initialsImageUrl?: string;
  initialsImageScale?: number;
  envelopeImageUrl?: string;
  cardMaxWidth?: string;
}

export function EnvelopeDoors({
  isOpened,
  onOpen,
  names = "",
  initialsSize,
  initialsImageUrl,
  initialsImageScale = 100,
  envelopeImageUrl,
  cardMaxWidth,
}: EnvelopeDoorsProps) {
  const maxWidth = cardMaxWidth || "420px";
  const coverSrc = envelopeImageUrl || defaultEnvelopeRef;

  // Both panels open simultaneously with the same timing
  const panelTransition = { duration: 0.9, ease: [0.25, 1, 0.5, 1] as const };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Constrained to card width; perspective set here so rotateY has depth */}
      <div
        className={`relative h-full w-full flex items-center justify-center ${isOpened ? "pointer-events-none" : "pointer-events-auto"}`}
        style={{ maxWidth, perspective: "1000px" }}
      >
        {/* ── Left Door panel — hinge at outer-left edge ── */}
        <motion.div
          initial={{ rotateY: 0, opacity: 0.5 }}
          animate={{ rotateY: isOpened ? -95 : 0, opacity: isOpened ? 0 : 0.5 }}
          transition={panelTransition}
          className={`absolute inset-y-0 left-0 w-1/2 overflow-hidden ${
            isOpened ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
          onClick={!isOpened ? onOpen : undefined}
        >
          <img
            src={coverSrc}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-y-0 h-full select-none pointer-events-none"
            style={{
              width: "200%",
              left: 0,
              objectFit: "cover",
              objectPosition: "left center",
            }}
          />
          {/* Inner-edge shadow for depth */}
          <div
            className="absolute inset-y-0 right-0 w-6 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)" }}
          />
        </motion.div>

        {/* ── Right Door panel — hinge at outer-right edge ── */}
        <motion.div
          initial={{ rotateY: 0, opacity: 0.5 }}
          animate={{ rotateY: isOpened ? 95 : 0, opacity: isOpened ? 0 : 0.5 }}
          transition={panelTransition}
          className={`absolute inset-y-0 right-0 w-1/2 overflow-hidden ${
            isOpened ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{ transformOrigin: "right center", backfaceVisibility: "hidden" }}
          onClick={!isOpened ? onOpen : undefined}
        >
          <img
            src={coverSrc}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-y-0 h-full select-none pointer-events-none"
            style={{
              width: "200%",
              right: 0,
              objectFit: "cover",
              objectPosition: "right center",
            }}
          />
          {/* Inner-edge shadow for depth */}
          <div
            className="absolute inset-y-0 left-0 w-6 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)" }}
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
              background: "rgba(0,0,0,0.08)",
              zIndex: 10,
            }}
          />
        )}

        {/* ── Central badge / seal ── */}
        <motion.div
          animate={{ opacity: isOpened ? 0 : 1, scale: isOpened ? 1.5 : 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute z-20 flex flex-col items-center justify-center ${
            isOpened ? "pointer-events-none" : "pointer-events-auto cursor-pointer"
          }`}
          onClick={!isOpened ? onOpen : undefined}
        >
          <div
            className="flex h-[126px] w-[126px] items-center justify-center rounded-full bg-white shadow-[0_7px_20px_rgba(0,0,0,0.2)]"
            aria-label={initialsImageUrl ? "Uploaded initials" : "Envelope initials"}
          >
            <motion.div
              animate={isOpened ? { scale: 1 } : { scale: [1, 1.05, 1] }}
              transition={
                isOpened
                  ? { duration: 0.2 }
                  : { repeat: Infinity, duration: 2 }
              }
              className="flex h-full w-full items-center justify-center"
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
        </motion.div>
      </div>
    </div>
  );
}
