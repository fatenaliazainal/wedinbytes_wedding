import React from "react";
import { ShoppingBag } from "lucide-react";
import { type Invitation, type CardDesign } from "@workspace/api-client-react";
import { CardThumbnail } from "@/components/CardThumbnail";

interface CatalogDesignCardProps {
  design: CardDesign;
  invitation?: Invitation;
  onPreview?: () => void;
  onOrder: () => void;
  previewLabel?: string;
}

function PreviewFrame({
  design,
  invitation,
  onPreview,
  previewLabel,
}: Pick<CatalogDesignCardProps, "design" | "invitation" | "onPreview" | "previewLabel">) {
  // Only render the live invitation thumbnail when a static thumbnail image exists.
  // Without one, fall back to a branded placeholder so the catalog stays clean
  // even for designs that haven't had a thumbnail uploaded yet.
  const hasThumbnail = Boolean(design.thumbnailImageUrl);

  const preview = hasThumbnail && invitation ? (
    <CardThumbnail invitation={invitation} design={design} containerWidth={120} />
  ) : (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-3"
      style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }}
    >
      <img
        src="/logo-wedinbytes.png"
        alt="WedInBytes"
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
      <div className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-t-xl bg-transparent">
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

      <div className="flex flex-col items-center px-2 pb-2.5 pt-2 text-center">
        <p className="text-[10px] font-bold leading-tight text-gray-900">{design.name}</p>
        <p className="mt-0.5 font-mono text-[8px] font-semibold tracking-wider text-[#3d5a3e]">
          WED{String(design.id).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onOrder}
          className="mt-2 w-full rounded bg-[#3d5a3e] px-1.5 py-1.5 text-[8px] font-bold tracking-widest text-white transition-colors hover:bg-[#2d4330]"
        >
          <ShoppingBag size={9} className="mr-0.5 inline-block align-[-1px]" />
          ORDER NOW
        </button>
      </div>
    </article>
  );
}