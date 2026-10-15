import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "warn" | "danger" | "accent";
  className?: string;
}

export function Stat({ label, value, unit, hint, icon, tone = "default", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-[20px] bg-surface p-5", className)}>
      <div className="flex items-center justify-between gap-2 text-[14px] font-medium text-muted">
        <span>{label}</span>
        {icon ? <span aria-hidden className="text-muted">{icon}</span> : null}
      </div>
      <div
        className={cn(
          "tabular text-[32px] font-semibold leading-none tracking-[-0.02em]",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
          tone === "accent" && "text-accent",
        )}
      >
        {value}
        {unit ? <span className="ml-1 text-[17px] font-medium text-muted">{unit}</span> : null}
      </div>
      {hint ? <div className="text-[14px] text-muted">{hint}</div> : null}
    </div>
  );
}
