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
  const preview = invitation ? (
    <CardThumbnail invitation={invitation} design={design} containerWidth={220} />
  ) : (
    <div
      className="h-full w-full"
      style={{ background: design.colorBackground ? `hsl(${design.colorBackground})` : "#f6f1e7" }}
    />
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

      <div className="flex flex-col items-center px-2.5 pb-3 pt-2.5 text-center sm:px-3 sm:pb-4">
        <p className="text-xs font-bold leading-tight text-gray-900 sm:text-sm">{design.name}</p>
        <p className="mt-1 font-mono text-[9px] font-semibold tracking-wider text-rose-700">
          WED{String(design.id).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onOrder}
          className="mt-3 w-full rounded-full bg-gray-900 px-2 py-2 text-[10px] font-bold tracking-widest text-white transition-colors hover:bg-gray-700"
        >
          <ShoppingBag size={11} className="mr-1 inline-block align-[-2px]" />
          ORDER NOW
        </button>
      </div>
    </article>
  );
}