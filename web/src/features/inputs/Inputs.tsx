"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, InlineEmpty, ErrorNote } from "@/components/ui/EmptyState";
import { Photo } from "@/components/ui/Photo";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { formatNumber, formatPen } from "@/lib/format";
import type { InputsResult } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useCatalog, useCrops } from "../shared/data";
import { useLabels } from "../shared/labels";
import { useModuleHelp } from "../shared/help";
import { CropPhoto, SpeciesPicker, SpeciesPickerSkeleton } from "../shared/CropPhoto";

const CATEGORIES = ["fertilizer", "seed", "agrochemical", "amendment", "equipment"];

function Calculator() {
  const { t, tk, intl } = useI18n();
  const labels = useLabels();
  const catalog = useCatalog();
  const crops = useCrops();
  const [species, setSpecies] = useState("");
  const [area, setArea] = useState("1");
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<InputsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const speciesValue = species || catalog.data?.[0]?.code || "";
  const areaNumber = Number(area);
  const valid = speciesValue !== "" && Number.isFinite(areaNumber) && areaNumber > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      setResult(await api.calculateInputs({ species: speciesValue, area_ha: areaNumber, target_yield_t_ha: target ? Number(target) : undefined }));
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-12 split-5-7">
      <Card>
        <CardHeader title={t("inputs.calc_title")} description={t("inputs.calc_text")} />
        <form onSubmit={submit} className="flex flex-col gap-4">
          {crops.data?.length ? (
            <Select
              label={t("inputs.from_crop")}
              placeholder={t("common.select")}
              options={crops.data.map((crop) => ({ value: String(crop.id), label: crop.name }))}
              value=""
              onChange={(e) => {
                const crop = crops.data?.find((item) => String(item.id) === e.target.value);
                if (crop) {
                  setSpecies(crop.species);
                  setArea(String(crop.area_ha));
                }
              }}
            />
          ) : null}
          {catalog.data ? (
            <SpeciesPicker label={t("inputs.species")} name="inputs-species" catalog={catalog.data} value={speciesValue} onChange={setSpecies} columns="3" />
          ) : (
            <SpeciesPickerSkeleton label={t("inputs.species")} columns="3" />
          )}
          <Input label={t("inputs.area")} inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
          <Input label={t("inputs.target")} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} hint={t("inputs.target_hint")} />
          <Button type="submit" loading={busy} disabled={!valid}>
            {busy ? t("inputs.calculating") : t("inputs.calculate")}
          </Button>
        </form>
      </Card>
      <div>
        {error ? <ErrorNote message={error} /> : null}
        {busy && !result ? <Skeleton className="h-80 rounded-[20px]" /> : null}
        {result ? (
          <Card>
            <div className="mb-4 flex items-center gap-4">
              <CropPhoto code={result.species} alt={labels.species(result.species, catalog.data)} sizes="80px" className="size-20" />
              <p className="text-[19px] font-semibold">{labels.species(result.species, catalog.data)}</p>
            </div>
            <CardHeader
              title={t("inputs.result_title")}
              description={`${labels.species(result.species, catalog.data)} · ${formatNumber(result.area_ha, intl, 2)} ${t("common.ha")} · ${formatNumber(result.target_yield_t_ha, intl)} t/${t("common.ha")}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[15px]">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t("inputs.item")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      {t("inputs.quantity")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      {t("inputs.unit_price")}
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      {t("inputs.subtotal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.code} className="border-b border-line">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{tk(`input.${item.code}`, item.name)}</p>
                        <p className="text-[13px] text-muted">{item.product_id ? item.name : labels.category(item.kind)}</p>
                      </td>
                      <td className="tabular py-3 pr-3 text-right">
                        {formatNumber(item.quantity, intl)} {item.unit}
                      </td>
                      <td className="tabular py-3 pr-3 text-right">{formatPen(item.unit_price_pen, intl)}</td>
                      <td className="tabular py-3 text-right font-medium">{formatPen(item.subtotal_pen, intl)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={3} className="pt-4 text-left text-[17px] font-semibold">
                      {t("inputs.total")}
                    </th>
                    <td className="tabular pt-4 text-right text-[21px] font-semibold text-accent">{formatPen(result.total_pen, intl)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-[12px] bg-bg p-3">
                <dt className="text-[13px] text-muted">{t("inputs.per_ha")}</dt>
                <dd className="tabular text-[17px] font-semibold">{formatPen(result.cost_per_ha_pen, intl)}</dd>
              </div>
              {([
                ["N", result.nutrient_demand.n_kg],
                ["P₂O₅", result.nutrient_demand.p2o5_kg],
                ["K₂O", result.nutrient_demand.k2o_kg],
              ] as const).map(([label, value]) => (
                <div key={label} className="rounded-[12px] bg-bg p-3">
                  <dt className="text-[13px] text-muted">
                    {t("inputs.demand")} · {label}
                  </dt>
                  <dd className="tabular text-[17px] font-semibold">{formatNumber(value, intl, 0)} kg</dd>
                </div>
              ))}
            </dl>
            {result.notes.length ? (
              <div className="mt-5">
                <h3 className="text-[17px] font-semibold">{t("inputs.notes")}</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
                  {result.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      {t(`inputs.note.${note}`)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-4 text-[14px] text-muted">{t("inputs.disclaimer")}</p>
          </Card>
        ) : !busy ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-line p-8 text-center lg:min-h-[420px]">
            <Photo name="soil" alt="" rounded={false} sizes="96px" className="size-24 rounded-full" />
            <p className="max-w-sm text-[16px] leading-relaxed text-muted">{t("inputs.empty_text")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Catalogue() {
  const { t, intl } = useI18n();
  const labels = useLabels();
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const products = useAsync(() => api.products(category || undefined, deferred || undefined), [category, deferred], `products:${category}:${deferred}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Input label={t("inputs.search")} type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          <Search className="pointer-events-none absolute bottom-3.5 left-3.5 size-4 text-muted" aria-hidden />
        </div>
        <Tabs
          label={t("admin.product_category")}
          size="sm"
          value={category || "all"}
          onChange={(value) => setCategory(value === "all" ? "" : value)}
          items={[{ value: "all", label: t("inputs.all_categories") }, ...CATEGORIES.map((value) => ({ value, label: labels.category(value) }))]}
        />
      </div>
      {products.error ? (
        <LoadError error={products.error} onRetry={products.reload} />
      ) : !products.data ? (
        <SkeletonGrid count={6} className="sm:grid-cols-2 lg:grid-cols-3" itemClassName="h-44" />
      ) : products.data.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((product) => (
            <li key={product.id} className="flex flex-col gap-3 rounded-[20px] bg-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[17px] font-semibold leading-snug">{product.name}</p>
                <Badge>{labels.category(product.category)}</Badge>
              </div>
              <p className="tabular text-[24px] font-semibold tracking-[-0.02em]">
                {formatPen(product.price_pen, intl)} <span className="text-[15px] font-normal text-muted">{t("inputs.per_unit", { unit: product.unit })}</span>
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 text-[15px] text-muted">
                <span className="truncate">{product.supplier ?? "—"}</span>
                {product.url ? (
                  <a href={product.url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-1 text-link hover:underline">
                    {t("inputs.view_supplier")}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : deferred || category ? (
        <InlineEmpty>{t("inputs.catalogue_empty")}</InlineEmpty>
      ) : (
        <EmptyState photo="market" title={t("inputs.tab_catalogue")} text={t("inputs.catalogue_empty")} />
      )}
    </div>
  );
}

export function Inputs() {
  const { t } = useI18n();
  const help = useModuleHelp("inputs");
  const [tab, setTab] = useState<"calculator" | "catalogue">("calculator");
  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo}
        title={t("page.inputs")}
        actions={
          <Tabs
            label={t("page.inputs")}
            value={tab}
            onChange={setTab}
            items={[
              { value: "calculator", label: t("inputs.tab_calculator") },
              { value: "catalogue", label: t("inputs.tab_catalogue") },
            ]}
          />
        }
      />
      {tab === "calculator" ? <Calculator /> : <Catalogue />}
    </>
  );
}
