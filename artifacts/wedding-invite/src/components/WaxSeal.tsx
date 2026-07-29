import React from "react";
import waxSealAsset from "@assets/Untitled_design_1785323372446.png";

interface WaxSealProps {
  names: string;
  initialsSize?: string;
  className?: string;
}

/**
 * Wax seal artwork with a very subtle hint of the invitation's primary colour
 * (the same colour used by the Open Button), while preserving the artwork's
 * natural glossy highlights and shadows.
 */
export function WaxSeal({ names, initialsSize, className = "" }: WaxSealProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      aria-label={names || "Envelope initials"}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "hsl(var(--primary))",
          opacity: 0.24,
          maskImage: `url(${waxSealAsset})`,
          WebkitMaskImage: `url(${waxSealAsset})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
      <img
        src={waxSealAsset}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-contain opacity-95"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-[10%] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 34% 24%, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.2) 22%, transparent 52%)",
          mixBlendMode: "screen",
        }}
      />
      <span
        className="relative z-10 max-w-[78%] text-center leading-[0.9] text-[#5c4b52] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
        style={{
          fontFamily: "var(--name-font-family, 'Dancing Script', serif)",
          fontSize: initialsSize ? `${initialsSize}px` : "var(--envelope-initials-font-size, 24px)",
        }}
      >
        {names}
      </span>
    </div>
  );
}