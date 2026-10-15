"use client";

import { Droplets, Sprout, Thermometer, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatNumber, METRIC_UNIT } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Device, LatestReadings, Metric, MetricValue, Threshold } from "@/lib/types";
import { Gauge } from "./Gauge";

export const METRIC_ICON: Record<Metric, LucideIcon> = {
  air_temperature: Thermometer,
  air_humidity: Droplets,
  soil_moisture: Sprout,
};

export const METRIC_SCALE: Record<Metric, [number, number]> = {
  air_temperature: [-10, 40],
  air_humidity: [0, 100],
  soil_moisture: [0, 100],
};

export const DEFAULT_THRESHOLDS: Record<Metric, [number, number]> = {
  air_temperature: [2, 28],
  air_humidity: [40, 85],
  soil_moisture: [30, 80],
};

export function latestOf(readings: LatestReadings | undefined, metric: Metric): MetricValue | undefined {
  return readings?.[metric];
}

export function defaultThreshold(metric: Metric): Threshold {
  const [min, max] = DEFAULT_THRESHOLDS[metric];
  return { metric, min, max };
}

export function thresholdOf(device: Pick<Device, "thresholds">, metric: Metric): Threshold {
  return device.thresholds.find((item) => item.metric === metric) ?? defaultThreshold(metric);
}

export type RangeState = "within" | "below" | "above";

export function rangeState(value: number, threshold: Threshold): RangeState {
  if (value < threshold.min) return "below";
  if (value > threshold.max) return "above";
  return "within";
}

export function useVerdict() {
  const { t } = useI18n();
  return (metric: Metric, value: number | undefined, threshold: Threshold): { text: string; state: RangeState | "none" } => {
    if (value === undefined) return { text: t("verdict.no_data"), state: "none" };
    const state = rangeState(value, threshold);
    return { text: t(`verdict.${metric}.${state}`), state };
  };
}

export function verdictClass(state: RangeState | "none"): string {
  if (state === "within") return "text-accent";
  if (state === "none") return "text-muted";
  return "text-danger";
}

export function MetricCard({ metric, value, threshold, selected, onSelect }: { metric: Metric; value: number | undefined; threshold: Threshold; selected?: boolean; onSelect?: () => void }) {
  const { t, intl } = useI18n();
  const verdict = useVerdict()(metric, value, threshold);
  const Icon = METRIC_ICON[metric];
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-[14px] font-medium text-muted">
        <Icon className="size-4" aria-hidden />
        {t(`metric.${metric}`)}
      </div>
      <p className={cn("mt-2 min-h-[44px] text-[16px] font-semibold leading-snug", verdictClass(verdict.state))}>{verdict.text}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="tabular text-[34px] font-semibold leading-none tracking-[-0.02em]">
          {formatNumber(value, intl)}
          <span className="ml-1 text-[17px] font-medium text-muted">{METRIC_UNIT[metric]}</span>
        </p>
        <Gauge
          value={value}
          scale={METRIC_SCALE[metric]}
          band={[threshold.min, threshold.max]}
          status={verdict.state}
          label={`${t(`metric.${metric}`)}: ${formatNumber(value, intl)} ${METRIC_UNIT[metric]}. ${t("monitoring.optimal")} ${formatNumber(threshold.min, intl)}–${formatNumber(threshold.max, intl)}`}
          size={104}
        />
      </div>
      <p className="mt-2 text-[13px] text-muted">
        {t("monitoring.optimal")}: {formatNumber(threshold.min, intl)}–{formatNumber(threshold.max, intl)} {METRIC_UNIT[metric]}
      </p>
    </>
  );
  if (!onSelect) return <div className="rounded-[16px] border border-line bg-bg p-4">{body}</div>;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("rounded-[16px] border bg-bg p-4 text-left transition-colors", selected ? "border-text" : "border-line hover:border-muted")}
    >
      {body}
    </button>
  );
}
