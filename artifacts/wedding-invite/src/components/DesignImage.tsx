import React, { useEffect, useState } from "react";

type ObjectPosition = "center" | "left center" | "right center" | "top center" | "bottom center";

interface DesignImageProps {
  src: string;
  opacity?: number;
  objectPosition?: ObjectPosition;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
}

/**
 * Renders a design image (PNG, JPG, WebP, or SVG) as a positioned <img> element
 * with object-fit: cover. Using <img> instead of CSS background-image ensures
 * SVGs without explicit width/height attributes still scale correctly.
 */
export function DesignImage({
  src,
  opacity = 1,
  objectPosition = "center",
  className = "",
  style,
  fallbackSrc,
}: DesignImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  if (!currentSrc) return null;

  return (
    <img
      src={currentSrc}
      aria-hidden
      alt=""
      draggable={false}
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none ${className}`}
      style={{ opacity, objectPosition, ...style }}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setCurrentSrc(null);
        }
      }}
    />
  );
}
