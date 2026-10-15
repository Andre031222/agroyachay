interface GaugeProps {
  value: number | undefined;
  scale: [number, number];
  band: [number, number];
  status: "within" | "below" | "above" | "none";
  label: string;
  size?: number;
}

const R = 40;
const CX = 50;
const CY = 50;

function point(t: number) {
  const angle = Math.PI * (1 - Math.max(0, Math.min(1, t)));
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

function arc(t1: number, t2: number) {
  const a = point(t1);
  const b = point(t2);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function Gauge({ value, scale, band, status, label, size = 132 }: GaugeProps) {
  const [lo, hi] = scale;
  const norm = (v: number) => (v - lo) / (hi - lo);
  const marker = value === undefined ? null : point(norm(value));
  const color = status === "within" ? "var(--accent)" : status === "none" ? "var(--muted)" : "var(--danger)";
  return (
    <svg viewBox="0 0 100 58" width={size} height={(size * 58) / 100} role="img" aria-label={label}>
      <path d={arc(0, 1)} fill="none" stroke="var(--line)" strokeWidth="9" strokeLinecap="round" />
      <path d={arc(norm(band[0]), norm(band[1]))} fill="none" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="9" />
      {marker ? <circle cx={marker.x} cy={marker.y} r="6.5" fill={color} stroke="var(--bg)" strokeWidth="2.5" /> : null}
    </svg>
  );
}
