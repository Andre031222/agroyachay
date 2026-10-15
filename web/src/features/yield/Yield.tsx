"use client";

import { useState, type FormEvent } from "react";
import { Sigma } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { Meter } from "@/components/ui/Meter";
import { ErrorNote, InlineEmpty } from "@/components/ui/EmptyState";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatNumber, formatPen, todayIso } from "@/lib/format";
import type { ClimateFactor, YieldEstimate, YieldFactors, YieldInput } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useCatalog, useCrops } from "../shared/data";
import { useLabels } from "../shared/labels";
import { useModuleHelp } from "../shared/help";
import { CropPhoto, SpeciesPicker, SpeciesPickerSkeleton } from "../shared/CropPhoto";

interface FactorRow {
  key: string;
  symbol: string;
  value: number;
  detail?: string;
}

function useFactorRows() {
  const { t, intl } = useI18n();
  return (factors: YieldFactors) => {
    const climate = (key: string, symbol: string, factor: ClimateFactor): FactorRow => ({
      key,
      symbol,
      value: factor.value,
      detail: t("yield.observed", {
        value: factor.observed === null ? "—" : formatNumber(factor.observed, intl),
        min: formatNumber(factor.window[0], intl),
        max: formatNumber(factor.window[1], intl),
      }),
    });
    const multipliers: FactorRow[] = [
      { key: "f_cli", symbol: "f_cli", value: factors.f_cli },
      climate("g_temperature", "g_T", factors.g_temperature),
      climate("g_humidity", "g_H", factors.g_humidity),
      climate("g_rainfall", "g_P", factors.g_rainfall),
      {
        key: "f_phe",
        symbol: "f_phe",
        value: factors.f_phe.value,
        detail: `${t("yield.phe_detail", { days: factors.f_phe.days_since_sowing ?? "—", cycle: factors.f_phe.cycle_days })}${factors.f_phe.assumed ? ` · ${t("yield.assumed")}` : ""}`,
      },
      { key: "f_area", symbol: "f_area", value: factors.f_area },
    ];
    const others: FactorRow[] = [
      { key: "base_yield_t_ha", symbol: "y₀ (t/ha)", value: factors.base_yield_t_ha },
      { key: "delta_data", symbol: "Δ_data", value: factors.delta_data },
      { key: "delta_phe", symbol: "Δ_phe", value: factors.delta_phe },
      { key: "sensor_readings", symbol: "n", value: factors.sensor_readings },
    ];
    return { multipliers, others };
  };
}

function FactorBar({ factor }: { factor: FactorRow }) {
  const { t, intl } = useI18n();
  const delta = Math.max(-0.4, Math.min(0.4, factor.value - 1));
  const width = (Math.abs(delta) / 0.4) * 50;
  const reduces = delta < -0.005;
  const neutral = Math.abs(delta) <= 0.005;
  const tone = neutral ? "muted" : reduces ? "warn" : "accent";
  return (
    <li className="grid grid-cols-[96px_1fr_56px] items-center gap-3 py-2.5 sm:grid-cols-[180px_1fr_64px]">
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-snug">{t(`yield.label.${factor.key}` as MessageKey)}</span>
        <span className="block font-mono text-[12px] text-muted">{factor.symbol}</span>
        {factor.detail ? <span className="block text-[13px] leading-snug text-muted">{factor.detail}</span> : null}
      </span>
      <span
        className="relative h-6 rounded-[6px] bg-bg"
        role="img"
        aria-label={`${t(`yield.label.${factor.key}` as MessageKey)} ${formatNumber(factor.value, intl, 3)}: ${neutral ? t("yield.no_effect") : reduces ? t("yield.reduces") : t("yield.increases")}`}
      >
        <span className="absolute inset-y-0 left-1/2 w-px bg-muted" aria-hidden />
        <span
          aria-hidden
          className={`absolute inset-y-1 rounded-[4px] ${tone === "muted" ? "bg-muted" : tone === "warn" ? "bg-warn" : "bg-accent"}`}
          style={reduces ? { right: "50%", width: `${width}%` } : { left: "50%", width: `${Math.max(width, 0.5)}%` }}
        />
      </span>
      <span className={`tabular text-right text-[17px] font-semibold ${tone === "muted" ? "text-muted" : tone === "warn" ? "text-warn" : "text-accent"}`}>{new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(factor.value)}</span>
    </li>
  );
}

function Result({ estimate }: { estimate: YieldEstimate }) {
  const { t, intl } = useI18n();
  const labels = useLabels();
  const catalog = useCatalog();
  const confidence = estimate.confidence;
  const { multipliers, others } = useFactorRows()(estimate.factors);
  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-[20px] bg-surface">
        <CropPhoto code={estimate.species} alt={labels.species(estimate.species, catalog.data)} variant="full" shape="wide" radius="none" sizes="(min-width: 1024px) 60vw, 100vw" />
        <div className="p-6 sm:p-8">
        <p className="text-[17px] font-medium text-muted">{t("yield.revenue")}</p>
        <p className="tabular display mt-2 text-[48px] text-accent sm:text-[64px]">{formatPen(estimate.revenue_pen, intl)}</p>
        <p className="mt-2 text-[17px] text-muted">
          {labels.species(estimate.species, catalog.data)} · {formatNumber(estimate.area_ha, intl, 2)} {t("common.ha")}
          {` · ${formatPen(estimate.price_pen_kg, intl)} / kg`}
        </p>
        <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-[14px] text-muted">{t("yield.per_ha")}</dt>
            <dd className="tabular text-[24px] font-semibold">
              {formatNumber(estimate.yield_t_ha, intl, 2)} <span className="text-[15px] font-normal text-muted">{t("yield.t_ha")}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[14px] text-muted">{t("yield.total")}</dt>
            <dd className="tabular text-[24px] font-semibold">
              {formatNumber(estimate.total_t, intl, 2)} <span className="text-[15px] font-normal text-muted">{t("yield.t")}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[14px] text-muted">{t("yield.confidence")}</dt>
            <dd className="mt-1 flex items-center gap-3">
              <span className="tabular text-[24px] font-semibold">{formatNumber(confidence, intl, 0)}%</span>
              <Meter value={confidence} label={t("yield.confidence")} tone={confidence >= 80 ? "accent" : "warn"} className="flex-1" />
            </dd>
          </div>
        </dl>
      </div>
      </div>
      <Card>
        <CardHeader title={t("yield.factors_title")} description={t("yield.neutral_note")} action={<Sigma className="size-5 text-muted" aria-hidden />} />
        {multipliers.length ? (
          <>
            <div className="mb-1 grid grid-cols-[96px_1fr_56px] gap-3 text-[13px] text-muted sm:grid-cols-[180px_1fr_64px]">
              <span />
              <span className="flex justify-between">
                <span>{t("yield.reduces")}</span>
                <span>{new Intl.NumberFormat(intl, { minimumFractionDigits: 1 }).format(1)}</span>
                <span>{t("yield.increases")}</span>
              </span>
              <span />
            </div>
            <ul className="divide-y divide-line">
              {multipliers.map((factor) => (
                <FactorBar key={factor.key} factor={factor} />
              ))}
            </ul>
          </>
        ) : null}
        {others.length ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {others.map((factor) => (
              <div key={factor.key} className="rounded-[12px] bg-bg p-3">
                <dt className="text-[14px] text-muted">{t(`yield.label.${factor.key}` as MessageKey)}</dt>
                <dd className="tabular text-[17px] font-semibold">{formatNumber(factor.value, intl, 2)}</dd>
                {factor.detail ? <dd className="text-[13px] text-muted">{factor.detail}</dd> : null}
              </div>
            ))}
          </dl>
        ) : null}
        {estimate.factors.data_sources.length ? (
          <p className="mt-4 text-[14px] text-muted">
            {t("yield.sources")}: {estimate.factors.data_sources.join(", ")}
          </p>
        ) : null}
        <p className="mt-5 overflow-x-auto rounded-[12px] bg-bg px-4 py-3 font-mono text-[14px]">{t("yield.model_note")}</p>
      </Card>
    </div>
  );
}

export function Yield() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("yield");
  const { user } = useAuth();
  const labels = useLabels();
  const catalog = useCatalog();
  const crops = useCrops();
  const history = useAsync(() => api.yieldHistory(), ["yield-history"], "yield:history");
  const [mode, setMode] = useState<"crop" | "manual">("crop");
  const [cropId, setCropId] = useState("");
  const [species, setSpecies] = useState("");
  const [area, setArea] = useState("1");
  const [sowing, setSowing] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<YieldEstimate | null>(null);

  const hasCrops = !!crops.data?.length;
  const effectiveMode = hasCrops ? mode : "manual";
  const speciesValue = species || catalog.data?.[0]?.code || "";
  const selectedCrop = cropId || (crops.data?.[0] ? String(crops.data[0].id) : "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    let input: YieldInput;
    if (effectiveMode === "crop") {
      if (!selectedCrop) return;
      input = { crop_id: Number(selectedCrop) };
    } else {
      const areaNumber = Number(area);
      if (!speciesValue || !(areaNumber > 0) || !sowing) return;
      input = { species: speciesValue, area_ha: areaNumber, sowing_date: sowing, lat: user?.latitude ?? undefined, lon: user?.longitude ?? undefined };
    }
    setBusy(true);
    setError("");
    try {
      setEstimate(await api.estimateYield(input));
      history.reload();
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo} title={t("page.yield")} />
      <div className="grid-12 split-5-7">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t("yield.form_title")} />
            <form onSubmit={submit} className="flex flex-col gap-4">
              {hasCrops ? (
                <Tabs
                  label={t("yield.form_title")}
                  size="sm"
                  value={mode}
                  onChange={setMode}
                  items={[
                    { value: "crop", label: t("yield.mode_crop") },
                    { value: "manual", label: t("yield.mode_manual") },
                  ]}
                />
              ) : crops.data ? (
                <p className="text-[15px] text-muted">{t("yield.no_crops")}</p>
              ) : null}
              {effectiveMode === "crop" ? (
                <Select
                  label={t("yield.pick_crop")}
                  options={(crops.data ?? []).map((crop) => ({ value: String(crop.id), label: `${crop.name} · ${labels.species(crop.species, catalog.data)}` }))}
                  value={selectedCrop}
                  onChange={(e) => setCropId(e.target.value)}
                />
              ) : (
                <>
                  {catalog.data ? <SpeciesPicker label={t("yield.species")} name="yield-species" catalog={catalog.data} value={speciesValue} onChange={setSpecies} columns="3" /> : <SpeciesPickerSkeleton label={t("yield.species")} columns="3" />}
                  <Input label={t("yield.area")} inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
                  <Input label={t("yield.sowing_date")} type="date" max={todayIso()} value={sowing} onChange={(e) => setSowing(e.target.value)} required />
                </>
              )}
              <Button type="submit" loading={busy}>
                {busy ? t("yield.estimating") : t("yield.estimate")}
              </Button>
            </form>
          </Card>
          <Card>
            <CardHeader title={t("yield.history_title")} />
            {history.error ? (
              <LoadError error={history.error} onRetry={history.reload} />
            ) : !history.data ? (
              <Skeleton className="h-24" />
            ) : history.data.length ? (
              <ul className="divide-y divide-line">
                {history.data.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setEstimate(item)} className="flex min-h-12 w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-bg">
                      <CropPhoto code={item.species} alt="" sizes="44px" radius="sm" className="size-11" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[17px] font-medium">{item.crop_name ?? labels.species(item.species, catalog.data)}</span>
                        <span className="block text-[13px] text-muted">{formatDate(item.created_at, intl)}</span>
                      </span>
                      <span className="tabular text-[15px] font-semibold">{formatPen(item.revenue_pen, intl)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <InlineEmpty>{t("yield.history_empty")}</InlineEmpty>
            )}
          </Card>
        </div>
        <div>
          {error ? <ErrorNote message={error} className="mb-4" /> : null}
          {busy ? (
            <Skeleton className="h-96 rounded-[20px]" />
          ) : estimate ? (
            <Result estimate={estimate} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-line p-8 text-center lg:min-h-[420px]">
              <Photo name="harvest" alt="" rounded={false} sizes="96px" className="size-24 rounded-full" />
              <p className="max-w-sm text-[16px] leading-relaxed text-muted">{t("yield.empty_text")}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
