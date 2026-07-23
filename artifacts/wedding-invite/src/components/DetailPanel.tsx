import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Calendar, Heart, Music, Volume2, VolumeX } from "lucide-react";
import { type Invitation } from "@workspace/api-client-react";

type TabKey = "muzik" | "kalendar" | "salam" | "lokasi" | "hubungi";

interface DetailPanelProps {
  activeTab: TabKey | null;
  onClose: () => void;
  invitation?: Invitation;
  isMuted: boolean;
  onToggleMute: () => void;
  musicTitle?: string;
  musicArtist?: string;
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

      <p className="font-serif text-2xl text-primary text-center">Wedding Music</p>

      <div className="w-full bg-background/80 rounded-2xl p-4 border border-primary/10 text-center space-y-2">
        <p className="text-xs text-muted-foreground">Theme Song</p>
        <p className="font-serif text-lg text-foreground">"{musicTitle ?? "Sempurna"}"</p>
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
  const mapsCalUrl = invitation
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Wedding+Ceremony+${encodeURIComponent(invitation.brideName + " & " + invitation.groomName)}&location=${encodeURIComponent(invitation.venueName + ", " + invitation.venueCity)}&details=Wedding+Reception`
    : "#";

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Calendar size={36} className="text-primary" />
      </div>
      <p className="font-serif text-2xl text-primary text-center">Event Date</p>
      <div className="w-full bg-background/80 rounded-2xl p-5 border border-primary/10 text-center space-y-3">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Day</p>
        <p className="font-bold text-xl text-foreground">{invitation?.eventDay}</p>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Date</p>
        <p className="font-serif text-2xl text-primary">{invitation?.eventDate}</p>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Time</p>
        <p className="text-foreground">{invitation?.eventTime}</p>
      </div>
      <a
        href={mapsCalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold text-center tracking-wide shadow"
      >
        Save to Calendar
      </a>
    </div>
  );
}

function SalamPanel() {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Heart size={36} className="text-primary" />
      </div>
      <p className="font-serif text-2xl text-primary text-center">With Love</p>
      <div className="w-full bg-background/80 rounded-2xl p-5 border border-primary/10 text-center space-y-3">
        <p className="text-sm text-foreground/80 leading-relaxed italic">
          "With heartfelt gratitude, we joyfully invite you
          to celebrate our wedding."
        </p>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
        <p className="font-serif text-lg text-primary">Ain &amp; Hidayat</p>
        <p className="text-xs text-muted-foreground">Together with family</p>
      </div>
      <div className="w-full bg-secondary/50 rounded-2xl p-4 border border-primary/10 text-center">
        <p className="text-xs text-muted-foreground mb-1">Dress Code</p>
        <p className="text-sm font-semibold text-foreground">
          Hijau Sage &amp; Pink
        </p>
      </div>
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
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <MapPin size={36} className="text-primary" />
      </div>
      <p className="font-serif text-2xl text-primary text-center">Event Venue</p>
      <div className="w-full bg-background/80 rounded-2xl p-5 border border-primary/10 text-center space-y-2">
        <p className="font-bold text-base text-foreground">
          {invitation?.venueName}
        </p>
        <p className="text-sm text-muted-foreground">{invitation?.venueAddress}</p>
        <p className="text-sm text-muted-foreground">
          {invitation?.venueCity}, {invitation?.venueState}
        </p>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold text-center tracking-wide shadow"
      >
        Open in Google Maps
      </a>
    </div>
  );
}

function HubungiPanel({ invitation }: { invitation?: Invitation }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Phone size={36} className="text-primary" />
      </div>
      <p className="font-serif text-2xl text-primary text-center">Contact Us</p>
      <div className="w-full bg-background/80 rounded-2xl p-5 border border-primary/10 text-center space-y-4">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase mb-1">
            Couple's Line
          </p>
          <p className="font-bold text-lg text-foreground">
            {invitation?.contactPhone}
          </p>
        </div>
      </div>
      <a
        href={`tel:${invitation?.contactPhone}`}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold text-center tracking-wide shadow"
      >
        Call Now
      </a>
      <a
        href={`https://wa.me/${invitation?.contactPhone?.replace(/\D/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold text-center tracking-wide shadow border border-primary/20"
      >
        WhatsApp
      </a>
    </div>
  );
}

const PANEL_TITLES: Record<TabKey, string> = {
  muzik: "Music",
  kalendar: "Calendar",
  salam: "With Love",
  lokasi: "Location",
  hubungi: "Contact",
};

export function DetailPanel({
  activeTab,
  onClose,
  invitation,
  isMuted,
  onToggleMute,
  musicTitle,
  musicArtist,
}: DetailPanelProps) {
  return (
    <AnimatePresence>
      {activeTab && (
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
            <div className="w-full max-w-[420px] bg-card rounded-t-3xl shadow-2xl border border-primary/10 border-b-0 p-6 pb-28">
              <div className="flex items-center justify-between mb-6">
                <p className="font-serif text-lg text-primary">
                  {PANEL_TITLES[activeTab]}
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
              {activeTab === "salam" && <SalamPanel />}
              {activeTab === "lokasi" && <LokasiPanel invitation={invitation} />}
              {activeTab === "hubungi" && (
                <HubungiPanel invitation={invitation} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export type { TabKey };
