"use client";

import { useRef, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { overlayClass, popupMotionClass } from "./AlertDialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  placement?: "center" | "sheet";
}

const sheetMotion =
  "transition-[opacity,transform] duration-200 ease-out data-[starting-style]:translate-y-8 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-8 data-[ending-style]:opacity-0 motion-reduce:transition-none";

export function Modal({ open, onClose, title, description, children, footer, size = "md", placement = "center" }: ModalProps) {
  const { t } = useI18n();
  const popup = useRef<HTMLDivElement>(null);
  const sheet = placement === "sheet";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={overlayClass} />
        <Dialog.Viewport className={cn("fixed inset-0 z-[81] flex justify-center", sheet ? "items-end" : "items-center p-4")}>
          <Dialog.Popup
            ref={popup}
            initialFocus={() => popup.current?.querySelector<HTMLElement>("[data-autofocus]") ?? true}
            className={cn(
              "flex w-full flex-col border border-line bg-elevated text-text outline-none",
              sheet ? "max-h-[88dvh] rounded-t-[20px] pb-[env(safe-area-inset-bottom)]" : "max-h-[min(88dvh,820px)] rounded-[20px]",
              !sheet && (size === "xl" ? "sm:max-w-4xl" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"),
              sheet ? sheetMotion : popupMotionClass,
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
              <div>
                <Dialog.Title className="text-[22px] font-semibold tracking-[-0.015em]">{title}</Dialog.Title>
                {description ? <Dialog.Description className="mt-1 text-[15px] text-muted">{description}</Dialog.Description> : null}
              </div>
              <Dialog.Close aria-label={t("common.close")} className="-mr-2 inline-flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-surface">
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
            {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div> : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
