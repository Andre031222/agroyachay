"use client";

import { useEffect, useRef, useState } from "react";
import {
  CloudRain,
  Droplets,
  MapPin,
  Snowflake,
  Sparkles,
  Thermometer,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatNumber, formatTime, wmoKey } from "@/lib/format";
import type { Weather as WeatherData, WeatherPlan } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { AiNotice } from "../shared/AiNotice";
import { LocationForm } from "../shared/LocationForm";
import { getPosition } from "../shared/Geolocate";
import { useModuleHelp } from "../shared/help";
import { WeatherIcon } from "./WeatherIcon";

function Setup({ onSaved }: { onSaved: () => void }) {
  const { t } = useI18n();
  const { setUser, user } = useAuth();
  const [status, setStatus] = useState<"asking" | "manual">("asking");
  const asked = useRef(false);

  const save = async (value: { latitude: number; longitude: number; place_name: string }) => {
    try {
      const updated = await api.updateMe({ latitude: value.latitude, longitude: value.longitude, place_name: value.place_name || undefined });
      setUser(updated ?? { ...(user as NonNullable<typeof user>), ...value });
      toast.success(t("common.saved"));
      onSaved();
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    }
  };

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    getPosition().then(
      (position) => save({ latitude: position.lat, longitude: position.lon, place_name: "" }),
      () => setStatus("manual"),
    );
  });

  return (
    <div className="grid overflow-hidden rounded-[20px] bg-surface lg:grid-cols-2">
      <Photo name="altiplano" alt="" rounded={false} className="aspect-[16/10] lg:aspect-auto lg:min-h-[480px]" />
      <div className="flex flex-col gap-5 p-6 sm:p-10">
        <MapPin className="size-7 text-accent" aria-hidden />
        <h2 className="text-[28px] font-semibold tracking-[-0.02em]">{t("weather.setup_title")}</h2>
        <p className="text-[16px] leading-relaxed text-muted">{t("weather.setup_text")}</p>
        {status === "asking" ? (
          <p role="status" className="flex items-center gap-2 text-[17px]">
            <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-accent border-r-transparent" />
            {t("weather.locating")}
          </p>
        ) : (
          <p className="text-[15px] text-warn">{t("weather.denied")}</p>
        )}
        <h3 className="text-[17px] font-semibold">{t("weather.manual_title")}</h3>
        <LocationForm initial={{ latitude: null, longitude: null, place_name: null }} onSubmit={save} submitLabel={t("weather.save_location")} />
      </div>
    </div>
  );
}

function HourlyStrip({ data }: { data: WeatherData }) {
  const { t, intl } = useI18n();
  const hours = data.hourly.slice(0, 24);
  return (
    <ol aria-label={t("weather.hourly")} className="no-scrollbar -mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1">
      {hours.map((h, index) => (
        <li key={h.time} className="flex min-w-[64px] snap-start flex-col items-center gap-2 rounded-[14px] bg-bg px-2 py-3 text-center">
          <span className="text-[14px] font-medium text-muted">{index === 0 ? t("weather.now") : formatTime(h.time, intl)}</span>
          <WeatherIcon code={h.weather_code} className="size-6 text-text" />
          <span className="tabular text-[17px] font-semibold">{formatNumber(h.temperature, intl, 0)}°</span>
          <span className={`tabular text-[13px] font-medium ${h.precipitation_probability >= 30 ? "text-link" : "text-muted"}`}>
            {formatNumber(h.precipitation_probability, intl, 0)}%
          </span>
        </li>
      ))}
    </ol>
  );
}

function DailyRows({ data }: { data: WeatherData }) {
  const { t, intl } = useI18n();
  const days = data.daily.slice(0, 7);
  const lo = Math.min(...days.map((d) => d.temperature_min));
  const hi = Math.max(...days.map((d) => d.temperature_max));
  const span = Math.max(1, hi - lo);
  return (
    <ul className="divide-y divide-line">
      {days.map((day, index) => {
        const left = ((day.temperature_min - lo) / span) * 100;
        const width = Math.max(4, ((day.temperature_max - day.temperature_min) / span) * 100);
        return (
          <li key={day.date} className="grid grid-cols-[72px_32px_44px_1fr] items-center gap-3 py-3 sm:grid-cols-[110px_36px_52px_1fr]">
            <span className="truncate text-[17px] font-medium first-letter:uppercase">
              {index === 0 ? t("almanac.today") : formatDate(day.date, intl, { weekday: "short" })}
            </span>
            <WeatherIcon code={day.weather_code} className="size-6 text-muted" />
            <span className={`tabular text-[14px] font-medium ${day.precipitation_probability >= 30 ? "text-link" : "text-muted"}`}>
              {formatNumber(day.precipitation_probability, intl, 0)}%
            </span>
            <span className="flex items-center gap-3">
              <span className="tabular w-8 text-right text-[17px] text-muted">{formatNumber(day.temperature_min, intl, 0)}°</span>
              <span className="relative h-1.5 flex-1 rounded-full bg-line/70" role="img" aria-label={`${t(wmoKey(day.weather_code))}, ${t("weather.min")} ${formatNumber(day.temperature_min, intl, 0)}°, ${t("weather.max")} ${formatNumber(day.temperature_max, intl, 0)}°`}>
                <span className={`absolute inset-y-0 rounded-full ${day.temperature_min <= 2 ? "bg-link" : "bg-warn"}`} style={{ left: `${left}%`, width: `${width}%` }} />
              </span>
              <span className="tabular w-8 text-[17px] font-semibold">{formatNumber(day.temperature_max, intl, 0)}°</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Indicator({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: "warn" | "accent" | "danger" }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-bg px-4 py-3">
      <Icon className={`size-5 shrink-0 ${tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-accent"}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-muted">{label}</p>
        <p className="text-[17px] font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}

function PlanCard({ lat, lon }: { lat: number; lon: number }) {
  const { t, locale, intl } = useI18n();
  const [plan, setPlan] = useState<WeatherPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      setPlan(await api.weatherPlan(lat, lon, locale));
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t("weather.plan_title")}
        description={t("weather.plan_text")}
        action={
          <Button onClick={generate} loading={busy} icon={<Sparkles className="size-4" aria-hidden />}>
            {busy ? t("weather.plan_generating") : t("weather.plan_generate")}
          </Button>
        }
      />
      {error ? (
        <AiNotice error={error} />
      ) : null}
      {busy && !plan ? <Skeleton className="h-40" /> : null}
      {plan ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={plan.risk_level === "high" ? "danger" : plan.risk_level === "medium" ? "warn" : "accent"}>
              {t("weather.plan_risk")}: {t(`risk.${plan.risk_level}`)}
            </Badge>
          </div>
          <p className="text-[16px] leading-relaxed">{plan.summary}</p>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plan.days.map((day) => (
              <li key={day.date} className="rounded-[16px] bg-bg p-4">
                <p className="text-[17px] font-semibold">{formatDate(day.date, intl, { weekday: "long", day: "numeric", month: "long" })}</p>
                {day.activities.length ? (
                  <>
                    <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">{t("weather.plan_do")}</p>
                    <ul className="mt-1 list-disc pl-5 text-[15px] leading-relaxed">
                      {day.activities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {day.avoid.length ? (
                  <>
                    <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-warn">{t("weather.plan_avoid")}</p>
                    <ul className="mt-1 list-disc pl-5 text-[15px] leading-relaxed text-muted">
                      {day.avoid.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Card>
  );
}

export function Weather() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("weather");
  const { user, setUser } = useAuth();
  const [changing, setChanging] = useState(false);
  const lat = user?.latitude ?? null;
  const lon = user?.longitude ?? null;
  const hasLocation = lat !== null && lon !== null;
  const weather = useAsync(hasLocation ? () => api.weather(lat, lon) : null, [lat, lon], `weather:${lat}:${lon}`);

  const header = (
    <PageHeader intro={help.intro} howTo={help.howTo}
      title={t("page.weather")}
      subtitle={
        hasLocation ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {user?.place_name || weather.data?.location.name || `${formatNumber(lat, intl, 3)}, ${formatNumber(lon, intl, 3)}`}
          </span>
        ) : undefined
      }
      actions={
        hasLocation ? (
          <Button variant="outline" onClick={() => setChanging(true)}>
            {t("weather.change_location")}
          </Button>
        ) : undefined
      }
    />
  );

  if (!hasLocation)
    return (
      <>
        {header}
        <Setup onSaved={() => undefined} />
      </>
    );

  const data = weather.data;
  const current = data?.current;

  return (
    <>
      {header}
      {weather.error ? <LoadError error={weather.error} onRetry={weather.reload} /> : null}
      {!data && !weather.error ? (
        <div className="grid-12 split-7-5">
          <Skeleton className="h-64 rounded-[20px]" />
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      ) : null}
      {data && current ? (
        <div className="flex flex-col gap-6">
          <div className="grid-12 split-7-5">
            <Card className="flex flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[17px] font-medium text-muted">{t("weather.now")}</p>
                  <p className="tabular display mt-1 text-[72px] leading-none">{formatNumber(current.temperature, intl, 0)}°</p>
                  <p className="mt-2 text-[19px] font-medium">{t(wmoKey(current.weather_code))}</p>
                  <p className="text-[17px] text-muted">{t("weather.feels_like", { value: `${formatNumber(current.apparent_temperature, intl, 0)}°` })}</p>
                </div>
                <WeatherIcon code={current.weather_code} className="size-16 text-warn" />
              </div>
              <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-[15px]">
                <div>
                  <dt className="flex items-center gap-1.5 text-muted">
                    <Droplets className="size-4" aria-hidden />
                    {t("weather.humidity")}
                  </dt>
                  <dd className="tabular text-[19px] font-semibold">{formatNumber(current.humidity, intl, 0)}%</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-muted">
                    <Wind className="size-4" aria-hidden />
                    {t("weather.wind")}
                  </dt>
                  <dd className="tabular text-[19px] font-semibold">{formatNumber(current.wind_kmh, intl, 0)} km/h</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-muted">
                    <Umbrella className="size-4" aria-hidden />
                    {t("weather.precipitation")}
                  </dt>
                  <dd className="tabular text-[19px] font-semibold">{formatNumber(current.precipitation_mm, intl)} mm</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <CardHeader title={t("weather.agro_title")} />
              <div className="flex flex-col gap-2">
                <Indicator
                  icon={Snowflake}
                  label={t("weather.frost_risk")}
                  value={
                    data.agro.frost_risk.level === "severe"
                      ? t("weather.frost_severe", { value: formatNumber(data.agro.frost_risk.min_temperature, intl) })
                      : data.agro.frost_risk.level === "moderate"
                        ? t("weather.frost_moderate", { value: formatNumber(data.agro.frost_risk.min_temperature, intl) })
                        : t("weather.frost_no")
                  }
                  tone={data.agro.frost_risk.level === "severe" ? "danger" : data.agro.frost_risk.risk ? "warn" : "accent"}
                />
                <Indicator
                  icon={Thermometer}
                  label={t("weather.heat_stress")}
                  value={data.agro.heat_stress.risk ? t("weather.heat_value", { value: formatNumber(data.agro.heat_stress.max_temperature, intl) }) : t("weather.heat_no")}
                  tone={data.agro.heat_stress.risk ? "warn" : "accent"}
                />
                <Indicator icon={CloudRain} label={t("weather.rain_7d")} value={`${formatNumber(data.agro.rain_7d_mm, intl)} mm`} />
                <Indicator icon={Droplets} label={t("weather.et0_7d")} value={`${formatNumber(data.agro.et0_7d_mm, intl)} mm`} />
              </div>
              <div className="mt-3 rounded-[16px] bg-bg p-4">
                <p className="text-[14px] text-muted">{t("weather.irrigation")}</p>
                <p className={`mt-1 text-[16px] font-semibold ${data.agro.irrigation_hint.code === "irrigate" ? "text-link" : data.agro.irrigation_hint.code === "monitor" ? "text-warn" : "text-accent"}`}>
                  {t(`irrigation.${data.agro.irrigation_hint.code}`)}
                </p>
                <p className="mt-1 text-[17px] leading-relaxed">{data.agro.irrigation_hint.message}</p>
                <p className="mt-1 text-[14px] text-muted">{t("weather.balance", { value: formatNumber(data.agro.irrigation_hint.balance_mm, intl) })}</p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title={t("weather.next24")} />
            <HourlyStrip data={data} />
          </Card>

          <div className="grid-12 split-7-5">
            <Card>
              <CardHeader title={t("weather.next7")} />
              <DailyRows data={data} />
            </Card>
            <Card>
              <CardHeader title={t("weather.spray_windows")} description={t("weather.spray_hint")} />
              {data.agro.spray_windows.length ? (
                <ul className="flex flex-col gap-2">
                  {data.agro.spray_windows.slice(0, 8).map((window) => (
                    <li key={window.start} className="flex items-center justify-between rounded-[12px] bg-bg px-4 py-3 text-[17px]">
                      <span className="capitalize">{formatDate(window.start, intl, { weekday: "short", day: "numeric" })}</span>
                      <span className="tabular font-medium">
                        {formatTime(window.start, intl)}–{formatTime(window.end, intl)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[17px] text-muted">{t("weather.spray_none")}</p>
              )}
            </Card>
          </div>

          <PlanCard lat={lat} lon={lon} />
        </div>
      ) : null}

      <Modal open={changing} onClose={() => setChanging(false)} title={t("weather.change_location")}>
        <LocationForm
          initial={{ latitude: lat, longitude: lon, place_name: user?.place_name ?? null }}
          submitLabel={t("weather.save_location")}
          onSubmit={async (value) => {
            try {
              const updated = await api.updateMe({ latitude: value.latitude, longitude: value.longitude, place_name: value.place_name || undefined });
              if (user) setUser(updated ?? { ...user, ...value });
              setChanging(false);
              toast.success(t("common.saved"));
            } catch (failure) {
              toast.error(errorMessage(failure, t));
            }
          }}
        />
      </Modal>
    </>
  );
}
