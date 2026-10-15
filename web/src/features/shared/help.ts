"use client";

import { createElement } from "react";
import { useI18n } from "@/lib/i18n";
import { GuideHelpButton } from "../guide/GuideHelpButton";
import type { GuideSlug } from "../guide/videos";

export type HelpModule = "crops" | "devices" | "monitoring" | "weather" | "almanac" | "pests" | "inputs" | "yield" | "advisory" | "reports" | "profile";

const GUIDE_VIDEO: Record<HelpModule, GuideSlug> = {
  crops: "02-crops",
  devices: "03-devices",
  monitoring: "04-monitoring",
  weather: "05-weather",
  almanac: "06-almanac",
  pests: "07-pests",
  inputs: "08-inputs",
  yield: "09-harvest",
  advisory: "10-advisory",
  reports: "11-reports",
  profile: "12-profile",
};

export function useModuleHelp(module: HelpModule) {
  const { t, tk } = useI18n();
  const steps = [1, 2, 3].map((n) => tk(`help.${module}.step${n}`, "")).filter(Boolean);
  return {
    intro: tk(`help.${module}.intro`),
    howTo: { label: t("help.how"), steps, video: createElement(GuideHelpButton, { slug: GUIDE_VIDEO[module] }) },
  };
}
