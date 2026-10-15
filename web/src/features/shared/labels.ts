"use client";

import { useI18n } from "@/lib/i18n";
import type { CropSpecies } from "@/lib/types";

export function useLabels() {
  const { tk, locale } = useI18n();
  return {
    species: (code: string | null | undefined, catalog?: CropSpecies[]) => {
      if (!code) return "—";
      const entry = catalog?.find((item) => item.code === code);
      return entry?.names[locale] ?? tk(`species.${code}`, entry?.name ?? code);
    },
    category: (code: string) => tk(`category.${code}`, code),
  };
}
