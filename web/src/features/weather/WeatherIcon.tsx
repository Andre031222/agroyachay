import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, type LucideIcon } from "lucide-react";
import { wmoKey } from "@/lib/format";

const ICONS: Record<ReturnType<typeof wmoKey>, LucideIcon> = {
  "wmo.clear": Sun,
  "wmo.mainly_clear": CloudSun,
  "wmo.partly_cloudy": CloudSun,
  "wmo.overcast": Cloud,
  "wmo.fog": CloudFog,
  "wmo.drizzle": CloudDrizzle,
  "wmo.rain": CloudRain,
  "wmo.snow": CloudSnow,
  "wmo.showers": CloudRain,
  "wmo.thunder": CloudLightning,
};

export function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const Icon = ICONS[wmoKey(code)];
  return <Icon className={className} aria-hidden />;
}
