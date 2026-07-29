import React from "react";
import { type Invitation, type CardDesign } from "@workspace/api-client-react";

interface CardThumbnailProps {
  invitation: Invitation;
  design: CardDesign;
  containerWidth?: number;
}

const INNER_W = 320;
const INNER_H = Math.round((INNER_W * 4) / 3);
import { fallbackToR2Proxy, resolveImageUrl } from "@/lib/r2-url";

export function CardThumbnail({ invitation, design, containerWidth = 220 }: CardThumbnailProps) {
  const scale = containerWidth / INNER_W;
  const primary = design.colorPrimary ? `hsl(${design.colorPrimary})` : "#6b7c4e";
  const bg = design.colorBackground ? `hsl(${design.colorBackground})` : "#f4f7ee";
  const secondary = design.colorSecondary ? `hsl(${design.colorSecondary})` : "#e8f0de";
  const headingFont = design.fontHeading ?? "Playfair Display";
  const bodyFont = design.fontBody ?? "Lato";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div
        style={{
          width: INNER_W,
          height: INNER_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundColor: bg,
          position: "relative",
          fontFamily: bodyFont + ", sans-serif",
          overflow: "hidden",
        }}
      >
        {design.cardImageUrl ? (
          <img
            src={resolveImageUrl(design.cardImageUrl)}
            alt=""
            onError={(e) => fallbackToR2Proxy(e, design.cardImageUrl)}
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
            dangerouslySetInnerHTML={{ __html: invitation.eventType || "" }}
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
            {invitation.brideName}
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
            {invitation.groomName}
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
              {invitation.eventDay}
            </p>
            <p
              style={{
                fontFamily: headingFont + ", serif",
                fontSize: 13,
                color: "#2d2d2d",
                marginBottom: 3,
              }}
            >
              {invitation.eventDate}
            </p>
            <p style={{ fontSize: 7, color: "rgba(0,0,0,0.6)" }}>{invitation.eventTime}</p>
          </div>

          <div style={{ width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: primary, marginBottom: 2 }}>
              {invitation.venueName}
            </p>
            <p style={{ fontSize: 7, color: "rgba(0,0,0,0.6)", lineHeight: 1.4 }}>
              {invitation.venueCity}, {invitation.venueState}
            </p>
          </div>

          {invitation.dresscode && (
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
              Tema: {invitation.dresscode}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
