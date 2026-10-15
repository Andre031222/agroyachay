"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Snowflake, Umbrella } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { formatDate, formatNumber, wmoKey } from "@/lib/format";
import { WeatherIcon } from "../weather/WeatherIcon";

export function WeatherSummary() {
  const { t, intl } = useI18n();
  const { user } = useAuth();
  const lat = user?.latitude ?? null;
  const lon = user?.longitude ?? null;
  const hasLocation = lat !== null && lon !== null;
  const weather = useAsync(hasLocation ? () => api.weather(lat, lon) : null, [lat, lon], `weather:${lat}:${lon}`);
  const link = (
    <Link href="/app/weather" className="inline-flex min-h-11 items-center gap-1 text-[15px] text-link hover:underline">
      {t("overview.weather_see")}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );

  if (!hasLocation) {
    return (
      <Card>
        <CardHeader title={t("page.weather")} />
        <p className="text-[16px] font-medium">{t("onboarding.step_location")}</p>
        <p className="mt-1 text-[15px] text-muted">{t("onboarding.step_location_text")}</p>
        <ButtonLink href="/app/weather" variant="outline" className="mt-4">
          {t("weather.use_location")}
        </ButtonLink>
      </Card>
    );
  }

  const data = weather.data;
  if (!data) {
    return (
      <Card>
        <CardHeader title={t("page.weather")} />
        {weather.error ? <p className="text-[15px] text-muted">{t("errors.network")}</p> : <Skeleton className="h-[188px]" />}
      </Card>
    );
  }

  const current = data.current;
  const days = data.daily.slice(0, 3);
  const frost = data.agro.frost_risk;
  return (
    <Card>
      <CardHeader title={t("page.weather")} action={link} className="mb-2" />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular display text-[48px] leading-none">{formatNumber(current.temperature, intl, 0)}°</p>
          <p className="mt-1.5 text-[16px] font-medium">{t(wmoKey(current.weather_code))}</p>
          <p className="flex items-center gap-1 truncate text-[14px] text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{user?.place_name || data.location.name || `${formatNumber(lat, intl, 2)}, ${formatNumber(lon, intl, 2)}`}</span>
          </p>
        </div>
        <WeatherIcon code={current.weather_code} className="size-14 shrink-0 text-warn" />
      </div>
      {frost.risk ? (
        <p className={`mt-3 flex items-center gap-2 text-[15px] font-medium ${frost.level === "severe" ? "text-danger" : "text-warn"}`}>
          <Snowflake className="size-4 shrink-0" aria-hidden />
          {frost.level === "severe"
            ? t("weather.frost_severe", { value: formatNumber(frost.min_temperature, intl) })
            : t("weather.frost_moderate", { value: formatNumber(frost.min_temperature, intl) })}
        </p>
      ) : null}
      <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
        {days.map((day) => (
          <li key={day.date} className="flex items-center gap-3 py-2 text-[15px]">
            <span className="w-16 shrink-0 font-medium">{formatDate(day.date, intl, { weekday: "short" })}</span>
            <WeatherIcon code={day.weather_code} className="size-5 shrink-0 text-muted" />
            <span className="tabular flex min-w-0 flex-1 items-center gap-1 text-link">
              <Umbrella className="size-3.5 shrink-0" aria-hidden />
              {formatNumber(day.precipitation_probability, intl, 0)}%
            </span>
            <span className="tabular shrink-0">
              <span className="text-muted">{formatNumber(day.temperature_min, intl, 0)}°</span> / {formatNumber(day.temperature_max, intl, 0)}°
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
