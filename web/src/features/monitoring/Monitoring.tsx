"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, InlineEmpty } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { METRICS, METRIC_UNIT } from "@/lib/format";
import type { Device, Metric, ReadingRange } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useRelative } from "../shared/RelativeTime";
import dynamic from "next/dynamic";
import { latestOf, MetricCard, thresholdOf } from "./metric";
import { useModuleHelp } from "../shared/help";
import { useCrops } from "../shared/data";
import { CropPhoto } from "../shared/CropPhoto";

const SeriesChart = dynamic(() => import("./SeriesChart").then((m) => m.SeriesChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px]" />,
});

const RANGES: ReadingRange[] = ["1h", "24h", "7d", "30d"];

function useTick(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setTick((n) => n + 1);
    }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return tick;
}

function DevicePanel({ device, range, tick }: { device: Device; range: ReadingRange; tick: number }) {
  const { t } = useI18n();
  const relative = useRelative();
  const [metric, setMetric] = useState<Metric>("air_temperature");
  const readings = useAsync(() => api.readings(device.id, range), [device.id, range, tick], `readings:${device.id}:${range}`);
  const series = readings.data?.series.find((item) => item.metric === metric);
  const crops = useCrops();
  const species = crops.data?.find((crop) => crop.id === device.crop_id)?.species;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {device.crop_id ? <CropPhoto code={species} alt={device.crop_name ?? ""} sizes="56px" className="size-14" /> : null}
          <div className="min-w-0">
          <h2 className="truncate text-[21px] font-semibold tracking-[-0.015em]">{device.name ?? device.esp32_id}</h2>
          <p className="text-[15px] text-muted">
            {device.crop_name ? `${device.crop_name} · ` : ""}
            {t("devices.last_seen", { time: relative(device.last_seen_at) })}
          </p>
          </div>
        </div>
        <Badge tone={device.online ? "accent" : "neutral"} dot>
          {device.online ? t("common.online") : t("common.offline")}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {METRICS.map((m) => (
          <MetricCard key={m} metric={m} value={latestOf(device.latest, m)?.value} threshold={thresholdOf(device, m)} selected={metric === m} onSelect={() => setMetric(m)} />
        ))}
      </div>
      <div>
        {readings.error && !readings.data ? (
          <LoadError error={readings.error} onRetry={readings.reload} />
        ) : !readings.data ? (
          <Skeleton className="h-[240px]" />
        ) : series && series.points.length ? (
          <SeriesChart points={series.points} unit={series.unit || METRIC_UNIT[metric]} range={range} threshold={thresholdOf(device, metric)} label={t(`metric.${metric}`)} />
        ) : (
          <InlineEmpty>{t("monitoring.no_data")}</InlineEmpty>
        )}
      </div>
    </Card>
  );
}

export function Monitoring() {
  const { t } = useI18n();
  const help = useModuleHelp("monitoring");
  const [range, setRange] = useState<ReadingRange>("24h");
  const tick = useTick(10000);
  const devices = useAsync(() => api.devices(), ["devices", tick], "devices");
  const list = (devices.data ?? []).filter((device) => device.status === "active");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const relative = useRelative();

  useEffect(() => {
    if (devices.data) {
      const id = window.setTimeout(() => setUpdatedAt(new Date().toISOString()), 0);
      return () => window.clearTimeout(id);
    }
  }, [devices.data]);

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo}
        title={t("page.monitoring")}
        subtitle={
          <span className="inline-flex items-center gap-2 text-[17px]">
            <RefreshCw className="size-4" aria-hidden />
            {t("monitoring.auto_refresh")}
            {updatedAt ? ` · ${t("monitoring.updated", { time: relative(updatedAt) })}` : ""}
          </span>
        }
        actions={
          <Tabs
            label={t("monitoring.range")}
            items={RANGES.map((value) => ({ value, label: t(`monitoring.range_${value}`) }))}
            value={range}
            onChange={setRange}
          />
        }
      />
      {devices.error && !devices.data ? <LoadError error={devices.error} onRetry={devices.reload} /> : null}
      {!devices.data && !devices.error ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[460px] rounded-[20px]" />
        </div>
      ) : devices.data && !list.length ? (
        <EmptyState
          photo="potato-field"
          title={t("monitoring.empty_title")}
          text={t("monitoring.empty_text")}
          action={<ButtonLink href="/app/devices">{t("monitoring.go_devices")}</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {list.map((device) => (
            <DevicePanel key={device.id} device={device} range={range} tick={tick} />
          ))}
        </div>
      )}
    </>
  );
}
