"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import type { ReadingRange, SeriesPoint, Threshold } from "@/lib/types";

interface ChartRow {
  ts: number;
  avg: number;
  band: [number, number];
}

interface SeriesChartProps {
  points: SeriesPoint[];
  unit: string;
  range: ReadingRange;
  threshold?: Threshold;
  label: string;
  height?: number;
}

function tickFormatter(range: ReadingRange, intl: string) {
  const options: Intl.DateTimeFormatOptions = range === "1h" || range === "24h" ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : { day: "numeric", month: "short" };
  const format = new Intl.DateTimeFormat(intl, options);
  return (value: number) => format.format(new Date(value));
}

function ChartTooltip({ active, payload, unit, intl, labels }: TooltipContentProps & { unit: string; intl: string; labels: { min: string; avg: string; max: string } }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;
  const when = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(row.ts));
  const banded = row.band[0] !== row.band[1];
  return (
    <div className="rounded-[12px] border border-line bg-elevated px-3 py-2 text-[14px]">
      <p className="text-muted">{when}</p>
      <p className="tabular font-semibold">
        {labels.avg} {formatNumber(row.avg, intl)} {unit}
      </p>
      {banded ? (
        <p className="tabular text-muted">
          {labels.min} {formatNumber(row.band[0], intl)} · {labels.max} {formatNumber(row.band[1], intl)}
        </p>
      ) : null}
    </div>
  );
}

export function SeriesChart({ points, unit, range, threshold, label, height = 240 }: SeriesChartProps) {
  const { t, intl } = useI18n();
  const rows: ChartRow[] = points.map((point) => ({ ts: new Date(point.t).getTime(), avg: point.avg, band: [point.min, point.max] }));
  const format = tickFormatter(range, intl);
  const labels = { min: t("monitoring.min"), avg: t("monitoring.avg"), max: t("monitoring.max") };
  const summary = rows.length
    ? `${label}: ${labels.min} ${formatNumber(Math.min(...rows.map((r) => r.band[0])), intl)}, ${labels.max} ${formatNumber(Math.max(...rows.map((r) => r.band[1])), intl)} ${unit}`
    : label;

  return (
    <figure className="m-0" aria-label={summary}>
      <div style={{ height }} role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />
            {threshold ? (
              <ReferenceArea
                y1={threshold.min}
                y2={threshold.max}
                fill="var(--accent)"
                fillOpacity={0.1}
                stroke="none"
                ifOverflow="extendDomain"
                label={{ value: t("monitoring.optimal"), position: "insideTopLeft", fill: "var(--accent)", fontSize: 12 }}
              />
            ) : null}
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={format}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={44} domain={["auto", "auto"]} />
            <Tooltip content={(props) => <ChartTooltip {...props} unit={unit} intl={intl} labels={labels} />} cursor={{ stroke: "var(--muted)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area dataKey="band" type="monotone" stroke="none" fill="var(--link)" fillOpacity={0.14} isAnimationActive={false} />
            <Line
              dataKey="avg"
              type="monotone"
              stroke="var(--link)"
              strokeWidth={2.25}
              dot={false}
              isAnimationActive={false}
              label={(props: { x?: number | string; y?: number | string; index?: number; value?: unknown }) =>
                props.index === rows.length - 1 && typeof props.x === "number" && typeof props.y === "number" ? (
                  <g key="end-label">
                    <circle cx={props.x} cy={props.y} r={4} fill="var(--link)" stroke="var(--bg)" strokeWidth={2} />
                    <text x={props.x - 8} y={props.y - 10} textAnchor="end" fontSize={13} fontWeight={600} fill="var(--text)">
                      {`${formatNumber(Number(props.value), intl)} ${unit}`}
                    </text>
                  </g>
                ) : (
                  <g key={`l-${props.index}`} />
                )
              }
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
