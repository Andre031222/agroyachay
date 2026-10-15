"use client";

import { useState, type ReactNode } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { LogoMark } from "@/components/common/Logo";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, formatNumber, formatPen, METRIC_UNIT } from "@/lib/format";
import type { ReportKind } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useCatalog } from "../shared/data";
import { useLabels } from "../shared/labels";
import { useModuleHelp } from "../shared/help";
import { CropPhoto } from "../shared/CropPhoto";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="print-break border-t border-line pt-6">
      <h2 className="mb-4 text-[21px] font-semibold tracking-[-0.015em]">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="text-[15px] text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[15px]">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            {head.map((cell, index) => (
              <th key={index} scope="col" className="py-2 pr-3 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="tabular py-2.5 pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Reports() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("reports");
  const labels = useLabels();
  const catalog = useCatalog();
  const summary = useAsync(() => api.reportSummary(), ["report"], "reports");
  const [downloading, setDownloading] = useState<ReportKind | null>(null);

  const download = async (kind: ReportKind) => {
    setDownloading(kind);
    try {
      const blob = await api.reportFile(kind);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agroyachay-${kind}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      toast.error({ title: t("reports.download_failed"), description: errorMessage(failure, t) });
    } finally {
      setDownloading(null);
    }
  };

  const data = summary.data;
  const empty = t("reports.empty_section");

  return (
    <>
      <div className="no-print">
        <PageHeader intro={help.intro} howTo={help.howTo}
          title={t("page.reports")}
          subtitle={t("reports.intro")}
          actions={
            <Button onClick={() => window.print()} disabled={!data} icon={<Printer className="size-4" aria-hidden />}>
              {t("reports.print")}
            </Button>
          }
        />
        <div className="mb-8 rounded-[20px] bg-surface p-5">
          <p className="mb-3 text-[17px] font-semibold">{t("reports.downloads")}</p>
          <div className="flex flex-wrap gap-2">
            {(["crops", "readings", "finance"] as const).map((kind) => (
              <Button key={kind} variant="outline" loading={downloading === kind} icon={<Download className="size-4" aria-hidden />} onClick={() => download(kind)}>
                {t(`reports.download_${kind}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {summary.error ? <LoadError error={summary.error} onRetry={summary.reload} /> : null}
      {!data && !summary.error ? <Skeleton className="h-[600px] rounded-[20px]" /> : null}
      {data ? (
        <article className="flex flex-col gap-8 rounded-[20px] border border-line p-6 sm:p-10 print:border-0 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[17px] font-semibold">
                <LogoMark size={24} />
                AgroYachay
              </div>
              <h1 className="display mt-4 text-[36px]">{t("reports.title")}</h1>
              <p className="mt-1 text-[17px] text-muted [overflow-wrap:anywhere]">
                {t("reports.owner")}: {data.user.name} · {data.user.email}
                {data.user.place_name ? ` · ${data.user.place_name}` : ""}
              </p>
            </div>
            <p className="text-[15px] text-muted">{t("reports.generated", { date: formatDateTime(data.generated_at, intl) })}</p>
          </header>

          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: t("reports.total_area"), value: `${formatNumber(data.totals.area_ha, intl, 2)} ${t("common.ha")}` },
              { label: t("reports.expected"), value: formatPen(data.totals.expected_revenue_pen, intl) },
              { label: t("reports.inputs_cost"), value: formatPen(data.totals.input_cost_pen, intl) },
              { label: t("reports.margin"), value: formatPen(data.totals.expected_margin_pen, intl) },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] bg-surface p-4 print:border print:border-line">
                <dt className="text-[14px] text-muted">{item.label}</dt>
                <dd className="tabular mt-1 text-[21px] font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>

          <Section title={t("reports.section_crops")}>
            <Table
              empty={empty}
              head={[t("crops.name"), t("crops.species"), t("crops.area"), t("crops.sowing_date"), t("crops.status")]}
              rows={data.crops.map((crop) => [
                <span key="name" className="flex items-center gap-2.5">
                  <CropPhoto code={crop.species} alt="" sizes="36px" radius="sm" className="size-9" />
                  {crop.name}
                </span>,
                labels.species(crop.species, catalog.data), `${formatNumber(crop.area_ha, intl, 2)} ${t("common.ha")}`, formatDate(crop.sowing_date, intl), t(`status.${crop.status}`)])}
            />
          </Section>

          <Section title={t("reports.section_devices")}>
            <Table
              empty={empty}
              head={[t("devices.name"), t("devices.esp32_id"), t("devices.crop"), t("common.status")]}
              rows={data.devices.map((device) => [device.name ?? "—", device.esp32_id, device.crop_name ?? "—", t(`devices.status.${device.status}`)])}
            />
          </Section>

          <Section title={t("reports.section_readings")}>
            <Table
              empty={empty}
              head={[t("reports.metric"), t("monitoring.min"), t("monitoring.avg"), t("monitoring.max"), t("reports.readings")]}
              rows={data.readings_30d.map((row) => {
                const unit = METRIC_UNIT[row.metric];
                return [t(`metric.${row.metric}`), `${formatNumber(row.min, intl)} ${unit}`, `${formatNumber(row.avg, intl)} ${unit}`, `${formatNumber(row.max, intl)} ${unit}`, formatNumber(row.count, intl, 0)];
              })}
            />
          </Section>

          <Section title={t("reports.section_diagnoses")}>
            <Table
              empty={empty}
              head={[t("common.date"), t("pests.crop"), t("pests.result_title"), t("pests.confidence")]}
              rows={data.diagnoses.map((item) => [
                formatDate(item.created_at, intl),
                item.crop ? labels.species(item.crop, catalog.data) : "—",
                item.healthy ? t("pests.healthy") : (item.disease ?? "—"),
                `${formatNumber(item.confidence, intl, 0)}%`,
              ])}
            />
          </Section>

          <Section title={t("reports.section_alerts")}>
            <Table
              empty={empty}
              head={[t("common.date"), t("monitoring.device"), t("reports.metric"), t("common.status")]}
              rows={data.alerts.map((alert) => [
                formatDateTime(alert.created_at, intl),
                alert.device_name ?? alert.esp32_id,
                alert.metric === "connection" ? t("alert.kind.offline") : `${t(`metric.${alert.metric}`)} · ${t(`alert.kind.${alert.kind}`)}`,
                alert.resolved_at ? t("reports.resolved_alerts") : t("reports.open_alerts"),
              ])}
            />
          </Section>

          <Section title={t("reports.section_finance")}>
            <Table
              empty={empty}
              head={[t("crops.name"), t("reports.inputs_cost"), t("yield.total"), t("reports.expected"), t("reports.margin")]}
              rows={data.crops.map((crop) => [
                crop.name,
                formatPen(crop.input_cost_pen, intl),
                crop.expected_total_t === null ? "—" : `${formatNumber(crop.expected_total_t, intl, 2)} ${t("yield.t")}`,
                formatPen(crop.expected_revenue_pen, intl),
                formatPen(crop.expected_margin_pen, intl),
              ])}
            />
          </Section>
          <p className="print-only text-[12px] text-muted">agroyachay.ginit.dev · doi:10.1016/j.softx.2026.103037</p>
        </article>
      ) : null}
    </>
  );
}
