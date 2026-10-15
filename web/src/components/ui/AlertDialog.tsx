"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/cn";
import { buttonClass, type ButtonVariant } from "./Button";

export const overlayClass =
  "fixed inset-0 z-[80] bg-black/40 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 dark:bg-black/60 motion-reduce:transition-none";

export const popupMotionClass =
  "transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 motion-reduce:transition-none";

export function AlertDialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange?.(next)}>
      {children}
    </Dialog.Root>
  );
}

export function AlertDialogTrigger(props: ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

export function AlertDialogContent({ size = "default", className, children }: { size?: "sm" | "default"; className?: string; children: ReactNode }) {
  const popup = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={overlayClass} />
      <Dialog.Viewport className="fixed inset-0 z-[81] flex items-center justify-center p-4">
        <Dialog.Popup
          ref={popup}
          role="alertdialog"
          initialFocus={() => popup.current?.querySelector<HTMLElement>("[data-slot=alert-dialog-cancel]") ?? true}
          className={cn(
            "flex max-h-[min(88dvh,720px)] w-full flex-col gap-5 overflow-y-auto rounded-[20px] border border-line bg-elevated p-6 text-text outline-none",
            size === "sm" ? "max-w-[360px]" : "max-w-[480px]",
            popupMotionClass,
            className,
          )}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

export function AlertDialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col items-center gap-3 text-center sm:items-start sm:text-left", className)}>{children}</div>;
}

const mediaTone = {
  danger: "bg-danger/12 text-danger",
  warn: "bg-warn/12 text-warn",
  accent: "bg-accent/12 text-accent",
  link: "bg-link/12 text-link",
};

export function AlertDialogMedia({ tone = "danger", children }: { tone?: keyof typeof mediaTone; children: ReactNode }) {
  return <div className={cn("inline-flex size-14 items-center justify-center rounded-[16px] [&_svg]:size-7", mediaTone[tone])}>{children}</div>;
}

export function AlertDialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <Dialog.Title className={cn("text-[22px] font-semibold leading-tight tracking-[-0.015em]", className)}>{children}</Dialog.Title>;
}

export function AlertDialogDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <Dialog.Description render={<div />} className={cn("flex flex-col gap-3 text-[17px] leading-relaxed text-muted", className)}>{children}</Dialog.Description>;
}

export function AlertDialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}>{children}</div>;
}

export function AlertDialogCancel({ className, children, disabled }: { className?: string; children: ReactNode; disabled?: boolean }) {
  return (
    <Dialog.Close data-slot="alert-dialog-cancel" disabled={disabled} className={buttonClass("outline", "lg", cn("w-full sm:w-auto", className))}>
      {children}
    </Dialog.Close>
  );
}

interface ActionProps {
  variant?: "default" | "destructive";
  loading?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

export function AlertDialogAction({ variant = "default", loading, onClick, className, children }: ActionProps) {
  const style: ButtonVariant = variant === "destructive" ? "destructive" : "primary";
  return (
    <button type="button" onClick={onClick} disabled={loading} aria-busy={loading || undefined} className={buttonClass(style, "lg", cn("w-full sm:w-auto", className))}>
      {loading ? <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  );
}
