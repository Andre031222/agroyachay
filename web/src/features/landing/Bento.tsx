"use client";

import { useLayoutEffect, useRef, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, BookOpen, Bug, Check, CircleCheck, Cpu, Languages, Lock, Snowflake, Sprout, Thermometer, TrendingUp } from "lucide-react";
import { LOCALES, useI18n, type MessageKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Gauge } from "../monitoring/Gauge";
import { LandingLoop } from "../hardware/LandingLoop";
import { LINKS } from "./links";
import styles from "./landing.module.css";

const NATIVE: Record<Locale, string> = { es: "Español", qu: "Runasimi", ay: "Aymar aru", en: "English" };

const WEEK = [
  { min: 1, max: 15 },
  { min: -2, max: 12 },
  { min: 0, max: 13 },
  { min: 3, max: 16 },
  { min: 4, max: 17 },
  { min: 2, max: 15 },
  { min: 3, max: 16 },
];
const WEEK_LOW = -4;
const WEEK_HIGH = 18;

const FACTORS: { key: MessageKey; value: number }[] = [
  { key: "landing.factor_climate", value: 0.94 },
  { key: "landing.factor_stage", value: 1 },
  { key: "landing.factor_area", value: 1.06 },
];

function degrees(value: number) {
  return `${value < 0 ? "−" : ""}${Math.abs(value)}°`;
}

function Tile({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <article id={id} data-tile className={cn(styles.tile, "relative min-w-0 scroll-mt-20 overflow-hidden rounded-[24px] bg-surface lg:rounded-[28px]", className)}>
      {children}
    </article>
  );
}

function ExampleBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-[980px] border border-line bg-bg px-2.5 text-[12px] font-medium text-muted">
      {t("landing.example")}
    </span>
  );
}

function TileHead({ icon: Icon, title, example }: { icon: ComponentType<{ className?: string }>; title: string; example?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h3 className="flex min-h-6 items-center gap-2 text-[15px] font-semibold text-muted">
        <Icon className="size-[18px] shrink-0 text-accent" aria-hidden />
        {title}
      </h3>
      {example ? <ExampleBadge /> : null}
    </div>
  );
}

function NodeTile() {
  const { t } = useI18n();
  return (
    <Tile className="sm:col-span-6 lg:col-span-7 lg:row-span-2">
      <LandingLoop
        title={t("hw.kit_title")}
        text={t("landing.tile_node_text")}
        className="h-full"
        fill
      />
    </Tile>
  );
}

function ReadingTile() {
  const { t } = useI18n();
  const label = t("metric.air_temperature");
  return (
    <Tile className="flex flex-col p-6 sm:col-span-3 sm:p-8 lg:col-span-5">
      <TileHead icon={Thermometer} title={t("landing.tile_reading_title")} example />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="display tabular text-[56px] lg:text-[64px]">9&nbsp;°C</p>
          <p className="mt-1 text-[14px] text-muted">{label}</p>
        </div>
        <Gauge value={9} scale={[-5, 30]} band={[5, 20]} status="within" label={`${label}: 9 °C`} size={148} />
      </div>
      <p className="mt-auto flex items-center gap-2 pt-5 text-[17px] font-semibold leading-snug">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-accent" />
        {t("verdict.air_temperature.within")}
      </p>
    </Tile>
  );
}

function WeatherTile() {
  const { t, intl } = useI18n();
  const weekday = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });
  const span = WEEK_HIGH - WEEK_LOW;
  return (
    <Tile className="flex flex-col p-6 sm:col-span-3 sm:p-8 lg:col-span-5">
      <TileHead icon={Snowflake} title={t("page.weather")} example />
      <p className="mt-4 text-[21px] font-semibold leading-tight tracking-[-0.01em] text-warn">{t("landing.tile_weather_alert")}</p>
      <p className="mt-1 text-[15px] text-muted">{t("landing.tile_weather_advice")}</p>
      <ol aria-label={t("landing.tile_weather_week")} className="mt-auto grid grid-cols-7 gap-1 pt-5">
        {WEEK.map((day, index) => {
          const name = index === 0 ? t("landing.tile_weather_today") : weekday.format(new Date(Date.UTC(2024, 0, 1 + index, 12)));
          const frost = day.min <= 0;
          return (
            <li key={index} className="flex min-w-0 flex-col items-center gap-1.5">
              <span className="sr-only">
                {name}: {degrees(day.min)} – {degrees(day.max)}
              </span>
              <span aria-hidden className="tabular text-[12px] text-muted">
                {degrees(day.max)}
              </span>
              <span aria-hidden className="relative h-14 w-1.5 rounded-full bg-line">
                <span
                  className={cn("absolute inset-x-0 rounded-full", frost ? "bg-warn" : "bg-accent")}
                  style={{ bottom: `${((day.min - WEEK_LOW) / span) * 100}%`, height: `${((day.max - day.min) / span) * 100}%` }}
                />
              </span>
              <span aria-hidden className={cn("tabular text-[12px]", frost ? "font-semibold text-warn" : "text-muted")}>
                {degrees(day.min)}
              </span>
              <span aria-hidden className="w-full truncate text-center text-[12px] font-medium">
                {name}
              </span>
            </li>
          );
        })}
      </ol>
    </Tile>
  );
}

function PestTile() {
  const { t } = useI18n();
  return (
    <Tile className="p-6 sm:col-span-6 sm:p-8 lg:col-span-8">
      <TileHead icon={Bug} title={t("landing.tile_pests_title")} example />
      <div className="mt-5 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center lg:grid-cols-[196px_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-bg sm:aspect-square">
          <Image src="/images/leaf.jpg" alt={t("landing.tile_pests_alt")} fill sizes="(min-width: 1024px) 196px, (min-width: 640px) 180px, 100vw" className="object-cover" />
        </div>
        <div className="min-w-0">
          <div className="rounded-[20px] border border-line bg-bg p-5">
            <p className="text-[19px] font-semibold leading-snug tracking-[-0.01em]">{t("landing.tile_pests_result")}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[14px] text-muted">{t("yield.confidence")}</span>
              <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full w-[85%] rounded-full bg-accent" />
              </span>
              <span className="tabular text-[15px] font-semibold">85&nbsp;%</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[15px] font-medium text-accent">
              <CircleCheck className="size-[18px] shrink-0" aria-hidden />
              {t("landing.tile_pests_plan")}
            </p>
          </div>
          <p className="mt-3 flex items-start gap-2 text-[14px] leading-snug text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("landing.tile_pests_note")}
          </p>
        </div>
      </div>
    </Tile>
  );
}

function CropTile() {
  const { t } = useI18n();
  return (
    <Tile className="flex flex-col sm:col-span-3 lg:col-span-4 lg:row-span-2">
      <div className="relative aspect-[4/3] bg-line sm:aspect-auto sm:min-h-[240px] sm:flex-1">
        <Image
          src="/images/crops/quinoa.jpg"
          alt={t("landing.tile_crops_alt")}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="bg-surface p-6 sm:p-8">
        <TileHead icon={Sprout} title={t("page.crops")} />
        <p className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.01em]">{t("landing.tile_crops_text")}</p>
      </div>
    </Tile>
  );
}

function LanguagesTile() {
  const { t, locale, setLocale } = useI18n();
  const { user, setUser } = useAuth();
  const choose = (next: Locale) => {
    if (next === locale) return;
    setLocale(next);
    if (user && user.locale !== next) api.updateMe({ locale: next }).then(setUser, () => undefined);
  };
  return (
    <Tile id="languages" className="flex flex-col p-6 sm:col-span-3 sm:p-8 lg:col-span-4">
      <TileHead icon={Languages} title={t("landing.tile_languages_title")} />
      <ul className="mt-3 flex flex-col">
        {LOCALES.map((code) => {
          const selected = code === locale;
          return (
            <li key={code}>
              <button
                type="button"
                lang={code}
                aria-pressed={selected}
                onClick={() => choose(code)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 rounded-[12px] text-left text-[28px] font-semibold leading-tight tracking-[-0.02em] transition-colors duration-150",
                  selected ? "text-text" : "text-muted hover:text-text",
                )}
              >
                {NATIVE[code]}
                {selected ? <Check className="size-6 shrink-0 text-accent" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto pt-3 text-[14px] text-muted">{t("landing.tile_languages_text")}</p>
    </Tile>
  );
}

function YieldTile() {
  const { t, intl } = useI18n();
  const number = new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <Tile className="flex flex-col p-6 sm:col-span-6 sm:p-8 lg:col-span-4">
      <TileHead icon={TrendingUp} title={t("reports.section_finance")} example />
      <p className="display tabular mt-4 text-[44px] lg:text-[48px]">S/&nbsp;28&nbsp;635</p>
      <p className="mt-1 text-[15px] text-muted">{t("landing.tile_yield_text")}</p>
      <ul className="mt-auto flex flex-col gap-2 pt-5">
        {FACTORS.map((factor) => {
          const offset = Math.min(1, Math.abs(factor.value - 1) / 0.25) * 50;
          return (
            <li key={factor.key} className="grid grid-cols-[minmax(0,5.5rem)_1fr_2.5rem] items-center gap-3 text-[13px]">
              <span className="truncate text-muted">{t(factor.key)}</span>
              <span aria-hidden className="relative h-1.5 rounded-full bg-line">
                <span className="absolute -top-1 left-1/2 h-3.5 w-px bg-muted" />
                {factor.value !== 1 ? (
                  <span
                    className={cn("absolute inset-y-0 rounded-full", factor.value < 1 ? "bg-warn" : "bg-accent")}
                    style={factor.value < 1 ? { right: "50%", width: `${offset}%` } : { left: "50%", width: `${offset}%` }}
                  />
                ) : null}
              </span>
              <span className="tabular text-right font-medium">{number.format(factor.value)}</span>
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}

function ResearchTile() {
  const { t } = useI18n();
  const links: { label: MessageKey; meta: string; href: string }[] = [
    { label: "footer.paper", meta: "doi:10.1016/j.softx.2026.103037", href: LINKS.paper },
    { label: "footer.zenodo", meta: "doi:10.5281/zenodo.20829992", href: LINKS.zenodo },
    { label: "footer.license", meta: "MIT", href: LINKS.license },
    { label: "footer.github", meta: "Andre031222/agroyachay", href: LINKS.github },
  ];
  return (
    <Tile id="research" className="p-6 sm:col-span-6 sm:p-8 lg:col-span-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="min-w-0 lg:w-[300px] lg:shrink-0">
          <TileHead icon={BookOpen} title={t("nav.research")} />
          <p className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.01em]">{t("landing.tile_research_text")}</p>
          <p className="mt-4 inline-flex min-h-8 items-center gap-2 rounded-[980px] border border-line bg-bg px-3 text-[13px] font-medium">
            <Cpu className="size-4 text-accent" aria-hidden />
            {t("landing.agrocommish")}
          </p>
        </div>
        <ul className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {links.map((link) => (
            <li key={link.href} className="min-w-0">
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full min-h-11 flex-col justify-between gap-3 rounded-[20px] border border-line bg-bg p-4 transition-colors duration-150 hover:border-muted"
              >
                <span className="flex items-start justify-between gap-2 text-[15px] font-semibold leading-snug">
                  {t(link.label)}
                  <ArrowUpRight className="size-4 shrink-0 text-muted group-hover:text-text" aria-hidden />
                </span>
                <span className="font-mono text-[12px] text-link [overflow-wrap:anywhere]">{link.meta.replace("/", "/\u200b")}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Tile>
  );
}

export function Bento() {
  const { t } = useI18n();
  const grid = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = grid.current;
    if (!node || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pending = Array.from(node.querySelectorAll<HTMLElement>("[data-tile]")).filter(
      (tile) => tile.getBoundingClientRect().top > window.innerHeight,
    );
    pending.forEach((tile) => tile.setAttribute("data-pending", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.removeAttribute("data-pending");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );
    pending.forEach((tile) => observer.observe(tile));
    return () => {
      observer.disconnect();
      pending.forEach((tile) => tile.removeAttribute("data-pending"));
    };
  }, []);

  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 px-4 sm:px-6">
      <h2 id="features-title" className="sr-only">
        {t("nav.features")}
      </h2>
      <div ref={grid} className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3 sm:grid-cols-6 lg:grid-cols-12">
        <NodeTile />
        <ReadingTile />
        <WeatherTile />
        <PestTile />
        <CropTile />
        <LanguagesTile />
        <YieldTile />
        <ResearchTile />
      </div>
    </section>
  );
}
