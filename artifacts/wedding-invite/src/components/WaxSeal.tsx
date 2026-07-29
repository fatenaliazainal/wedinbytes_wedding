import React from "react";
import waxSealAsset from "@assets/Untitled_design_1785323372446.png";

interface WaxSealProps {
  names: string;
  initialsSize?: string;
  className?: string;
}

/**
 * Wax seal artwork with a dynamic fill matching the invitation's primary
 * colour (the same colour used by the Open Button).
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
        className="absolute inset-0 h-full w-full object-contain opacity-30 mix-blend-screen"
        draggable={false}
      />
      <span
        className="relative z-10 max-w-[78%] text-center leading-[0.9] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
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