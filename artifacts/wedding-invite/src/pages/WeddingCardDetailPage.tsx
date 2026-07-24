import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageSquareQuote, ClipboardList, Wand2, Loader2, type LucideIcon } from "lucide-react";
import { useListDesigns, useGetInvitation } from "@workspace/api-client-react";
import { CardThumbnail } from "@/components/CardThumbnail";
import { CARD_FEATURES } from "../data/weddingCards";
import { useAuth } from "@/context/AuthContext";

const ICON_MAP: Record<string, LucideIcon> = {
  Wand2,
  Mail,
  MessageSquareQuote,
  ClipboardList,
};

export default function WeddingCardDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const mainPreviewRef = useRef<HTMLDivElement>(null);
  const [mainWidth, setMainWidth] = useState(380);

  const { data: designs = [], isLoading, isError } = useListDesigns();
  const { data: demoInvitation } = useGetInvitation("demo");

  const id = slug ? parseInt(slug, 10) : NaN;
  const card = designs.find((d) => d.id === id);
  const similarCards = designs.filter((d) => d.id !== id).slice(0, 4);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    if (!mainPreviewRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMainWidth(entry.contentRect.width);
      }
    });
    observer.observe(mainPreviewRef.current);
    return () => observer.disconnect();
  }, []);

  const title = card?.name ?? "Card Design";

  return (
    <div className="min-h-[100dvh] w-full bg-white text-[#222] pb-24">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-1 text-xs tracking-wide text-black/55">
          <button
            type="button"
            onClick={() => navigate("/weddingcards/home")}
            className="hover:underline hover:text-black/80 transition-colors"
          >
            Wedding Invitations
          </button>
          <span>&gt;</span>
          <span className="text-black/80 font-medium">{isLoading ? "..." : title}</span>
        </div>

        {isLoading && (
          <div className="mt-24 flex flex-col items-center gap-3 text-black/40">
            <Loader2 size={36} className="animate-spin" />
            <p className="text-sm">Loading...</p>
          </div>
        )}

        {isError && !isLoading && (
          <div className="mt-24 flex flex-col items-center gap-3 text-center text-black/50">
            <p className="text-base font-medium">Failed to load card design.</p>
            <button
              type="button"
              onClick={() => navigate("/weddingcards/home")}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2 text-sm shadow-sm"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="mt-5">
              <div className="rounded-3xl bg-[#f5f1ec] p-4 shadow-sm sm:p-6">
                <div
                  ref={mainPreviewRef}
                  className="mx-auto max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-lg"
                  style={{ aspectRatio: "3/4", position: "relative" }}
                >
                  {demoInvitation && card ? (
                    <CardThumbnail
                      invitation={demoInvitation}
                      design={card}
                      containerWidth={mainWidth}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#f6f1e7]" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                  {card?.openingAnimation && (
                    <p className="mt-1 text-xs uppercase tracking-widest text-black/40">
                      Animation: {card.openingAnimation}
                    </p>
                  )}
                </div>

                <div className="space-y-5">
                  {CARD_FEATURES.map((feature) => {
                    const Icon = ICON_MAP[feature.icon];
                    return (
                      <div key={feature.title} className="flex gap-4">
                        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/5">
                          {Icon && <Icon size={20} />}
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{feature.title}</div>
                          <p className="mt-1 text-sm leading-relaxed text-black/60">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/weddingcards/home")}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium shadow-sm"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Editor is admin-only.");
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#222] px-5 py-3 text-sm font-medium text-white shadow-sm"
                  >
                    Personalise
                  </button>
                </div>
              </div>
            </div>

            {similarCards.length > 0 && (
              <div className="mt-10">
                <h2 className="text-center text-2xl font-semibold sm:text-3xl">You May Also Like</h2>
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                  {similarCards.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => navigate(`/weddingcards/home/${d.id}`)}
                      className="text-left"
                    >
                      <div className="relative mx-auto w-full max-w-[220px]">
                        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm bg-[#d8d0be]" />
                        <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-sm bg-[#ede7d8]" />
                        <div className="relative overflow-hidden rounded-sm border border-black/8 bg-white shadow-sm">
                          <div className="aspect-[3/4] bg-[#f6f1e7] relative">
                            {demoInvitation ? (
                              <CardThumbnail invitation={demoInvitation} design={d} />
                            ) : (
                              <div className="absolute inset-0 bg-[#f6f1e7]" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-center text-sm text-black/85">{d.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/weddingcards/home")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              toast.info("Editor is admin-only.");
            }}
            className="flex-1 rounded-full bg-[#222] py-3 text-base font-semibold text-white shadow-sm"
          >
            Personalise
          </button>
        </div>
      </div>
    </div>
  );
}
