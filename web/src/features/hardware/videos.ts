import type { MessageKey } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type HardwareSlug = "kit" | "dht11" | "soil" | "lm393" | "esp32";
export type AudioLang = "es" | "en";

export const COMPONENT_SLUGS: readonly HardwareSlug[] = ["dht11", "soil", "lm393", "esp32"];

export const DURATION_SECONDS: Record<HardwareSlug, number> = { kit: 10, dht11: 10, soil: 10, lm393: 10, esp32: 10 };

export const TITLE_KEY: Record<HardwareSlug, MessageKey> = {
  kit: "hw.kit_title",
  dht11: "hw.dht11_title",
  soil: "hw.soil_title",
  lm393: "hw.lm393_title",
  esp32: "hw.esp32_title",
};

export const TEXT_KEY: Record<HardwareSlug, MessageKey> = {
  kit: "hw.kit_text",
  dht11: "hw.dht11_text",
  soil: "hw.soil_text",
  lm393: "hw.lm393_text",
  esp32: "hw.esp32_text",
};

const BASE = "/videos/hardware";

export function audioFor(locale: Locale): AudioLang {
  return locale === "en" ? "en" : "es";
}

export function videoSrc(slug: HardwareSlug, audio: AudioLang) {
  return `${BASE}/${slug}.${audio}.mp4`;
}

export function posterSrc(slug: HardwareSlug) {
  return `${BASE}/${slug}.jpg`;
}

export function captionsSrc(slug: HardwareSlug, lang: AudioLang) {
  return `${BASE}/${slug}.${lang}.vtt`;
}

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
