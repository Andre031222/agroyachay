import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "accent" | "warn" | "danger" | "link";

const tones: Record<Tone, string> = {
  neutral: "border-line text-muted",
  accent: "border-accent text-accent",
  warn: "border-warn text-warn",
  danger: "border-danger text-danger",
  link: "border-link text-link",
};

export function Badge({ tone = "neutral", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-[980px] border px-2.5 py-0.5 text-[13px] font-medium leading-5", tones[tone], className)}>
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
