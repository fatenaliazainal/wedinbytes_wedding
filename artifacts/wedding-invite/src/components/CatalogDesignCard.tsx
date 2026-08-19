import React from "react";
import { ShoppingBag } from "lucide-react";
import { type CardDesign } from "@workspace/api-client-react";
import { resolveImageUrl } from "@/lib/r2-url";

interface CatalogDesignCardProps {
  design: CardDesign;
  onPreview?: () => void;
  onOrder: () => void;
  previewLabel?: string;
}

function PreviewFrame({
  design,
  onPreview,
  previewLabel,
}: Pick<CatalogDesignCardProps, "design" | "onPreview" | "previewLabel">) {
  const thumbnailSrc = resolveImageUrl(design.thumbnailImageUrl ?? undefined);

  const preview = thumbnailSrc ? (
    // Static thumbnail image — instant, no text flash on load
    <img
      src={thumbnailSrc}
      alt={design.name}
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
    />
  ) : (
    // No thumbnail yet — show branded logo placeholder
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-3"
      style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }}
    >
      <img
        src="/logo-wedinbytes.png"
        alt="Wedinstudio"
        draggable={false}
        className="w-16 opacity-60 select-none pointer-events-none"
        style={{ objectFit: "contain" }}
      />
    </div>
  );

  return (
    <button
      type="button"
      onClick={onPreview}
      className="block w-full text-left"
      aria-label={previewLabel ?? `Open live demo for ${design.name}`}
    >
      <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-transparent">
        <div className="absolute inset-0">{preview}</div>
      </div>
    </button>
  );
}

export function CatalogDesignCard({
  design,
  invitation,
  onPreview,
  onOrder,
  previewLabel,
}: CatalogDesignCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_5px_16px_rgba(31,41,55,0.10)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,41,55,0.16)]">
      <PreviewFrame
        design={design}
        invitation={invitation}
        onPreview={onPreview}
        previewLabel={previewLabel}
      />

      <div className="flex flex-col items-center px-2 pb-2 pt-2 text-center sm:px-2.5 sm:pb-3">
        <p className="w-full truncate text-xs font-bold leading-tight text-gray-900 sm:text-sm uppercase tracking-wide">{design.name}</p>
        {design.designCode && (
          <p className="mt-0.5 font-mono text-[8px] font-semibold tracking-wider text-[#3d5a3e]">
            #{design.designCode}
          </p>
        )}
        <button
          type="button"
          onClick={onOrder}
          className="mt-3 w-full rounded-full bg-[#3d5a3e] px-2 py-2 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330]"
        >
          <ShoppingBag size={11} className="mr-1 inline-block align-[-2px]" />
          TRY IT FREE
        </button>
      </div>
    </article>
  );
}