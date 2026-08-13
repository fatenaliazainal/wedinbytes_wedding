import { useEffect, useRef, useState } from "react";
import { X, Download, Copy, Check, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  url: string;
  coupleName: string;
  onClose: () => void;
}

export default function QRModal({ url, coupleName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!canvasRef.current) return;
    // Draw branded QR onto canvas
    const SIZE = 320;
    const PADDING = 24;
    const QR_SIZE = SIZE - PADDING * 2;

    QRCode.toCanvas(canvasRef.current, url, {
      width: QR_SIZE,
      margin: 1,
      color: { dark: "#1e293b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(() => {
      // Compose final branded image on an offscreen canvas
      const offscreen = document.createElement("canvas");
      const HEADER = 64;
      const FOOTER = 72;
      offscreen.width = SIZE;
      offscreen.height = HEADER + QR_SIZE + FOOTER;
      const ctx = offscreen.getContext("2d")!;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      // Top accent bar
      ctx.fillStyle = "#3d5a3e";
      ctx.fillRect(0, 0, SIZE, 6);

      // Header text — Wedinstudio
      ctx.fillStyle = "#3d5a3e";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WEDINSTUDIO", SIZE / 2, 30);

      // Couple name
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(coupleName, SIZE / 2, 52);

      // Draw QR from the visible canvas
      ctx.drawImage(canvasRef.current!, PADDING, HEADER, QR_SIZE, QR_SIZE);

      // Center logo overlay
      const LOGO_SIZE = 54;
      const logoX = PADDING + QR_SIZE / 2 - LOGO_SIZE / 2;
      const logoY = HEADER + QR_SIZE / 2 - LOGO_SIZE / 2;
      const RADIUS = 8;

      const drawLogo = () => {
        // White rounded-rect background
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(logoX - 4, logoY - 4, LOGO_SIZE + 8, LOGO_SIZE + 8, RADIUS + 2);
        ctx.fill();

        // Logo image clipped to rounded rect
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, LOGO_SIZE, LOGO_SIZE, RADIUS);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, LOGO_SIZE, LOGO_SIZE);
        ctx.restore();
      };

      const logo = new Image();
      logo.onload = () => {
        drawLogo();
        finalize();
      };
      logo.onerror = () => {
        // skip logo if it fails to load
        finalize();
      };
      logo.src = "/logo-wedinbytes.png";

      const finalize = () => {
        // Footer URL text — truncate to fit canvas width
        ctx.fillStyle = "#64748b";
        ctx.font = "11px sans-serif";
        const maxWidth = SIZE - 16;
        let shortUrl = url.replace(/^https?:\/\//, "");
        while (ctx.measureText(shortUrl).width > maxWidth && shortUrl.length > 10) {
          shortUrl = shortUrl.slice(0, -1);
        }
        if (shortUrl !== url.replace(/^https?:\/\//, "")) shortUrl += "…";
        ctx.fillText(shortUrl, SIZE / 2, HEADER + QR_SIZE + 22);

        // Bottom dot decoration
        ctx.fillStyle = "#3d5a3e";
        ctx.beginPath();
        ctx.arc(SIZE / 2, HEADER + QR_SIZE + 50, 3, 0, Math.PI * 2);
        ctx.fill();

        setDataUrl(offscreen.toDataURL("image/png"));
      };
    });
  }, [url, coupleName]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${coupleName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#3d5a3e] px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <QrCode size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Invitation QR Code</h2>
              <p className="text-xs text-white/70 mt-0.5">{coupleName}</p>
            </div>
          </div>
        </div>

        {/* QR Canvas (hidden — used for generation) */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Preview of branded image */}
        <div className="flex flex-col items-center px-6 py-6 gap-4">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="QR Code"
              className="w-64 h-auto rounded-xl border border-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-64 h-64 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3d5a3e]" />
            </div>
          )}

          {/* URL pill */}
          <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="flex-1 text-xs text-slate-600 truncate font-medium">{url}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-[#3d5a3e] transition"
              title="Copy link"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!dataUrl}
              className="w-full flex items-center justify-center gap-2 bg-[#3d5a3e] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#2d4330] transition disabled:opacity-50"
            >
              <Download size={16} />
              Download QR Code
            </button>
            <p className="text-center text-xs text-slate-400">
              Branded QR image ready to share or print.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
