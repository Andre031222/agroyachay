"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "./AlertDialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  itemName: string;
  message: ReactNode;
  confirmLabel: string;
  icon?: ReactNode;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, itemName, message, confirmLabel, icon, busy, onConfirm, onClose }: ConfirmDialogProps) {
  const { t } = useI18n();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia tone="danger">{icon ?? <Trash2 aria-hidden />}</AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <span className="block break-words rounded-[12px] border border-line bg-surface px-4 py-3 text-[18px] font-semibold text-text">{itemName}</span>
          <span className="block text-text">{message}</span>
          <span className="block text-[15px]">{t("confirm.cannot_undo")}</span>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
