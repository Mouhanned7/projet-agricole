import { cn } from "@/lib/utils";

/**
 * Visuel de remplacement (oliveraie stylisée) tant que les vraies photos
 * des terrains ne sont pas téléversées. `hue` varie légèrement la lumière.
 */
export function LandVisual({ hue = 0, className, seed = 1 }: { hue?: number; className?: string; seed?: number }) {
  const trees = Array.from({ length: 9 }, (_, i) => {
    const r = Math.sin(seed * 97 + i * 13.7) * 0.5 + 0.5;
    return { x: 20 + i * 45 + r * 18, y: 150 + (i % 3) * 16 + r * 8, s: 0.75 + (i % 3) * 0.2 + r * 0.15 };
  });
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-full w-full", className)}
      style={{ filter: `hue-rotate(${hue}deg)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfd8c9" />
          <stop offset="1" stopColor="#f0dfb4" />
        </linearGradient>
        <linearGradient id={`field-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9a462" />
          <stop offset="1" stopColor="#7d7a3e" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#sky-${seed})`} />
      <path d="M0 110 Q80 70 170 100 T400 85 V240 H0Z" fill="#8e9a6c" opacity="0.7" />
      <path d="M0 130 Q120 105 230 125 T400 118 V240 H0Z" fill="#6f8150" opacity="0.85" />
      <path d="M0 150 Q150 135 400 148 V240 H0Z" fill={`url(#field-${seed})`} />
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
          <rect x="-2" y="-4" width="4" height="16" rx="1.5" fill="#4b3a26" />
          <ellipse cx="0" cy="-14" rx="20" ry="14" fill="#3f5a2e" />
          <ellipse cx="-8" cy="-18" rx="11" ry="9" fill="#5b7a3a" />
          <ellipse cx="8" cy="-12" rx="10" ry="8" fill="#4d6b34" />
        </g>
      ))}
    </svg>
  );
}
