"use client";

import { useState, type MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";

function originOf(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const [touched, setTouched] = useState(false);
  const dark = theme === "dark";
  const label = t(dark ? "theme.to_light" : "theme.to_dark");
  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={(event) => {
        setTouched(true);
        toggle(originOf(event));
      }}
      aria-label={label}
      title={label}
      className={cn("top-control w-11 justify-center", className)}
    >
      <Icon key={theme} className={cn("size-[19px]", touched && "icon-swap")} aria-hidden />
    </button>
  );
}

const ORDER: Theme[] = ["light", "dark"];

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t("theme.label")} className={cn("inline-flex items-center gap-0.5 rounded-[980px] border border-line p-0.5", className)}>
      {ORDER.map((value) => {
        const Icon = value === "dark" ? Moon : Sun;
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={(event) => setTheme(value, originOf(event))}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-[980px] px-4 text-[15px] font-medium transition-colors",
              selected ? "bg-surface text-text" : "text-muted hover:text-text",
            )}
          >
            <Icon className="size-[17px]" aria-hidden />
            {t(`theme.${value}`)}
          </button>
        );
      })}
    </div>
  );
}
