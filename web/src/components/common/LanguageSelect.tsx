"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/cn";

const NATIVE: Record<Locale, string> = { es: "Español", qu: "Runasimi", ay: "Aymar aru", en: "English" };

function Code({ locale, active }: { locale: Locale; active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-5 min-w-7 items-center justify-center rounded-[6px] border px-1 font-mono text-[11px] font-semibold uppercase",
        active ? "border-accent text-accent" : "border-line text-muted",
      )}
    >
      {locale}
    </span>
  );
}

export function LanguageSelect({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) options.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    setLocale(next);
    if (user && user.locale !== next) api.updateMe({ locale: next }).then(setUser, () => undefined);
  };

  const onListKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setFocusIndex((index) => (index + (event.key === "ArrowDown" ? 1 : LOCALES.length - 1)) % LOCALES.length);
    }
  };

  return (
    <div ref={wrapper} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${t("lang.label")}: ${NATIVE[locale]}`}
        onClick={() => {
          setFocusIndex(Math.max(0, LOCALES.indexOf(locale)));
          setOpen((value) => !value);
        }}
        className="top-control px-3"
      >
        <Globe className="size-[17px]" aria-hidden />
        <span aria-hidden className="font-mono text-[13px] font-semibold uppercase tracking-[0.02em]">
          {locale}
        </span>
      </button>
      {open ? (
        <ul
          id={id}
          role="listbox"
          aria-label={t("lang.label")}
          onKeyDown={onListKey}
          className="pop-in absolute right-0 top-[52px] z-50 w-56 rounded-[16px] border border-line bg-elevated p-1.5"
        >
          {LOCALES.map((value, index) => {
            const selected = value === locale;
            return (
              <li key={value} role="presentation">
                <button
                  ref={(node) => {
                    options.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  lang={value}
                  onClick={() => choose(value)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[15px] hover:bg-surface focus-visible:bg-surface"
                >
                  <Code locale={value} active={selected} />
                  <span className="flex-1">{NATIVE[value]}</span>
                  {selected ? <Check className="size-4 text-accent" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
