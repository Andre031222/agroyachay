import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "surface" | "outline" | "elevated";
  padded?: boolean;
}

export function Card({ tone = "surface", padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px]",
        tone === "surface" && "bg-surface",
        tone === "outline" && "border border-line bg-bg",
        tone === "elevated" && "border border-line bg-elevated",
        padded && "p-5 sm:p-6",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
        {description ? <p className="mt-1 text-[15px] text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
