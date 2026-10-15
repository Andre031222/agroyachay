"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sunrise, Sunset, Clock, Leaf, Star } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { formatDateTime, formatNumber, formatTime, todayIso } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AlmanacDay, AlmanacTask, MoonPhase } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useModuleHelp } from "../shared/help";
import { CropPhoto } from "../shared/CropPhoto";

const WAXING: MoonPhase[] = ["new_moon", "waxing_crescent", "first_quarter", "waxing_gibbous"];

export function MoonGlyph({ illumination, phase, southern = true, size = 28, title }: { illumination: number; phase: MoonPhase; southern?: boolean; size?: number; title?: string }) {
  const k = Math.max(0, Math.min(1, illumination / 100));
  const r = 10;
  const c = 12;
  const rx = Math.abs(1 - 2 * k) * r;
  const bulgeOut = k > 0.5 ? 1 : 0;
  const litRight = WAXING.includes(phase) !== southern;
  const path = `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} A ${rx} ${r} 0 0 ${bulgeOut} ${c} ${c - r} Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx={c} cy={c} r={r} fill="var(--line)" />
      {k >= 0.995 ? (
        <circle cx={c} cy={c} r={r} fill="var(--warn)" />
      ) : k > 0.005 ? (
        <path d={path} fill="var(--warn)" transform={litRight ? undefined : `translate(24 0) scale(-1 1)`} />
      ) : null}
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--muted)" strokeWidth="0.75" />
    </svg>
  );
}

function TaskList({ tasks }: { tasks: AlmanacTask[] }) {
  const { t } = useI18n();
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li key={task.code} className={cn("flex items-start gap-3 rounded-[12px] px-3 py-2.5 text-[15px]", task.traditional ? "border border-dashed border-warn" : "border border-line bg-bg")}>
          {task.traditional ? <Star className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /> : <Leaf className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />}
          <span className="flex-1">{task.label}</span>
          <span className="sr-only">{task.traditional ? t("almanac.legend_traditional") : t("almanac.legend_evidence")}</span>
        </li>
      ))}
    </ul>
  );
}

function minutesLabel(minutes: number): string {
  return `${Math.floor(minutes / 60)} h ${String(Math.round(minutes % 60)).padStart(2, "0")} min`;
}

function DayDetail({ day, southern }: { day: AlmanacDay; southern: boolean }) {
  const { t, intl } = useI18n();
  const tasks = day.tasks;
  const events = day.events;
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <MoonGlyph illumination={day.illumination} phase={day.phase} southern={southern} size={56} />
        <div>
          <p className="text-[14px] text-muted">{t("almanac.selected_day")}</p>
          <p className="text-[21px] font-semibold tracking-[-0.015em] first-letter:uppercase">
            {new Intl.DateTimeFormat(intl, { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day.date}T12:00:00`))}
          </p>
          <p className="text-[15px] text-muted">
            {day.phase_label} · {t("almanac.illumination")} {formatNumber(day.illumination, intl, 0)}%
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-[15px]">
        {[
          { icon: Sunrise, label: t("almanac.sunrise"), value: formatTime(day.sunrise, intl) },
          { icon: Sunset, label: t("almanac.sunset"), value: formatTime(day.sunset, intl) },
          { icon: Clock, label: t("almanac.day_length"), value: minutesLabel(day.day_length_min) },
        ].map((item) => (
          <div key={item.label} className="rounded-[12px] bg-bg p-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </dt>
            <dd className="tabular mt-1 text-[16px] font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="text-[17px] font-semibold">{t("almanac.tasks")}</h3>
        {tasks.length ? (
          <div className="mt-2">
            <TaskList tasks={tasks} />
          </div>
        ) : (
          <p className="mt-2 text-[15px] text-muted">{t("almanac.no_tasks")}</p>
        )}
      </div>
      {events.length ? (
        <div>
          <h3 className="text-[17px] font-semibold">{t("almanac.events")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {events.map((event) => (
              <li key={event.label}>
                <Badge tone="link">{event.label}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

export function Almanac() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("almanac");
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const lat = user?.latitude ?? null;
  const lon = user?.longitude ?? null;
  const southern = lat === null ? true : lat < 0;
  const almanac = useAsync(() => api.almanac(cursor.year, cursor.month, lat, lon), [cursor.year, cursor.month, lat, lon], `almanac:${cursor.year}:${cursor.month}`);
  const today = todayIso();

  const shift = (delta: number) => {
    setSelected(null);
    setCursor((current) => {
      const index = current.year * 12 + (current.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const data = almanac.data;
  const days = data?.days ?? [];
  const firstWeekday = (new Date(cursor.year, cursor.month - 1, 1).getDay() + 6) % 7;
  const selectedDay = days.find((day) => day.date === selected) ?? days.find((day) => day.date === today) ?? days[0];
  const season = data?.season ?? null;
  const monthLabel = `${t(`month.${cursor.month}` as MessageKey)} ${cursor.year}`;

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo}
        title={t("page.almanac")}
        subtitle={lat === null ? undefined : t("almanac.location_note")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label={t("almanac.prev_month")}>
              <ChevronLeft className="size-5" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const now = new Date();
                setSelected(null);
                setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 });
              }}
            >
              {t("almanac.today")}
            </Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label={t("almanac.next_month")}>
              <ChevronRight className="size-5" aria-hidden />
            </Button>
          </div>
        }
      />

      {almanac.error ? <LoadError error={almanac.error} onRetry={almanac.reload} /> : null}

      <div className="grid-12 split-8-4-xl">
        <Card>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[28px] font-semibold tracking-[-0.02em]" aria-live="polite">
              {monthLabel}
            </h2>
            {season ? <Badge tone="accent">{`${season.name} · ${season.native_name}`}</Badge> : null}
          </div>
          {almanac.loading && !data ? (
            <Skeleton className="h-[420px]" />
          ) : (
            <div role="group" aria-label={monthLabel} className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
                <div key={weekday} aria-hidden className="pb-1 text-center text-[13px] font-semibold uppercase tracking-[0.04em] text-muted">
                  {t(`weekday.${weekday}` as MessageKey)}
                </div>
              ))}
              {Array.from({ length: firstWeekday }, (_, index) => (
                <div key={`pad-${index}`} aria-hidden />
              ))}
              {days.map((day) => {
                const number = Number(day.date.slice(8, 10));
                const isToday = day.date === today;
                const isSelected = selectedDay?.date === day.date;
                const hasTraditional = day.tasks.some((task) => task.traditional);
                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${number} ${t(`month.${cursor.month}` as MessageKey)}, ${day.phase_label}, ${formatNumber(day.illumination, intl, 0)}%`}
                    onClick={() => setSelected(day.date)}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-between gap-1 rounded-[12px] border px-0.5 py-1.5 sm:min-h-[76px] sm:py-2",
                      isSelected ? "border-text bg-bg" : "border-transparent bg-bg hover:border-line",
                    )}
                  >
                    <span className={cn("tabular inline-flex size-7 items-center justify-center rounded-full text-[15px] font-medium", isToday && "bg-accent text-on-accent")}>{number}</span>
                    <MoonGlyph illumination={day.illumination} phase={day.phase} southern={southern} size={20} />
                    <span className="flex h-1.5 gap-1" aria-hidden>
                      {day.events.length ? <span className="size-1.5 rounded-full bg-link" /> : null}
                      {day.tasks.length ? <span className={cn("size-1.5 rounded-full", hasTraditional ? "bg-warn" : "bg-accent")} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          {selectedDay ? <DayDetail day={selectedDay} southern={southern} /> : almanac.loading ? <Skeleton className="h-80 rounded-[20px]" /> : null}
          {data?.month_tasks.length ? (
            <Card>
              <CardHeader title={t("almanac.month_tasks")} />
              <TaskList tasks={data.month_tasks} />
            </Card>
          ) : null}
          {data?.phases.length ? (
            <Card>
              <CardHeader title={t("almanac.phases_title")} />
              <ul className="grid grid-cols-2 gap-3">
                {data.phases.map((phase) => (
                  <li key={phase.at} className="flex items-center gap-3 rounded-[12px] bg-bg p-3">
                    <MoonGlyph illumination={phase.name === "full_moon" ? 100 : phase.name === "new_moon" ? 0 : 50} phase={phase.name} southern={southern} size={28} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{phase.label}</p>
                      <p className="tabular text-[13px] text-muted">{formatDateTime(phase.at, intl)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>

      {data?.calendar.length ? (
        <Card className="mt-6">
          <CardHeader title={t("almanac.calendar_title")} description={season ? `${t("almanac.calendar_text")} ${season.astronomical_label}.` : t("almanac.calendar_text")} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-[15px]">
              <thead>
                <tr>
                  <th scope="col" className="w-48 pb-2 text-left font-medium text-muted" />
                  {Array.from({ length: 12 }, (_, index) => (
                    <th key={index} scope="col" className={cn("pb-2 text-center text-[13px] font-semibold uppercase text-muted", index + 1 === cursor.month && "text-text")}>
                      {t(`month.${index + 1}` as MessageKey).slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.calendar.map((row) => (
                  <tr key={`${row.crop}-${row.stage}`}>
                    <th scope="row" className="pr-3 text-left font-normal">
                      <span className="flex items-center gap-2.5">
                        <CropPhoto code={row.crop} alt="" sizes="36px" radius="sm" className="size-9" />
                        <span>
                          <span className="font-medium">{row.crop_label}</span> <span className="text-muted">· {row.stage_label}</span>
                        </span>
                      </span>
                    </th>
                    {Array.from({ length: 12 }, (_, index) => {
                      const active = row.months.includes(index + 1);
                      return (
                        <td key={index} className="px-0.5">
                          <div
                            className={cn("h-6 rounded-[6px]", active ? "bg-accent" : "bg-bg", index + 1 === cursor.month && "outline outline-1 outline-text")}
                            aria-label={active ? `${row.crop_label} ${row.stage_label} ${t(`month.${index + 1}` as MessageKey)}` : undefined}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card tone="outline" className="mt-6">
        <CardHeader title={t("almanac.legend_title")} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-3 rounded-[16px] border border-dashed border-warn p-4">
            <Star className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
            <div>
              <p className="text-[17px] font-semibold">{t("almanac.legend_traditional")}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{data?.traditional_knowledge_note || t("almanac.legend_traditional_text")}</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-[16px] border border-line p-4">
            <Leaf className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-[17px] font-semibold">{t("almanac.legend_evidence")}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{t("almanac.legend_evidence_text")}</p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
