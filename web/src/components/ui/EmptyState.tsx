import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Photo, type PhotoName } from "./Photo";

interface EmptyStateProps {
  title: ReactNode;
  text?: ReactNode;
  photo?: PhotoName;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, text, photo, action, className }: EmptyStateProps) {
  return (
    <div className={cn("grid overflow-hidden rounded-[20px] bg-surface md:grid-cols-2", className)}>
      {photo ? <Photo name={photo} alt="" rounded={false} className="aspect-[16/10] md:aspect-auto md:min-h-64" sizes="(min-width: 768px) 40vw, 100vw" /> : null}
      <div className={cn("flex flex-col justify-center gap-3 p-6 sm:p-8", !photo && "md:col-span-2 items-center text-center")}>
        <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{title}</h2>
        {text ? <p className="max-w-prose text-[17px] leading-relaxed text-muted">{text}</p> : null}
        {action ? <div className="mt-2 flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function InlineEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-[12px] border border-dashed border-line px-4 py-6 text-center text-[15px] text-muted">{children}</p>;
}

export function ErrorNote({ message, action, className }: { message: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-wrap items-center gap-3 rounded-[20px] border border-line bg-bg p-5", className)}>
      <AlertCircle className="size-5 shrink-0 text-danger" aria-hidden />
      <p className="min-w-0 flex-1 text-[17px]">{message}</p>
      {action}
    </div>
  );
}
