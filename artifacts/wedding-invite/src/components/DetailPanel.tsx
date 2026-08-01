import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Calendar, Music, Volume2, VolumeX, Copy, Download } from "lucide-react";
import { fallbackToR2Proxy, resolveImageUrl } from "@/lib/r2-url";
import { type Invitation } from "@workspace/api-client-react";
import {
  INVITATION_PANEL_CARD_CLASS,
  INVITATION_PANEL_CLASS,
  INVITATION_PANEL_CONTENT_CLASS,
  INVITATION_PANEL_CTA_CLASS,
  INVITATION_PANEL_HEADER_CLASS,
  INVITATION_PANEL_ICON_CLASS,
  INVITATION_PANEL_SECTION_TITLE_CLASS,
  INVITATION_PANEL_TITLE_CLASS,
} from "@/components/PanelStyles";

export type TabKey = "muzik" | "kalendar" | "lokasi" | "hubungi" | "gift";

interface DetailPanelProps {
  activeTab: TabKey | null;
  onClose: () => void;
  invitation?: Invitation;
  isMuted: boolean;
  onToggleMute: () => void;
  musicTitle?: string;
  musicArtist?: string;
  previewMode?: boolean;
  /** When true the parent container (InvitationPage) handles width + positioning.
   *  The panel renders as a full-width block that slides up from within a flex column
   *  sitting directly above the footer. The backdrop is still fixed/full-screen. */
  inset?: boolean;
}
function MuzikPanel({
  isMuted,
  onToggleMute,
  musicTitle,
  musicArtist,
}: {
  isMuted: boolean;
  onToggleMute: () => void;
  musicTitle?: string;
  musicArtist?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
        <Music size={36} className="text-primary" />
        {!isMuted && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-ping opacity-60" />
        )}
      </div>

      <p className="text-2xl text-primary text-center" style={{ fontFamily: nameFont }}>Wedding Music</p>

      <div className="w-full bg-background/80 rounded-2xl p-4 border border-primary/10 text-center space-y-2">
        <p className="text-xs text-muted-foreground">Theme Song</p>
        <p className="text-lg text-foreground" style={{ fontFamily: nameFont }}>"{musicTitle ?? "Sempurna"}"</p>
        <p className="text-xs text-muted-foreground">{musicArtist ?? "Andra & The Backbone"}</p>
      </div>

      <div className="w-full flex items-center justify-center gap-3 bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <div className="flex items-end gap-[3px] h-6">
          {!isMuted &&
            [1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary"
                style={{
                  animation: `musicBar${(i % 3) + 1} 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${(i - 1) * 0.12}s`,
                }}
              />
            ))}
          {isMuted && (
            <span className="text-xs text-muted-foreground italic">Muted</span>
          )}
        </div>
        <p className="text-sm text-foreground/70 flex-1">
          {isMuted ? "Music muted" : "Now playing..."}
        </p>
      </div>

      <button
        onClick={onToggleMute}
        data-testid="button-toggle-mute"
        className={`w-full py-3 rounded-full text-sm font-semibold tracking-wide shadow flex items-center justify-center gap-2 transition-colors ${
          isMuted
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground border border-primary/20"
        }`}
      >
        {isMuted ? (
          <>
            <Volume2 size={16} /> Unmute Music
          </>
        ) : (
          <>
            <VolumeX size={16} /> Mute Music
          </>
        )}
      </button>
    </div>
  );
}
function KalendarPanel({ invitation }: { invitation?: Invitation }) {
  const calendarInvitation = invitation as (Invitation & {
    eventStartTime?: string | null;
    eventEndTime?: string | null;
    brideShortName?: string | null;
    groomShortName?: string | null;
    invitationText?: string | null;
  }) | undefined;
  const calendarDate = calendarInvitation?.eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const calendarDateCode = calendarDate
    ? `${calendarDate[1]}${calendarDate[2]}${calendarDate[3]}`
    : "";
  const timeCode = (value?: string | null) => {
    const match = value?.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}${match[2]}00` : "";
  };
  const startTime = timeCode(calendarInvitation?.eventStartTime);
  const endTime = timeCode(calendarInvitation?.eventEndTime);
  const calendarDates = calendarDateCode
    ? startTime
      ? `${calendarDateCode}T${startTime}/${calendarDateCode}T${endTime || startTime}`
      : `${calendarDateCode}/${calendarDateCode}`
    : "";
  const calendarTitle = calendarInvitation
    ? `Wedding Ceremony ${calendarInvitation.brideName || calendarInvitation.brideShortName || ""} & ${calendarInvitation.groomName || calendarInvitation.groomShortName || ""}`.replace(/\s+/g, " ").trim()
    : "Wedding Ceremony";
  const mapsCalUrl = calendarInvitation && calendarDates
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarTitle)}&dates=${calendarDates}&location=${encodeURIComponent([calendarInvitation.venueName, calendarInvitation.venueCity].filter(Boolean).join(", "))}&details=${encodeURIComponent(calendarInvitation.invitationText || "Wedding Reception")}`
    : "#";

  return (
    <div className={INVITATION_PANEL_CONTENT_CLASS}>
      <div className={INVITATION_PANEL_ICON_CLASS}>
        <Calendar size={32} className="text-primary" />
      </div>
      <p className={INVITATION_PANEL_SECTION_TITLE_CLASS} style={{ fontFamily: nameFont }}>Event Date</p>
      <div className={`${INVITATION_PANEL_CARD_CLASS} space-y-1`}>
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase" style={{ fontFamily: bodyFont }}>Day</p>
        <p className="font-bold text-base text-foreground" style={{ fontFamily: bodyFont }}>{invitation?.eventDay}</p>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase" style={{ fontFamily: bodyFont }}>Date</p>
        <p className="text-[19px] text-primary" style={{ fontFamily: nameFont }}>{invitation?.eventDate}</p>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase" style={{ fontFamily: bodyFont }}>Time</p>
        <p className="text-[13px] text-foreground" style={{ fontFamily: bodyFont }}>{invitation?.eventTime}</p>
      </div>
      <a
        href={mapsCalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={INVITATION_PANEL_CTA_CLASS}
      >
        Save to Calendar
      </a>
    </div>
  );
}
function LokasiPanel({ invitation }: { invitation?: Invitation }) {
  const mapsUrl =
    invitation?.venueMapUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(
      (invitation?.venueName ?? "") + " " + (invitation?.venueCity ?? "")
    )}`;

  return (
    <div className={INVITATION_PANEL_CONTENT_CLASS}>
      <div className={INVITATION_PANEL_ICON_CLASS}>
        <MapPin size={32} className="text-primary" />
      </div>
      <p className={INVITATION_PANEL_SECTION_TITLE_CLASS} style={{ fontFamily: nameFont }}>Event Venue</p>
      <div className={`${INVITATION_PANEL_CARD_CLASS} space-y-1`}>
        <p className="text-sm font-bold text-foreground">
          {invitation?.venueName}
        </p>
        <p className="text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: invitation?.venueAddress || "" }}
        />
        <p className="text-xs text-muted-foreground">
          {invitation?.venueCity}, {invitation?.venueState}
        </p>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={INVITATION_PANEL_CTA_CLASS}
      >
        Open in Google Maps
      </a>
    </div>
  );
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.009-.57-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function normalizeContacts(raw: unknown, fallbackPhone?: string): { name: string; phone: string }[] {
  const parsed = Array.isArray(raw)
    ? raw
        .filter((c): c is { name?: unknown; phone?: unknown } => c && typeof c === "object")
        .map((c) => ({ name: String(c.name ?? ""), phone: String(c.phone ?? "") }))
    : [];
  if (parsed.length > 0) return parsed;
  if (fallbackPhone) return [{ name: "Contact", phone: fallbackPhone }];
  return [];
}

function HubungiPanel({ invitation }: { invitation?: Invitation }) {
  const contacts = normalizeContacts(
    (invitation as unknown as Record<string, unknown>)?.contacts,
    invitation?.contactPhone,
  );

  return (
    <div className={INVITATION_PANEL_CONTENT_CLASS}>
      <div className={INVITATION_PANEL_ICON_CLASS}>
        <Phone size={32} className="text-primary" />
      </div>
      <p className={INVITATION_PANEL_SECTION_TITLE_CLASS} style={{ fontFamily: nameFont }}>Contact Us</p>

      <div className="w-full space-y-2">
        {contacts.length === 0 && (
          <div className={`${INVITATION_PANEL_CARD_CLASS} text-xs text-muted-foreground`}>
            No contact information available.
          </div>
        )}

        {contacts.map((contact, idx) => {
          const dial = contact.phone?.replace(/\D/g, "");
          return (
            <div
              key={idx}
              className={`${INVITATION_PANEL_CARD_CLASS} flex items-center justify-between gap-2`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate" style={{ fontFamily: bodyFont }}>
                  {contact.name || "Contact"}
                </p>
                <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: bodyFont }}>
                  {contact.phone}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${contact.phone}`}
                  className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                  aria-label={`Call ${contact.name}`}
                >
                  <Phone size={16} />
                </a>
                {dial && (
                  <a
                    href={`https://wa.me/${dial}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                    aria-label={`WhatsApp ${contact.name}`}
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GiftPanel({ invitation }: { invitation?: Invitation }) {
  const data = (invitation ?? {}) as Invitation & Record<string, unknown>;
  const qrCodes = Array.isArray(data.giftQrCodes)
    ? data.giftQrCodes.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, 2)
    : [];
  const accountNumber = typeof data.giftAccountNumber === "string" ? data.giftAccountNumber : "";
  const title = typeof data.giftTitle === "string" && data.giftTitle.trim() ? data.giftTitle : "SALAM KASIH";
  const recipient = typeof data.giftRecipient === "string" ? data.giftRecipient : "";
  const bankName = typeof data.giftBankName === "string" ? data.giftBankName : "";
  const copyAccount = async () => {
    if (!accountNumber) return;
    await navigator.clipboard?.writeText(accountNumber);
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <p className="text-2xl text-primary text-center" style={{ fontFamily: nameFont }}>{title}</p>
      <div className="h-px w-16 bg-primary/30" />
      {qrCodes.length > 0 && (
        <div className="flex w-full flex-col items-center gap-4">
          {qrCodes.map((url, index) => (
            <div key={`${url}-${index}`} className="w-full max-w-[250px] text-center">
              <img src={resolveImageUrl(url)} alt={`Money gift QR ${index + 1}`} onError={(event) => fallbackToR2Proxy(event, url)} className="mx-auto aspect-square w-full rounded-lg border border-primary/10 bg-white p-2 object-contain" />
              <a href={resolveImageUrl(url)} download={`gift-qr-${index + 1}`} className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2 text-xs font-semibold text-primary">
                <Download size={14} /> Save QR
              </a>
            </div>
          ))}
        </div>
      )}
      {(recipient || bankName || accountNumber) && (
        <div className="w-full space-y-2 text-center" style={{ fontFamily: bodyFont }}>
          {recipient && <p className="text-base font-semibold text-foreground">{recipient}</p>}
          {bankName && <p className="text-sm text-muted-foreground">{bankName}</p>}
          {accountNumber && (
            <>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Account Number</p>
              <p className="text-base font-semibold tracking-wide text-foreground">{accountNumber}</p>
              <button type="button" onClick={() => void copyAccount()} className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                <Copy size={14} /> Copy account number
              </button>
            </>
          )}
        </div>
      )}
      {!accountNumber && qrCodes.length === 0 && <p className="text-sm text-muted-foreground">Gift details are not available yet.</p>}
    </div>
  );
}

const PANEL_TITLES: Record<TabKey, string> = {
  muzik: "Music",
  kalendar: "Calendar",
  lokasi: "Location",
  hubungi: "Contact",
  gift: "Salam Kasih",
};

const nameFont = "var(--name-font-family, 'Dancing Script', serif)";
const bodyFont = "var(--body-font-family, Poppins, sans-serif)";

export function DetailPanel({
  activeTab,
  onClose,
  invitation,
  isMuted,
  onToggleMute,
  musicTitle,
  musicArtist,
  previewMode,
  inset,
}: DetailPanelProps) {
  const isCompactPanel = activeTab === "kalendar" || activeTab === "lokasi" || activeTab === "hubungi";
  // In inset mode the parent container already constrains width to the invitation width,
  // so we drop the max-w-* constraints so the panel fills it exactly.
  const compactPanelClass = inset
    ? INVITATION_PANEL_CLASS.replace(" max-w-[340px]", "")
    : INVITATION_PANEL_CLASS;
  const nonCompactPanelClass = inset
    ? "w-full rounded-t-3xl border border-primary/10 border-b-0 bg-card p-6 pb-6 shadow-2xl"
    : "w-full max-w-[420px] rounded-t-3xl border border-primary/10 border-b-0 bg-card p-6 pb-6 shadow-2xl";
  const panelContent = (
    <div className={isCompactPanel ? compactPanelClass : nonCompactPanelClass}>
      <div className={isCompactPanel ? INVITATION_PANEL_HEADER_CLASS : "mb-6 flex items-center justify-between"}>
        <p className={isCompactPanel ? INVITATION_PANEL_TITLE_CLASS : "text-lg text-primary"} style={{ fontFamily: nameFont }}>
          {activeTab ? PANEL_TITLES[activeTab] : ""}
        </p>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-close-panel"
        >
          <X size={16} />
        </button>
      </div>

      {activeTab === "muzik" && (
        <MuzikPanel
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          musicTitle={musicTitle}
          musicArtist={musicArtist}
        />
      )}
      {activeTab === "kalendar" && (
        <KalendarPanel invitation={invitation} />
      )}
      {activeTab === "lokasi" && <LokasiPanel invitation={invitation} />}
      {activeTab === "hubungi" && (
        <HubungiPanel invitation={invitation} />
      )}
      {activeTab === "gift" && <GiftPanel invitation={invitation} />}
    </div>
  );

  if (!activeTab) return null;

  // Preview mode: skip framer-motion animations to avoid clipping issues
  // inside the editor's scaled phone frame.
  if (previewMode) {
    return (
      <>
        <div
          className="absolute inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
        <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center">
          {panelContent}
        </div>
      </>
    );
  }

  // Inset mode: the parent (InvitationPage) renders this inside a fixed bottom-0
  // container that is already constrained to the invitation width. The panel sits
  // as a flex-column child directly above the footer — no fixed positioning needed
  // on the panel itself. The backdrop is still fixed/full-screen.
  if (inset) {
    return (
      <AnimatePresence>
        <>
          <motion.div
            key="backdrop-inset"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            key="panel-inset"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full relative z-50"
          >
            {panelContent}
          </motion.div>
        </>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          key="panel"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        >
          {panelContent}
        </motion.div>
      </>
    </AnimatePresence>
  );
}

