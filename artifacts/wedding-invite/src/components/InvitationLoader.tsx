import React from "react";

/**
 * Shown while the invitation data is fetching.
 * Animation sequence (loops ~2.4 s per cycle):
 *  1. A thin ring strokes itself around the logo (0 → 55 % of cycle)
 *  2. The completed ring holds briefly, then fades (55 → 75 %)
 *  3. Eight short radial lines burst outward from the ring edge and fade (65 → 100 %)
 */

const CX = 50;
const CY = 50;
const RING_R = 34;
const CIRC = 2 * Math.PI * RING_R; // ≈ 213.6

// 8 lines distributed evenly; each lives in its own rotated group.
const ANGLES = Array.from({ length: 8 }, (_, i) => i * 45);

// Line endpoints — pointing "up" in local coordinates; the <g> rotation orients them.
const LINE_INNER_Y = CY - RING_R - 5;  // just outside the ring
const LINE_OUTER_Y = CY - RING_R - 13; // tip of line

const CYCLE = "2.4s";

export function InvitationLoader() {
  return (
    <div className="min-h-dvh w-full bg-background flex flex-col items-center justify-center gap-6">
      {/* keyframes are scoped to this component via a style tag */}
      <style>{`
        @keyframes inv-ring {
          0%   { stroke-dashoffset: ${CIRC.toFixed(1)}; opacity: 1; }
          55%  { stroke-dashoffset: 0;                  opacity: 1; }
          72%  { stroke-dashoffset: 0;                  opacity: 0.6; }
          100% { stroke-dashoffset: 0;                  opacity: 0; }
        }
        @keyframes inv-line {
          0%   { transform: translateY(0);     opacity: 0; }
          62%  { transform: translateY(0);     opacity: 0; }
          73%  { transform: translateY(-3px);  opacity: 0.85; }
          100% { transform: translateY(-11px); opacity: 0; }
        }
      `}</style>

      <div className="relative" style={{ width: 100, height: 100 }}>
        {/* ── SVG layer: ring + burst lines ── */}
        <svg
          width={100}
          height={100}
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="absolute inset-0"
        >
          {/* Completion ring */}
          <circle
            cx={CX}
            cy={CY}
            r={RING_R}
            fill="none"
            stroke="#3d5a3e"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeDasharray={CIRC.toFixed(1)}
            style={{
              animation: `inv-ring ${CYCLE} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
              transformOrigin: `${CX}px ${CY}px`,
              transform: "rotate(-90deg)",
            }}
          />

          {/* Burst lines */}
          {ANGLES.map((deg) => (
            <g
              key={deg}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${deg}deg)`,
              }}
            >
              <line
                x1={CX}
                y1={LINE_INNER_Y}
                x2={CX}
                y2={LINE_OUTER_Y}
                stroke="#3d5a3e"
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{
                  animation: `inv-line ${CYCLE} ease-out infinite`,
                  transformOrigin: `${CX}px ${CY}px`,
                }}
              />
            </g>
          ))}
        </svg>

        {/* ── Logo sits in the centre, never moves ── */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo-wedinbytes.png"
            alt="WedInStudio"
            width={36}
            height={36}
            className="object-contain select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
