"use client";

import { useEffect, type ReactNode } from "react";
import styles from "./landing.module.css";

export function LandingShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      root.dataset.input = "keyboard";
    };
    const onPointer = () => {
      delete root.dataset.input;
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer, true);
      delete root.dataset.input;
    };
  }, []);

  return <div className={styles.root}>{children}</div>;
}
