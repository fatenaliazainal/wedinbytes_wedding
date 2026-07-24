import React from "react";
import { motion } from "framer-motion";

interface EnvelopeDoorsProps {
  isOpened: boolean;
  onOpen: () => void;
  names: string;
  envelopeImageUrl?: string;
  openButtonText?: string;
  cardMaxWidth?: string;
}

const frostedGlass: React.CSSProperties = {
  backdropFilter: "blur(18px) saturate(1.2)",
  WebkitBackdropFilter: "blur(18px) saturate(1.2)",
  background: "rgba(255, 255, 255, 0.15)",
};

export function EnvelopeDoors({
  isOpened,
  onOpen,
  names,
  openButtonText = "BUKA",
  cardMaxWidth,
}: EnvelopeDoorsProps) {
  const maxWidth = cardMaxWidth || "420px";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Constrained to card width */}
      <div
        className={`relative h-full w-full flex items-center justify-center ${isOpened ? "pointer-events-none" : "pointer-events-auto"}`}
        style={{ maxWidth, perspective: 1500 }}
      >
        {/* Left Door */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: isOpened ? -100 : 0, opacity: isOpened ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d", ...frostedGlass }}
          className={`absolute inset-y-0 left-0 w-1/2 border-r border-white/30 overflow-hidden ${
            isOpened ? "pointer-events-none" : "pointer-events-auto"
          }`}
          onClick={!isOpened ? onOpen : undefined}
        />

        {/* Right Door */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: isOpened ? 100 : 0, opacity: isOpened ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          style={{ transformOrigin: "right center", transformStyle: "preserve-3d", ...frostedGlass }}
          className={`absolute inset-y-0 right-0 w-1/2 border-l border-white/30 overflow-hidden ${
            isOpened ? "pointer-events-none" : "pointer-events-auto"
          }`}
          onClick={!isOpened ? onOpen : undefined}
        />

        {/* Central badge/seal */}
        <motion.div
          animate={{ opacity: isOpened ? 0 : 1, scale: isOpened ? 1.5 : 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute z-20 flex flex-col items-center justify-center ${
            isOpened ? "pointer-events-none" : "pointer-events-auto cursor-pointer"
          }`}
          onClick={!isOpened ? onOpen : undefined}
        >
          <div
            className="w-[140px] h-[140px] rounded-full border border-white/50 shadow-xl flex items-center justify-center flex-col relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-2 border border-dashed border-primary/40 rounded-full" />
            <span
              className="text-primary text-center px-4 leading-tight drop-shadow-sm"
              style={{
                fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
                fontSize: "var(--badge-font-size, 24px)",
              }}
            >
              {names}
            </span>
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-5 px-8 py-2 bg-primary text-primary-foreground rounded-full tracking-widest text-sm shadow-md font-semibold"
            dangerouslySetInnerHTML={{ __html: openButtonText }}
          />
        </motion.div>
      </div>
    </div>
  );
}
