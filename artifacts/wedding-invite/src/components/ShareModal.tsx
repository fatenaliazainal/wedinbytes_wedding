import { useState, useMemo } from "react";
import { X, Copy, Check } from "lucide-react";

interface Invitation {
  groomName: string;
  brideName: string;
  coverGroomName?: string | null;
  coverBrideName?: string | null;
  groomParents?: string | null;
  brideParents?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  eventDay?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  venueMapUrl?: string | null;
  language?: string | null;
}

interface Props {
  card: Invitation;
  inviteUrl: string;
  onClose: () => void;
}

const MALAY_MONTHS: Record<number, string> = {
  1: "Januari", 2: "Februari", 3: "Mac", 4: "April",
  5: "Mei", 6: "Jun", 7: "Julai", 8: "Ogos",
  9: "September", 10: "Oktober", 11: "November", 12: "Disember",
};

const ENGLISH_MONTHS: Record<number, string> = {
  1: "January", 2: "February", 3: "March", 4: "April",
  5: "May", 6: "June", 7: "July", 8: "August",
  9: "September", 10: "October", 11: "November", 12: "December",
};

function formatDate(dateStr: string | null | undefined, months: Record<number, string>): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;
  const [, y, m, d] = match;
  return `${parseInt(d)} ${months[parseInt(m)]} ${y}`;
}

function buildMalayTemplate(card: Invitation, inviteUrl: string): string {
  const groomName    = card.coverGroomName || card.groomName || "";
  const brideName    = card.coverBrideName || card.brideName || "";
  const eventTitle   = (card.eventType || "WALIMATULURUS").toUpperCase();
  const day          = card.eventDay || "";
  const date         = formatDate(card.eventDate, MALAY_MONTHS);
  const dateStr      = day && date ? `${day}, ${date}` : date;
  const venue        = [card.venueName, card.venueAddress].filter(Boolean).join(", ");
  const startTime    = card.eventStartTime || "";
  const endTime      = card.eventEndTime   || "";
  const timeStr      = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "";
  const mapUrl       = card.venueMapUrl || "";
  const groomParents = card.groomParents || "";
  const brideParents = card.brideParents || "";

  const lines: string[] = [
    `🕊 UNDANGAN ${eventTitle} 🕊`,
    "",
    "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
    "ASSALAMUALAIKUM W.B.T",
    "",
    "Dengan segala hormat dan penuh kesyukuran ke hadrat Ilahi, kami",
    "",
  ];

  if (groomParents) lines.push(groomParents);
  if (groomParents && brideParents) lines.push("&");
  if (brideParents) lines.push(brideParents);
  if (groomParents || brideParents) lines.push("");

  lines.push("menjemput YBhg. Dato'/Datin/Tuan/Puan sekeluarga");
  lines.push("bagi meraikan Majlis Perkahwinan putera/puteri kami dengan pasangannya,");
  lines.push("");
  lines.push(groomName);
  lines.push("❤️");
  lines.push(brideName);
  lines.push("");

  if (dateStr) lines.push(`🗓 Pada hari ${dateStr}`);
  if (venue)   lines.push(`🏠 Bertempat di ${venue}`);
  if (mapUrl)  lines.push(`📍 ${mapUrl}`);
  if (timeStr) lines.push(`⏰ Waktu Majlis: ${timeStr}`);

  lines.push("");
  lines.push("Semoga dengan kehadiran para tetamu serta iringan doa kalian");
  lines.push("membawa keberkatan daripada Allah S.W.T.");
  lines.push("");
  lines.push("Sekian, terima kasih 🌹");

  if (inviteUrl) { lines.push(""); lines.push(inviteUrl); }

  return lines.join("\n");
}

function buildEnglishTemplate(card: Invitation, inviteUrl: string): string {
  const groomName    = card.coverGroomName || card.groomName || "";
  const brideName    = card.coverBrideName || card.brideName || "";
  const date         = formatDate(card.eventDate, ENGLISH_MONTHS);
  const day          = card.eventDay || "";
  const dateStr      = day && date ? `${day}, ${date}` : date;
  const venue        = [card.venueName, card.venueAddress].filter(Boolean).join(", ");
  const startTime    = card.eventStartTime || "";
  const endTime      = card.eventEndTime   || "";
  const timeStr      = startTime && endTime ? `${startTime} – ${endTime}` : startTime || endTime || "";
  const mapUrl       = card.venueMapUrl || "";
  const groomParents = card.groomParents || "";
  const brideParents = card.brideParents || "";

  const lines: string[] = [
    "🤍 WEDDING INVITATION 🤍",
    "",
    "Together with their families,",
    "",
    groomName,
    "&",
    brideName,
    "",
    "joyfully invite you to celebrate their wedding.",
    "",
  ];

  if (dateStr) lines.push(`🗓 Date: ${dateStr}`);
  if (venue)   lines.push(`📍 Venue: ${venue}`);
  if (mapUrl)  lines.push(`📌 Location: ${mapUrl}`);
  if (timeStr) lines.push(`⏰ Time: ${timeStr}`);

  lines.push("");
  lines.push("Your presence would mean so much to us as we begin this new chapter together.");
  lines.push("We look forward to celebrating with you.");
  lines.push("");
  lines.push("With love and gratitude,");

  if (groomParents) lines.push(groomParents);
  if (groomParents && brideParents) lines.push("&");
  if (brideParents) lines.push(brideParents);

  if (inviteUrl) { lines.push(""); lines.push(inviteUrl); }

  return lines.join("\n");
}

function buildTemplate(card: Invitation, inviteUrl: string): string {
  const isEnglish = (card.language || "").toLowerCase().includes("en");
  return isEnglish
    ? buildEnglishTemplate(card, inviteUrl)
    : buildMalayTemplate(card, inviteUrl);
}

export default function ShareModal({ card, inviteUrl, onClose }: Props) {
  const defaultText = useMemo(() => buildTemplate(card, inviteUrl), [card, inviteUrl]);
  const [text, setText] = useState(defaultText);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Share with Your Guests</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review and personalise your invitation message before sharing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition mt-0.5 flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Editable text */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={18}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#3d5a3e]/30 focus:border-[#3d5a3e]"
          />
          {/* Tip */}
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <span className="text-lg leading-none">💡</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              Tip: You can personalise the message to make it more meaningful for your guests.
            </p>
          </div>
        </div>

        {/* Copy button */}
        <div className="px-6 pt-3 pb-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center bg-[#3d5a3e] text-white py-3 rounded-xl hover:bg-[#2d4330] transition"
            title="Copy Invitation"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
