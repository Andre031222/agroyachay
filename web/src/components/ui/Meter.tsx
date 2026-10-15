import { cn } from "@/lib/cn";

interface MeterProps {
  value: number;
  max?: number;
  label: string;
  tone?: "accent" | "warn" | "danger" | "link";
  className?: string;
}

export function Meter({ value, max = 100, label, tone = "accent", className }: MeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className={cn("h-2 w-full overflow-hidden rounded-full bg-line/70", className)}>
      <div
        className={cn("h-full rounded-full", tone === "accent" && "bg-accent", tone === "warn" && "bg-warn", tone === "danger" && "bg-danger", tone === "link" && "bg-link")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
