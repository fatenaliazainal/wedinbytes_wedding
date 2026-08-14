import React, { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { MapPin, Phone, Calendar, Music, Volume2, VolumeX, Copy, Download } from "lucide-react";
import { fallbackToR2Proxy, resolveImageUrl } from "@/lib/r2-url";
import { type Invitation } from "@workspace/api-client-react";
import {
  INVITATION_PANEL_CARD_CLASS,
  INVITATION_PANEL_CONTENT_CLASS,
  INVITATION_PANEL_CTA_CLASS,
  INVITATION_PANEL_ICON_CLASS,
  INVITATION_PANEL_SECTION_TITLE_CLASS,
} from "@/components/PanelStyles";
import { BottomSheet } from "@/components/BottomSheet";

export type TabKey = "muzik" | "kalendar" | "lokasi" | "hubungi" | "gift";

export interface RegistryItem {
  id: number;
  name: string;
  url: string | null;
  thumbnailUrl: string | null;
  notes?: string | null;
  sortOrder: number;
}

interface DetailPanelProps {
  activeTab: TabKey | null;
  onClose: () => void;
  invitation?: Invitation;
  isMuted: boolean;
  onToggleMute: () => void;
  musicTitle?: string;
  musicArtist?: string;
  previewMode?: boolean;
  registryItems?: RegistryItem[];
  /** When true the parent container (InvitationPage) handles width + positioning.
   *  The panel renders as a full-width block that slides up from within a flex column
   *  sitting directly above the footer. The backdrop is still fixed/full-screen. */
  inset?: boolean;
}

const nameFont = "var(--name-font-family, 'Dancing Script', serif)";
const bodyFont = "var(--body-font-family, Poppins, sans-serif)";

function OrnamentDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 32"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[220px] text-primary opacity-50 ${className ?? ""}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <g>
        <rect x="15" y="15.5" width="175" height="1"/>
        <rect x="310" y="15.5" width="175" height="1"/>
        <path d="M190 16L198 8L206 16L198 24Z"/>
        <path d="M294 16L302 8L310 16L302 24Z"/>
        <path d="M206 16
                 C218 16 224 10 232 10
                 C240 10 244 16 250 16
                 C256 16 260 10 268 10
                 C276 10 282 16 294 16
                 C282 16 276 22 268 22
                 C260 22 256 16 250 16
                 C244 16 240 22 232 22
                 C224 22 218 16 206 16Z"/>
        <circle cx="250" cy="16" r="2.5"/>
        <circle cx="15" cy="16" r="1.5"/>
        <circle cx="485" cy="16" r="1.5"/>
      </g>
    </svg>
  );
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
    <div className="flex flex-col items-center gap-3.5 py-2">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center relative">
        <Music size={24} className="text-primary" />
        {!isMuted && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping opacity-60" />
        )}
      </div>

      <p className="text-[16px] text-primary text-center" style={{ fontFamily: nameFont }}>Wedding Music</p>
      <OrnamentDivider />

      <div className="w-full bg-background/80 rounded-2xl p-3 border border-primary/10 text-center space-y-1">
        <p className="text-[10px] text-muted-foreground">Theme Song</p>
        <p className="text-[14px] text-primary" style={{ fontFamily: nameFont }}>"{musicTitle ?? "Sempurna"}"</p>
        <p className="text-[10px] text-primary/60">{musicArtist ?? "Andra & The Backbone"}</p>
      </div>

      <div className="w-full flex items-center justify-center gap-3 bg-primary/5 rounded-2xl p-2.5 border border-primary/10">
        <div className="flex items-end gap-[3px] h-4">
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
            <span className="text-[11px] text-muted-foreground italic">Muted</span>
          )}
        </div>
        <p className="text-[12px] text-foreground/70 flex-1">
          {isMuted ? "Music muted" : "Now playing..."}
        </p>
      </div>

      <button
        onClick={onToggleMute}
        data-testid="button-toggle-mute"
        className={`w-full py-2 rounded-full text-[13px] font-semibold tracking-wide shadow flex items-center justify-center gap-2 transition-colors ${
          isMuted
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground border border-primary/20"
        }`}
      >
        {isMuted ? (
          <>
            <Volume2 size={15} /> Unmute Music
          </>
        ) : (
          <>
            <VolumeX size={15} /> Mute Music
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
        <Calendar size={26} className="text-primary" />
      </div>
      <p className={INVITATION_PANEL_SECTION_TITLE_CLASS} style={{ fontFamily: nameFont }}>Event Date</p>
      <OrnamentDivider />
      <div className={`${INVITATION_PANEL_CARD_CLASS} space-y-1`}>
        <p className="text-[9px] tracking-widest text-muted-foreground uppercase" style={{ fontFamily: bodyFont }}>Day</p>
        <p className="font-bold text-[13px] text-primary" style={{ fontFamily: nameFont }}>{invitation?.eventDay}</p>
        <div className="w-10 h-px bg-primary/30 mx-auto" />
        <p className="text-[9px] tracking-widest text-muted-foreground uppercase" style={{ fontFamily: bodyFont }}>Date</p>
        <p className="text-[16px] text-primary" style={{ fontFamily: nameFont }}>{invitation?.eventDate}</p>
        <div className="w-10 h-px bg-primary/30 mx-auto" />
        <p className="text-[9px] tracking-widest text-muted-foreground uppercase" style={{ fontFamily: bodyFont }}>Time</p>
        <p className="text-[12px] text-primary" style={{ fontFamily: nameFont }}>{invitation?.eventTime}</p>
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
  const mapsUrl = invitation?.venueMapUrl || "";
  const wazeUrl = ((invitation as unknown as Record<string, unknown>)?.venueWazeUrl as string) || "";

  return (
    <div className={INVITATION_PANEL_CONTENT_CLASS}>
      <div className={INVITATION_PANEL_ICON_CLASS}>
        <MapPin size={26} className="text-primary" />
      </div>
      <p className={INVITATION_PANEL_SECTION_TITLE_CLASS} style={{ fontFamily: nameFont }}>Event Venue</p>
      <OrnamentDivider />
      <div className={`${INVITATION_PANEL_CARD_CLASS} space-y-1`}>
        <p className="text-[12px] font-bold text-primary" style={{ fontFamily: nameFont }}>
          {invitation?.venueName}
        </p>
        <p className="text-[11px] text-primary/70" style={{ fontFamily: nameFont }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(invitation?.venueAddress) }}
        />
        <p className="text-[11px] text-primary/70" style={{ fontFamily: nameFont }}>
          {invitation?.venueCity}, {invitation?.venueState}
        </p>
      </div>
      {(mapsUrl || wazeUrl) && (
        <div className="flex items-center justify-center gap-2.5 pt-1">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 py-1.5 px-4 rounded-full border border-border bg-background text-xs font-medium text-foreground/80 hover:bg-muted transition-colors"
            >
              <img src="/icons/google-maps.png" alt="" className="w-4 h-4 object-contain" />
              Google Maps
            </a>
          )}
          {wazeUrl && (
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 py-1.5 px-4 rounded-full border border-border bg-background text-xs font-medium text-foreground/80 hover:bg-muted transition-colors"
            >
              <img src="/icons/waze.png" alt="" className="w-4 h-4 object-contain" />
              Waze
            </a>
          )}
        </div>
      )}
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
        <Phone size={26} className="text-primary" />
      </div>
      <p className={INVITATION_PANEL_SECTION_TITLE_CLASS} style={{ fontFamily: nameFont }}>Contact Us</p>
      <OrnamentDivider />

      <div className="w-full space-y-1.5">
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
                <p className="text-[12px] font-semibold text-primary truncate" style={{ fontFamily: nameFont }}>
                  {contact.name || "Contact"}
                </p>
                <p className="text-[11px] text-primary/60 truncate" style={{ fontFamily: bodyFont }}>
                  {contact.phone}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${contact.phone}`}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                  aria-label={`Call ${contact.name}`}
                >
                  <Phone size={14} />
                </a>
                {dial && (
                  <a
                    href={`https://wa.me/${dial}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                    aria-label={`WhatsApp ${contact.name}`}
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
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

function GiftPanel({ invitation, registryItems = [] }: { invitation?: Invitation; registryItems?: RegistryItem[] }) {
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
  const [tempahSet, setTempahSet] = useState<Set<number>>(new Set());
  const [giftTab, setGiftTab] = useState<"qr" | "registry">("qr");
  const data = (invitation ?? {}) as Invitation & Record<string, unknown>;
  const qrCodes = Array.isArray(data.giftQrCodes)
    ? data.giftQrCodes.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, 2)
    : [];
  const accountNumber = typeof data.giftAccountNumber === "string" ? data.giftAccountNumber : "";
  const recipient = typeof data.giftRecipient === "string" ? data.giftRecipient : "";
  const bankName = typeof data.giftBankName === "string" ? data.giftBankName : "";
  const registryRecipientName = typeof data.registryRecipientName === "string" ? data.registryRecipientName : "";
  const registryRecipientAddress = typeof data.registryRecipientAddress === "string" ? data.registryRecipientAddress : "";
  const copyAccount = async () => {
    if (!accountNumber) return;
    await navigator.clipboard?.writeText(accountNumber);
  };

  // ── Tempah Hadiah sub-view ────────────────────────────────────────────────
  if (selectedItem) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSelectedItem(null)}
          className="self-start flex items-center gap-1 text-xs font-medium text-primary/70 hover:text-primary transition-colors"
          style={{ fontFamily: bodyFont }}
        >
          ← Kembali
        </button>
        <div className="text-center">
          <p className="text-xl font-bold text-primary" style={{ fontFamily: nameFont }}>Tempah Hadiah</p>
          <OrnamentDivider />
        </div>
        {selectedItem.thumbnailUrl && (
          <div className="mx-auto w-full max-w-[220px]">
            <img
              src={resolveImageUrl(selectedItem.thumbnailUrl)}
              alt={selectedItem.name}
              onError={(e) => fallbackToR2Proxy(e, selectedItem.thumbnailUrl!)}
              className="w-full rounded-2xl border border-primary/10 object-cover shadow-sm"
            />
          </div>
        )}
        <p className="text-center text-base font-bold text-primary leading-snug" style={{ fontFamily: nameFont }}>
          {selectedItem.name}
        </p>
        {selectedItem.url && (
          <a
            href={selectedItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className={INVITATION_PANEL_CTA_CLASS}
          >
            🔗 Shop Link
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setTempahSet(prev => new Set(prev).add(selectedItem.id));
            setSelectedItem(null);
          }}
          className="w-full rounded-full border border-primary/30 py-2.5 text-sm font-medium text-primary/70 hover:bg-primary/5 transition-colors"
          style={{ fontFamily: bodyFont }}
        >
          ✓ I've Purchased This
        </button>
        {selectedItem.notes && (
          <div className="rounded-xl border border-primary/10 bg-background/60 p-4 space-y-1" style={{ fontFamily: bodyFont }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Nota Tambahan</p>
            <p className="text-[12px] text-primary">{selectedItem.notes}</p>
          </div>
        )}
        {registryRecipientName && (
          <div className="rounded-xl border border-primary/10 bg-background/60 p-4 space-y-1" style={{ fontFamily: bodyFont }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Nama penerima</p>
            <p className="text-[12px] text-primary">{registryRecipientName}</p>
          </div>
        )}
        {registryRecipientAddress && (
          <div className="rounded-xl border border-primary/10 bg-background/60 p-4 space-y-1" style={{ fontFamily: bodyFont }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Alamat Penerima</p>
            <p className="text-[12px] text-primary whitespace-pre-line">{registryRecipientAddress}</p>
          </div>
        )}
      </div>
    );
  }

  const hasMoneyGift = qrCodes.length > 0 || Boolean(recipient) || Boolean(bankName) || Boolean(accountNumber);
  const showTabs = hasMoneyGift && registryItems.length > 0;

  return (
    <div className="flex flex-col items-center gap-3.5 py-1.5">
      {/* ── Tab navigation (only when both sections have content) ── */}
      {showTabs && (
        <div className="flex w-full border-b border-primary/15 -mb-1">
          <button
            type="button"
            onClick={() => setGiftTab("qr")}
            className={`flex-1 pb-2 text-xs font-semibold transition-colors ${giftTab === "qr" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            style={{ fontFamily: bodyFont }}
          >
            QR
          </button>
          <button
            type="button"
            onClick={() => setGiftTab("registry")}
            className={`flex-1 pb-2 text-xs font-semibold transition-colors ${giftTab === "registry" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            style={{ fontFamily: bodyFont }}
          >
            Registry
          </button>
        </div>
      )}

      {/* ── Money Gift ── */}
      {(!showTabs || giftTab === "qr") && (
        <>
          {qrCodes.length > 0 && (
            <div className="flex w-full flex-col items-center gap-3">
              {qrCodes.map((url, index) => (
                <div key={`${url}-${index}`} className="w-full max-w-[220px] text-center">
                  <img src={resolveImageUrl(url)} alt={`Money gift QR ${index + 1}`} onError={(event) => fallbackToR2Proxy(event, url)} className="mx-auto aspect-square w-full rounded-lg border border-primary/10 bg-white p-2 object-contain" />
                  <a href={resolveImageUrl(url)} download={`gift-qr-${index + 1}`} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary">
                    <Download size={13} /> Save QR
                  </a>
                </div>
              ))}
            </div>
          )}
          {(recipient || bankName || accountNumber) && (
            <div className="w-full space-y-1.5 text-center" style={{ fontFamily: bodyFont }}>
              {recipient && <p className="text-[12px] font-semibold text-primary">{recipient}</p>}
              {bankName && <p className="text-[11px] text-primary/60">{bankName}</p>}
              {accountNumber && (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Account Number</p>
                  <p className="text-[12px] font-semibold tracking-wide text-primary">{accountNumber}</p>
                  <button type="button" onClick={() => void copyAccount()} className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">
                    <Copy size={13} /> Copy account number
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Gift Registry items ── */}
      {(!showTabs || giftTab === "registry") && registryItems.length > 0 && (
        <div className="w-full flex flex-col">
          {registryItems.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <hr className="border-primary/10 mx-2" />}
              <div className="flex items-center gap-3 py-3 px-1">
                {item.thumbnailUrl ? (
                  <img
                    src={resolveImageUrl(item.thumbnailUrl)}
                    alt={item.name}
                    onError={(e) => fallbackToR2Proxy(e, item.thumbnailUrl!)}
                    className="h-16 w-16 shrink-0 rounded-xl border border-primary/10 bg-muted object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-muted">
                    <span className="text-2xl">🎁</span>
                  </div>
                )}
                <p className="min-w-0 flex-1 text-[12px] font-medium text-primary leading-snug line-clamp-2" style={{ fontFamily: nameFont }}>
                  {item.name}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTempahSet(prev => new Set(prev).add(item.id));
                    setSelectedItem(item);
                  }}
                  disabled={tempahSet.has(item.id)}
                  className="shrink-0 flex items-center gap-0.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed"
                  style={{
                    fontFamily: bodyFont,
                    borderColor: tempahSet.has(item.id) ? "hsl(var(--primary) / 0.2)" : "hsl(var(--primary) / 0.3)",
                    color: tempahSet.has(item.id) ? "hsl(var(--primary) / 0.45)" : "hsl(var(--primary))",
                    backgroundColor: tempahSet.has(item.id) ? "hsl(var(--primary) / 0.05)" : "transparent",
                  }}
                >
                  {tempahSet.has(item.id) ? "Ditempah ✓" : <>Tempah <span className="ml-0.5 text-primary/60">›</span></>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No content */}
      {!hasMoneyGift && registryItems.length === 0 && (
        <p className="text-[12px] text-muted-foreground">Gift details are not available yet.</p>
      )}
    </div>
  );
}

const PANEL_TITLES: Record<TabKey, string> = {
  muzik: "Music",
  kalendar: "Calendar",
  lokasi: "Location",
  hubungi: "Contact",
  gift: "eGift",
};

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
  registryItems = [],
}: DetailPanelProps) {
  return (
    <BottomSheet
      isOpen={!!activeTab}
      onClose={onClose}
      title={activeTab ? PANEL_TITLES[activeTab] : ""}
      inset={inset}
      previewMode={previewMode}
    >
      {activeTab === "muzik" && (
        <MuzikPanel
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          musicTitle={musicTitle}
          musicArtist={musicArtist}
        />
      )}
      {activeTab === "kalendar" && <KalendarPanel invitation={invitation} />}
      {activeTab === "lokasi" && <LokasiPanel invitation={invitation} />}
      {activeTab === "hubungi" && <HubungiPanel invitation={invitation} />}
      {activeTab === "gift" && (
        <GiftPanel invitation={invitation} registryItems={registryItems} />
      )}
    </BottomSheet>
  );
}
