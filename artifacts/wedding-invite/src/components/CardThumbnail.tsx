import React from "react";
import { type Invitation, type CardDesign } from "@workspace/api-client-react";

interface CardThumbnailProps {
  invitation: Invitation;
  design: CardDesign;
  containerWidth?: number;
}

const INNER_W = 320;
const INNER_H = Math.round((INNER_W * 4) / 3);
import { resolveImageUrl } from "@/lib/r2-url";

export function CardThumbnail({ invitation, design, containerWidth = 220 }: CardThumbnailProps) {
  const scale = containerWidth / INNER_W;
  const primary = design.colorPrimary ? `hsl(${design.colorPrimary})` : "#6b7c4e";
  const bg = design.colorBackground ? `hsl(${design.colorBackground})` : "#f4f7ee";
  const secondary = design.colorSecondary ? `hsl(${design.colorSecondary})` : "#e8f0de";
  const headingFont = design.fontHeading ?? "Playfair Display";
  const bodyFont = design.fontBody ?? "Lato";
  const demoEventType = invitation.eventType?.trim() || "Walimatul Urus";
  const demoBrideName = invitation.brideName?.trim() === "Nama Pengantin Perempuan"
    ? "Ain"
    : invitation.brideName?.trim() || "Ain";
  const demoGroomName = invitation.groomName?.trim() === "Nama Pengantin Lelaki"
    ? "Hidayat"
    : invitation.groomName?.trim() || "Hidayat";
  const demoEventDay = invitation.eventDay?.trim() || "Sabtu";
  const demoEventDate = invitation.eventDate?.trim() || "15 November 2025";
  const demoEventTime = invitation.eventTime?.trim() || "11:00 pagi – 3:00 petang";
  const demoVenueName = invitation.venueName?.trim() || "Dewan Seri Cahaya";
  const demoVenueCity = invitation.venueCity?.trim() || "Shah Alam";
  const demoVenueState = invitation.venueState?.trim() || "Selangor";
  const demoDresscode = invitation.dresscode?.trim() || "Hijau Sage & Pink";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {design.thumbnailImageUrl ? (
        <img
          src={resolveImageUrl(design.thumbnailImageUrl)}
          alt=""
          draggable={false}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ) : null}
      <div
        style={{
          width: INNER_W,
          height: INNER_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundColor: bg,
          position: "relative",
          zIndex: 1,
          fontFamily: bodyFont + ", sans-serif",
          overflow: "hidden",
        }}
      >
        {design.cardImageUrl ? (
          <img
            src={resolveImageUrl(design.cardImageUrl)}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundColor: secondary }} />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.28)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "28px 22px 20px",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.28em",
              color: primary,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
            dangerouslySetInnerHTML={{ __html: demoEventType }}
          />

          <h1
            style={{
              fontFamily: headingFont + ", serif",
              fontSize: 28,
              color: "#2d2d2d",
              margin: "0 0 2px",
              lineHeight: 1.15,
              textShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}
          >
            {demoBrideName}
          </h1>
          <span
            style={{
              fontFamily: headingFont + ", serif",
              fontSize: 16,
              color: primary,
              lineHeight: 1,
            }}
          >
            &amp;
          </span>
          <h1
            style={{
              fontFamily: headingFont + ", serif",
              fontSize: 28,
              color: "#2d2d2d",
              margin: "2px 0 12px",
              lineHeight: 1.15,
              textShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}
          >
            {demoGroomName}
          </h1>

          <div
            style={{
              width: 44,
              height: 1,
              backgroundColor: primary + "80",
              marginBottom: 12,
            }}
          />

          <p style={{ fontSize: 7, color: "rgba(0,0,0,0.55)", marginBottom: 8, lineHeight: 1.5 }}>
            With heartfelt gratitude,
          </p>

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.65)",
              borderRadius: 12,
              padding: "10px 14px",
              border: `1px solid ${primary}26`,
              width: "100%",
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: primary,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                marginBottom: 3,
              }}
            >
              {demoEventDay}
            </p>
            <p
              style={{
                fontFamily: headingFont + ", serif",
                fontSize: 13,
                color: "#2d2d2d",
                marginBottom: 3,
              }}
            >
              {demoEventDate}
            </p>
            <p style={{ fontSize: 7, color: "rgba(0,0,0,0.6)" }}>{demoEventTime}</p>
          </div>

          <div style={{ width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: primary, marginBottom: 2 }}>
              {demoVenueName}
            </p>
            <p style={{ fontSize: 7, color: "rgba(0,0,0,0.6)", lineHeight: 1.4 }}>
              {demoVenueCity}, {demoVenueState}
            </p>
          </div>

          {(demoDresscode || invitation.dresscodeTheme || (Array.isArray(invitation.dresscodeColors) && invitation.dresscodeColors.length > 0)) && (
            <div
              style={{
                marginTop: 10,
                fontSize: 6.5,
                color: "rgba(0,0,0,0.5)",
                border: `1px solid ${primary}40`,
                borderRadius: 99,
                padding: "3px 10px",
                backgroundColor: "rgba(255,255,255,0.45)",
              }}
            >
              Tema: {invitation.dresscodeTheme || demoDresscode}
              {Array.isArray(invitation.dresscodeColors) && invitation.dresscodeColors.length > 0 && (
                <span style={{ display: "inline-flex", gap: 3, marginLeft: 6, verticalAlign: "middle" }}>
                  {invitation.dresscodeColors.slice(0, 4).map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: color, display: "inline-block", border: "1px solid rgba(255,255,255,0.8)" }}
                    />
                  ))}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
