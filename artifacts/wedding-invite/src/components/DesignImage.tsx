import React from "react";
import { fallbackToR2Proxy } from "@/lib/r2-url";

type ObjectPosition = "center" | "left center" | "right center" | "top center" | "bottom center";

interface DesignImageProps {
  src: string;
  opacity?: number;
  objectPosition?: ObjectPosition;
  className?: string;
  style?: React.CSSProperties;
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
}: DesignImageProps) {
  return (
    <img
      src={src}
      aria-hidden
      alt=""
      draggable={false}
      onError={(e) => fallbackToR2Proxy(e, src)}
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none ${className}`}
      style={{ opacity, objectPosition, ...style }}
    />
  );
}
