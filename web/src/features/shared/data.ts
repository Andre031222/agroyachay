"use client";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import type { CropSpecies } from "@/lib/types";

let catalogPromise: Promise<CropSpecies[]> | null = null;

function loadCatalog(): Promise<CropSpecies[]> {
  if (!catalogPromise) {
    catalogPromise = api.cropCatalog().catch((error: unknown) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

export function useCatalog() {
  return useAsync(loadCatalog, ["catalog"], "catalog");
}

export function useCrops() {
  return useAsync(() => api.crops(), ["crops"], "crops");
}
