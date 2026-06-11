"use client";

/** Gradient SVG progress ring showing % of income kept. */
export default function Ring({
  pct,
  size = 84,
}: {
  pct: number;
  size?: number;
}) {
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const dash = (clamped / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B7CFF" />
          <stop offset="1" stopColor="#5B8CFF" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#232A3F"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 500ms ease" }}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#EDEFF7"
        style={{
          font: `600 ${size * 0.21}px var(--font-spline-mono), monospace`,
        }}
      >
        {Math.round(clamped)}%
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#8A91A8"
        style={{
          font: `400 ${size * 0.1}px var(--font-spline-mono), monospace`,
          letterSpacing: "0.08em",
        }}
      >
        KEPT
      </text>
    </svg>
  );
}
