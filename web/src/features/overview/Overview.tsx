"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bug, Cpu, Sprout, Radio } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, InlineEmpty } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { formatNumber, METRICS, METRIC_UNIT } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import type { Alert } from "@/lib/types";
import { NAV_GROUPS } from "../shell/nav";
import { LoadError } from "../shared/LoadError";
import { useRelative } from "../shared/RelativeTime";
import { defaultThreshold, latestOf, METRIC_ICON, useVerdict, verdictClass } from "../monitoring/metric";
import { AlertList } from "./AlertList";
import { FirstSteps } from "./FirstSteps";
import { WeatherSummary } from "./WeatherSummary";
import { GuideHelpButton } from "../guide/GuideHelpButton";
import { CropPhoto } from "../shared/CropPhoto";
import { useCatalog, useCrops } from "../shared/data";
import { useLabels } from "../shared/labels";

const KPI_SPANS = ["sm:col-span-2 xl:col-span-1", "sm:col-span-2 xl:col-span-1", "sm:col-span-2 xl:col-span-1", "sm:col-span-3 xl:col-span-1", "col-span-2 sm:col-span-3 xl:col-span-1"];

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "overview.greeting_morning" as const;
  if (hour < 19) return "overview.greeting_afternoon" as const;
  return "overview.greeting_evening" as const;
}

export function Overview() {
  const { t, intl } = useI18n();
  const { user } = useAuth();
  const verdictOf = useVerdict();
  const dashboard = useAsync(() => api.dashboard(), ["dashboard"], "dashboard");
  const devices = useAsync(() => api.devices(), ["devices"], "devices");
  const crops = useCrops();
  const catalog = useCatalog();
  const labels = useLabels();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [greeting] = useState(greetingKey);
  const relative = useRelative();

  const resolve = async (alert: Alert) => {
    setBusyId(alert.id);
    try {
      await api.resolveAlert(alert.id);
      dashboard.setData((current) =>
        current
          ? { ...current, recent_alerts: current.recent_alerts.filter((a) => a.id !== alert.id), counts: { ...current.counts, open_alerts: Math.max(0, current.counts.open_alerts - 1) } }
          : current,
      );
      toast.success(t("alert.resolved"));
    } catch (error) {
      toast.error(errorMessage(error, t));
    } finally {
      setBusyId(null);
    }
  };

  const firstName = user?.name.split(" ")[0] ?? "";
  const data = dashboard.data;
  const quickLinks = NAV_GROUPS.flatMap((group) => (group.adminOnly ? [] : group.items)).filter((item) => item.href !== "/app");

  const sectionTitle = "text-[21px] font-semibold tracking-[-0.02em]";
  const seeLink = "inline-flex min-h-11 items-center gap-1 text-[15px] text-link hover:underline";

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div>
        <h1 className="display text-[30px] sm:text-[34px] lg:text-[36px]">{t(greeting, { name: firstName })}</h1>
        <p className="mt-1.5 text-[17px] text-muted">{t("overview.subtitle")}</p>
        <GuideHelpButton slug="01-dashboard" className="mt-3" />
      </div>

      {dashboard.error ? <LoadError error={dashboard.error} onRetry={dashboard.reload} /> : null}

      {!data && dashboard.loading ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 xl:grid-cols-5">
            {KPI_SPANS.map((span, index) => (
              <Skeleton key={index} className={`h-[104px] rounded-[20px] ${span}`} />
            ))}
          </div>
          <div className="grid-12 split-8-4-xl">
            <div className="flex flex-col gap-6">
              <Skeleton className="h-72 rounded-[20px]" />
            </div>
            <Skeleton className="h-80 rounded-[20px]" />
          </div>
        </>
      ) : data ? (
        <>
          <section aria-label={t("page.overview")} className="grid grid-cols-2 gap-3 sm:grid-cols-6 xl:grid-cols-5">
            <Stat label={t("overview.kpi_crops")} value={data.counts.crops} icon={<Sprout className="size-4" />} className="sm:col-span-2 xl:col-span-1" />
            <Stat label={t("overview.kpi_devices")} value={data.counts.devices_active} icon={<Cpu className="size-4" />} tone="accent" className="sm:col-span-2 xl:col-span-1" />
            <Stat label={t("overview.kpi_pending")} value={data.counts.devices_pending} icon={<Radio className="size-4" />} className="sm:col-span-2 xl:col-span-1" />
            <Stat label={t("overview.kpi_alerts")} value={data.counts.open_alerts} icon={<AlertTriangle className="size-4" />} tone={data.counts.open_alerts ? "warn" : "default"} className="sm:col-span-3 xl:col-span-1" />
            <Stat label={t("overview.kpi_diagnoses")} value={data.counts.diagnoses} icon={<Bug className="size-4" />} className="col-span-2 sm:col-span-3 xl:col-span-1" />
          </section>
          <div className="grid-12 split-8-4-xl">
            <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
              {devices.data ? (
                <FirstSteps
                  status={{
                    crop: data.counts.crops > 0,
                    sensor: devices.data.some((device) => device.status !== "pending"),
                    link: devices.data.some((device) => device.status !== "pending" && device.crop_id !== null),
                    location: user?.latitude !== null && user?.latitude !== undefined,
                  }}
                />
              ) : null}
              {data.counts.devices_pending > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line p-4 sm:p-5">
                  <p className="flex items-center gap-3 text-[17px]">
                    <Radio className="size-5 text-accent" aria-hidden />
                    {t("overview.pending_banner", { count: data.counts.devices_pending })}
                  </p>
                  <ButtonLink href="/app/devices">{t("overview.claim_now")}</ButtonLink>
                </div>
              ) : null}
              {crops.data?.length ? (
                <section aria-labelledby="crop-strip-title">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <h2 id="crop-strip-title" className={sectionTitle}>
                      {t("overview.crops_title")}
                    </h2>
                    <Link href="/app/crops" className={seeLink}>
                      {t("overview.crops_see")}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                  <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                    {crops.data.map((crop) => (
                      <li key={crop.id} className="w-[200px] shrink-0 snap-start">
                        <Link href="/app/crops" className="flex flex-col gap-2.5 rounded-[20px] bg-surface p-2.5 hover:bg-line/40">
                          <CropPhoto code={crop.species} alt={labels.species(crop.species, catalog.data)} variant="full" sizes="200px" radius="md" />
                          <span className="px-1 pb-1">
                            <span className="block truncate text-[16px] font-semibold">{crop.name}</span>
                            <span className="block truncate text-[14px] text-muted">
                              {labels.species(crop.species, catalog.data)} · {formatNumber(crop.area_ha, intl, 2)} {t("common.ha")}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section aria-labelledby="latest-title">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <h2 id="latest-title" className={sectionTitle}>
                    {t("overview.latest_title")}
                  </h2>
                  {data.latest_readings.length ? (
                    <Link href="/app/monitoring" className={seeLink}>
                      {t("page.monitoring")}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  ) : null}
                </div>
                {data.latest_readings.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.latest_readings.map((device) => (
                      <Link key={device.device_id} href="/app/monitoring" className="rounded-[20px] bg-surface p-5 hover:bg-line/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[17px] font-semibold">{device.device_name ?? device.esp32_id}</p>
                            <p className="truncate text-[14px] text-muted">{device.crop_name ?? device.esp32_id}</p>
                          </div>
                          <Badge tone={device.online ? "accent" : "neutral"} dot>
                            {device.online ? t("common.online") : t("common.offline")}
                          </Badge>
                        </div>
                        <ul className="mt-3 flex flex-col divide-y divide-line">
                          {METRICS.map((metric) => {
                            const value = latestOf(device.readings, metric)?.value;
                            const verdict = verdictOf(metric, value, defaultThreshold(metric));
                            const Icon = METRIC_ICON[metric];
                            return (
                              <li key={metric} className="flex items-center gap-3 py-2.5">
                                <Icon className="size-[18px] shrink-0 text-muted" aria-hidden />
                                <span className={`min-w-0 flex-1 text-[15px] font-medium leading-snug ${verdictClass(verdict.state)}`}>{verdict.text}</span>
                                <span className="tabular shrink-0 text-[17px] font-semibold">
                                  {formatNumber(value, intl)}
                                  <span className="ml-0.5 text-[14px] font-normal text-muted">{METRIC_UNIT[metric]}</span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <p className="mt-3 text-[14px] text-muted">{t("devices.last_seen", { time: relative(device.last_seen_at) })}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    photo="sensor"
                    title={t("overview.latest_empty_title")}
                    text={t("overview.latest_empty_text")}
                    action={<ButtonLink href="/app/devices">{t("overview.connect_sensor")}</ButtonLink>}
                  />
                )}
              </section>
            </div>

            <aside className="grid min-w-0 content-start gap-6 sm:grid-cols-2 xl:grid-cols-1">
              <WeatherSummary />
              <Card>
                <CardHeader title={t("overview.alerts_title")} />
                {data.recent_alerts.length ? <AlertList alerts={data.recent_alerts} onResolve={resolve} busyId={busyId} /> : <InlineEmpty>{t("overview.alerts_empty")}</InlineEmpty>}
              </Card>
              <Card className="sm:col-span-2 xl:col-span-1">
                <CardHeader title={t("overview.quick_title")} />
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                  {quickLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="flex min-h-11 items-center gap-2.5 rounded-[12px] bg-bg px-3 text-[15px] font-medium hover:bg-line/40">
                        <item.icon className="size-[18px] shrink-0 text-accent" aria-hidden />
                        <span className="truncate">{t(item.label)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </aside>
          </div>
        </>
      ) : (
        <Skeleton className="h-40" />
      )}
    </div>
  );
}
