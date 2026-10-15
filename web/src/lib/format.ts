import type { Metric } from "./types";

export const METRICS: readonly Metric[] = ["air_temperature", "air_humidity", "soil_moisture"];

export const METRIC_UNIT: Record<Metric, string> = {
  air_temperature: "°C",
  air_humidity: "%",
  soil_moisture: "%",
};

export function formatNumber(value: number | null | undefined, intl: string, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(intl, { maximumFractionDigits: digits, minimumFractionDigits: 0, signDisplay: "negative" }).format(value);
}

export function formatPen(value: number | null | undefined, intl: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `S/\u00a0${new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "negative" }).format(value)}`;
}

export function formatDate(value: string | null | undefined, intl: string, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(intl, options ?? (sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" })).format(date);
}

export function formatDateTime(value: string | null | undefined, intl: string): string {
  return formatDate(value, intl, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function formatTime(value: string | null | undefined, intl: string): string {
  if (!value) return "—";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return value.slice(11, 16);
  return formatDate(value, intl, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function percent(value: number): number {
  return value <= 1 ? value * 100 : value;
}

type RelativeKey = "time.just_now" | "time.minute_one" | "time.minutes" | "time.hour_one" | "time.hours" | "time.day_one" | "time.days";

export function relativeParts(value: string | null | undefined, now: number): { key: RelativeKey; n: number } | null {
  if (!value) return null;
  const diff = Math.max(0, now - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return { key: "time.just_now", n: 0 };
  if (minutes < 60) return { key: minutes === 1 ? "time.minute_one" : "time.minutes", n: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return { key: hours === 1 ? "time.hour_one" : "time.hours", n: hours };
  const days = Math.floor(hours / 24);
  return { key: days === 1 ? "time.day_one" : "time.days", n: days };
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const start = new Date(`${date.slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(start)) return null;
  return Math.floor((Date.now() - start) / 86400000);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function wmoKey(code: number):
  | "wmo.clear"
  | "wmo.mainly_clear"
  | "wmo.partly_cloudy"
  | "wmo.overcast"
  | "wmo.fog"
  | "wmo.drizzle"
  | "wmo.rain"
  | "wmo.snow"
  | "wmo.showers"
  | "wmo.thunder" {
  if (code === 0) return "wmo.clear";
  if (code === 1) return "wmo.mainly_clear";
  if (code === 2) return "wmo.partly_cloudy";
  if (code === 3) return "wmo.overcast";
  if (code === 45 || code === 48) return "wmo.fog";
  if (code >= 51 && code <= 57) return "wmo.drizzle";
  if ((code >= 61 && code <= 67) || code === 80) return code === 80 ? "wmo.showers" : "wmo.rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "wmo.snow";
  if (code >= 80 && code <= 82) return "wmo.showers";
  if (code >= 95) return "wmo.thunder";
  return "wmo.partly_cloudy";
}
