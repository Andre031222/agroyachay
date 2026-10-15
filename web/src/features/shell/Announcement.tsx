"use client";

import { useSyncExternalStore } from "react";
import { Megaphone, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const KEY = "agroyachay.announcement.dismissed";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dismiss(text: string) {
  try {
    window.localStorage.setItem(KEY, text);
  } catch {
    return;
  } finally {
    listeners.forEach((listener) => listener());
  }
}

export function Announcement({ text }: { text: string }) {
  const { t } = useI18n();
  const dismissed = useSyncExternalStore(subscribe, read, () => text);
  if (!text || dismissed === text) return null;
  return (
    <div
      role="status"
      className="no-print pop-in fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-start gap-3 rounded-[16px] border border-line bg-elevated py-2 pl-4 pr-1.5 lg:inset-x-auto lg:bottom-6 lg:right-6"
    >
      <Megaphone className="mt-3 size-4 shrink-0 text-accent" aria-hidden />
      <p className="min-w-0 flex-1 py-2.5 text-[15px] leading-snug">{text}</p>
      <button
        type="button"
        onClick={() => dismiss(text)}
        aria-label={t("common.close")}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text"
      >
        <X className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
