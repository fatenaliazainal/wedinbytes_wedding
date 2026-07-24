import React from "react";
import { Music, Calendar, Heart, MapPin, Phone, MessageSquare, VolumeX } from "lucide-react";
import { type TabKey } from "@/components/DetailPanel";

interface BottomNavProps {
  activeTab: TabKey | null;
  isMuted: boolean;
  onTabClick: (tab: TabKey) => void;
  onRsvpClick: () => void;
  isVisible?: boolean;
  cardMaxWidth?: string;
}

function MusicBars() {
  return (
    <span className="flex items-end gap-0.5 h-4.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.75 rounded-full bg-white"
          style={{
            animation: `musicBar${i} 0.8s ease-in-out infinite alternate`,
            animationDelay: `${(i - 1) * 0.15}s`,
          }}
        />
      ))}
    </span>
  );
}

const NAV_ITEMS: {
  icon: React.ElementType;
  label: string;
  tab?: TabKey;
  isRsvp?: boolean;
}[] = [
  { icon: Music,         label: "Music",      tab: "muzik" },
  { icon: Calendar,      label: "Calendar",   tab: "kalendar" },
  { icon: Heart,         label: "With Love",  tab: "salam" },
  { icon: MapPin,        label: "Location",   tab: "lokasi" },
  { icon: Phone,         label: "Contact",    tab: "hubungi" },
  { icon: MessageSquare, label: "RSVP",       isRsvp: true },
];

export function BottomNav({ activeTab, isMuted, onTabClick, onRsvpClick, isVisible = false, cardMaxWidth = "420px", showRsvp = true }: BottomNavProps & { showRsvp?: boolean }) {
  return (
    <>
      <style>{`
        @keyframes musicBar1 { from { height: 4px } to { height: 14px } }
        @keyframes musicBar2 { from { height: 8px } to { height: 16px } }
        @keyframes musicBar3 { from { height: 5px } to { height: 12px } }
      `}</style>

      <div
        className="w-full flex items-center justify-around px-1 py-2 transition duration-300 ease-out"
        style={{
          maxWidth: cardMaxWidth,
          backgroundColor: "hsl(var(--primary))",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(18px)",
          willChange: "transform, opacity",
          pointerEvents: isVisible ? undefined : "none",
        }}
      >
          {NAV_ITEMS.filter((item) => !item.isRsvp || showRsvp).map((item) => {
            const isMuzik = item.tab === "muzik";
            const isActive = item.tab ? activeTab === item.tab : false;
            const playing = isMuzik && !isMuted;

            return (
              <button
                key={item.label}
                data-testid={`button-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                onClick={() => {
                  if (item.isRsvp) {
                    onRsvpClick();
                  } else if (item.tab) {
                    onTabClick(item.tab);
                  }
                }}
                className="flex flex-col items-center gap-0.5 px-1 py-1 active:scale-90 transition-transform"
                style={{ minWidth: 44 }}
              >
                <div
                  className="flex items-center justify-center w-7.5 h-7.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive || playing ? "rgba(255,255,255,0.25)" : "transparent",
                  }}
                >
                  {isMuzik ? (
                    isMuted ? (
                      <VolumeX size={18} strokeWidth={1.8} color="white" />
                    ) : playing ? (
                      <MusicBars />
                    ) : (
                      <item.icon size={18} strokeWidth={1.8} color="white" />
                    )
                  ) : (
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color="white" />
                  )}
                </div>
                <span
                  className="text-[9px] font-medium leading-tight text-white"
                  style={{ opacity: isActive || playing ? 1 : 0.85 }}
                >
                  {isMuzik ? (isMuted ? "Muted" : "Music") : item.label}
                </span>
              </button>
            );
          })}
        </div>
    </>
  );
}
