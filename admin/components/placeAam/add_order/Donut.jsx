import React from "react";

/**
 * Donut chart with optional center percentage label.
 * segments: [{ label, value, color }]
 * First segment is treated as "Success" for center rate.
 */
export default function Donut({
  size = 96,
  stroke = 12,
  segments = [],
  showCenterRate = false,
  fontSize = 14,           // center text size
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = Math.max(
    0,
    segments.reduce((s, seg) => s + (Number(seg?.value) || 0), 0)
  );

  // Build stroke dash segments
  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const val = Number(seg?.value) || 0;
    const len = total ? (val / total) * circumference : 0;
    const dash = `${len} ${circumference - len}`;
    const style = {
      stroke: seg?.color || "#999",
      strokeDasharray: dash,
      strokeDashoffset: -offset,
    };
    offset += len;
    return <circle key={i} cx={size / 2} cy={size / 2} r={radius} style={style} fill="transparent" strokeWidth={stroke} />;
  });

  // Center label (Success rate)
  let centerLabel = "";
  if (showCenterRate) {
    const success = Number(segments?.[0]?.value || 0);
    const rate = total ? Math.round((success / total) * 100) : 0;
    centerLabel = `${rate}%`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {arcs}
      </g>
      {showCenterRate && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill="#111827"
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}
