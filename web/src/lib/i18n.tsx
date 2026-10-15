"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import qu from "@/locales/qu.json";
import ay from "@/locales/ay.json";
import type { Locale } from "./types";
import { createStoredValue, useStoredValue } from "./stored";

export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;
export type Vars = Record<string, string | number>;

export const LOCALES: readonly Locale[] = ["es", "qu", "ay", "en"];

const catalogs: Record<Locale, Messages> = { en, es, qu, ay };

export const localeStore = createStoredValue<Locale>("agroyachay.locale", "es", ["es", "en", "qu", "ay"]);

const intlLocale: Record<Locale, string> = { es: "es-PE", en: "en-GB", qu: "es-PE", ay: "es-PE" };

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{([a-z_]+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

interface I18nValue {
  locale: Locale;
  intl: string;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  tk: (key: string, fallback?: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useStoredValue(localeStore);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    localeStore.set(next);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>("[data-lang-fade]").forEach((element) => {
        element.animate(
          [
            { opacity: 0, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 180, easing: "ease-out" },
        );
      });
    });
  }, []);

  const value = useMemo<I18nValue>(() => {
    const messages = catalogs[locale];
    const lookup = (key: string): string | undefined =>
      (messages as Record<string, string>)[key] ?? (catalogs.es as Record<string, string>)[key];
    return {
      locale,
      intl: intlLocale[locale],
      setLocale,
      t: (key, vars) => interpolate(lookup(key) ?? key, vars),
      tk: (key, fallback, vars) => interpolate(lookup(key) ?? fallback ?? key, vars),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider missing");
  return value;
}
