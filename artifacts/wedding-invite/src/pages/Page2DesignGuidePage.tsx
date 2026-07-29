import { useState } from "react";
import { Image as ImageIcon, LockKeyhole, Maximize2, Upload } from "lucide-react";

const FRAME_WIDTH = 420;

type GuideImage = {
  url: string;
  name: string;
};

export default function Page2DesignGuidePage() {
  const [guideImage, setGuideImage] = useState<GuideImage | null>(null);
  const [imageScale, setImageScale] = useState(100);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setGuideImage({ url, name: file.name });
  };

  return (
    <main className="min-h-screen bg-[#f5f5f3] px-5 py-8 text-[#111827]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-500">
            Wedding invitation reference
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Page 2 Design Guide
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            A locked 100% reference frame for designing content that remains safe
            on the real mobile invitation viewport.
          </p>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.16em]">Safe area overlay</h2>
                <p className="mt-1 text-xs text-gray-500">Mobile frame: 420px wide × 100vh</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
                <LockKeyhole size={13} />
                Zoom locked 100%
              </div>
            </div>

            <div className="relative mx-auto flex min-h-[560px] w-full max-w-[760px] items-center justify-center overflow-hidden rounded-xl bg-[#e9e9e5] p-5 sm:p-10">
              <div
                className="relative h-[100dvh] w-[420px] max-w-full shrink-0 overflow-hidden border-[5px] border-[#182132] bg-[#fdfdfb] shadow-2xl"
                style={{ zoom: 1 }}
              >
                <div className="absolute inset-0 bg-[#f9f8f4]" />

                <div className="pointer-events-none absolute inset-0 z-20">
                  <div className="absolute inset-x-0 top-0 h-[18%] border-b border-dashed border-amber-500/70 bg-amber-300/10">
                    <span className="absolute left-3 top-3 rounded bg-amber-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Warning Area · Top
                    </span>
                  </div>
                  <div className="absolute inset-x-[8%] top-[18%] h-[64%] border-2 border-dashed border-emerald-600/80 bg-emerald-300/10">
                    <span className="absolute left-2 top-2 rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Safe Content Area
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-[18%] border-t border-dashed border-amber-500/70 bg-amber-300/10">
                    <span className="absolute bottom-3 left-3 rounded bg-amber-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Warning Area · Bottom
                    </span>
                  </div>
                  <div className="absolute inset-0 border-[14px] border-rose-500/15">
                    <span className="absolute right-2 top-1/2 -rotate-90 rounded bg-rose-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Bleed Area · Background only
                    </span>
                  </div>
                </div>

                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-[12%] text-center">
                  {guideImage ? (
                    <img
                      src={guideImage.url}
                      alt={guideImage.name}
                      className="absolute left-1/2 top-1/2 max-w-none"
                      style={{
                        width: "auto",
                        height: "auto",
                        transform: `translate(-50%, -50%) scale(${imageScale / 100})`,
                        transformOrigin: "center",
                      }}
                    />
                  ) : (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-300">
                      <ImageIcon size={54} strokeWidth={1} />
                    </div>
                  )}
                  <div className="relative rounded-xl border border-emerald-600/60 bg-white/85 px-5 py-4 shadow-sm">
                    <p className="font-serif text-2xl font-semibold leading-tight">Bride &amp; Groom Names</p>
                    <p className="mt-2 text-sm font-medium text-gray-600">Saturday, 23 July 2027</p>
                    <p className="mt-1 text-xs text-gray-500">12:00 PM · Grand Ballroom</p>
                  </div>
                  <div className="relative flex h-24 w-40 items-center justify-center rounded-lg border-2 border-dashed border-violet-500/70 bg-violet-200/50 text-xs font-bold uppercase tracking-wider text-violet-800">
                    Photo · max recommended size
                  </div>
                  <div className="relative h-3 w-28 rounded-full bg-rose-400/60" aria-label="Floral Decoration placeholder" />
                  <button type="button" className="relative rounded-full bg-gray-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
                    Button
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium leading-6 text-gray-700">
              Keep all important text, faces, and decorations inside the Safe Area.
            </p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em]">Guide key</h2>
              <div className="mt-4 space-y-3 text-xs text-gray-600">
                <p><span className="mr-2 inline-block h-3 w-3 border-2 border-emerald-600 bg-emerald-200/50 align-middle" />Safe Content Area — recommended</p>
                <p><span className="mr-2 inline-block h-3 w-3 border border-amber-500 bg-amber-200/50 align-middle" />Warning Area — content may be cut off</p>
                <p><span className="mr-2 inline-block h-3 w-3 border-2 border-rose-500/40 bg-rose-200/30 align-middle" />Bleed Area — background only</p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em]">Image reference</h2>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Images stay at their original scale. They are never enlarged automatically
                to fill the frame. The default scale is 100%.
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 transition-colors hover:border-gray-500 hover:bg-gray-50">
                <Upload size={14} />
                Upload reference image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
              </label>
              {guideImage && (
                <>
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span>Manual image scale</span>
                    <span>{imageScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="1"
                    value={imageScale}
                    onChange={(event) => setImageScale(Number(event.target.value))}
                    className="mt-2 w-full accent-gray-900"
                    aria-label="Manual image scale"
                  />
                  <p className="mt-3 truncate text-xs text-gray-500" title={guideImage.name}>
                    Loaded: {guideImage.name}
                  </p>
                </>
              )}
            </section>

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
              <Maximize2 size={15} className="shrink-0 text-gray-700" />
              <span>Preview scale is fixed at 100%. Resize the browser to inspect the frame, not the image.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}