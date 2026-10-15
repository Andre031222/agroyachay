"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

const KEY = "agroyachay.theme";

export const themeScript = `(function(){try{var r=document.documentElement;var p=localStorage.getItem('${KEY}');if(p!=='light'&&p!=='dark'){p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';localStorage.setItem('${KEY}',p);}r.dataset.theme=p;r.style.colorScheme=p;var l=localStorage.getItem('agroyachay.locale');if(l==='en'||l==='qu'||l==='ay'||l==='es')r.lang=l;}catch(e){}})();`;

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY || (event.newValue !== "light" && event.newValue !== "dark")) return;
    applyTheme(event.newValue);
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function applyTheme(value: Theme) {
  const root = document.documentElement;
  root.dataset.theme = value;
  root.style.colorScheme = value;
  listeners.forEach((listener) => listener());
}

function persist(value: Theme) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    return;
  }
}

interface ThemeContextValue {
  theme: Theme;
  resolved: Theme;
  setTheme: (value: Theme, origin?: { x: number; y: number }) => void;
  toggle: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  const setTheme = useCallback((value: Theme, origin?: { x: number; y: number }) => {
    persist(value);
    if (readTheme() === value) return;
    const apply = () => applyTheme(value);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !origin || typeof document.startViewTransition !== "function") {
      apply();
      return;
    }
    const transition = document.startViewTransition(() => flushSync(apply));
    transition.ready.then(
      () => {
        const radius = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
          { duration: 480, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      },
      () => undefined,
    );
  }, []);

  const toggle = useCallback((origin?: { x: number; y: number }) => setTheme(readTheme() === "dark" ? "light" : "dark", origin), [setTheme]);

  const value = useMemo(() => ({ theme, resolved: theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider missing");
  return value;
}
