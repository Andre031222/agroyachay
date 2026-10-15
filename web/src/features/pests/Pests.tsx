"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, ClipboardList, ImageUp, Lock, ShieldAlert, Stethoscope } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";
import { InlineEmpty } from "@/components/ui/EmptyState";
import { Photo } from "@/components/ui/Photo";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PestDiagnosis, PestPlan, Severity } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useCatalog, useCrops } from "../shared/data";
import { useLabels } from "../shared/labels";
import { useRelative } from "../shared/RelativeTime";
import { AuthImage } from "../shared/AuthImage";
import { AiNotice } from "../shared/AiNotice";
import { useModuleHelp } from "../shared/help";
import { CropChoices } from "../shared/CropPhoto";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 8 * 1024 * 1024;
const SEVERITY_TONE: Record<Severity, Tone> = { none: "accent", low: "accent", moderate: "warn", high: "danger" };

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-[17px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanView({ plan }: { plan: PestPlan }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5 rounded-[16px] border border-line bg-bg p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[19px] font-semibold">{t("pests.plan_title")}</h3>
        <Badge tone="warn">
          {t("pests.urgency")}: {t(`urgency.${plan.urgency}`)}
        </Badge>
      </div>
      {plan.steps.length ? (
        <div>
          <h4 className="text-[17px] font-semibold">{t("pests.steps")}</h4>
          <ol className="mt-2 flex flex-col gap-2 text-[17px] leading-relaxed">
            {plan.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="tabular inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-[14px] font-semibold">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {plan.products.length ? (
        <div>
          <h4 className="text-[17px] font-semibold">{t("pests.products")}</h4>
          <table className="mt-2 w-full text-[15px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">
                  {t("pests.products")}
                </th>
                <th scope="col" className="py-2 font-medium">
                  {t("pests.dose")}
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.products.map((product) => (
                <tr key={product.name} className="border-b border-line">
                  <td className="py-2.5 pr-3 font-medium">{product.name}</td>
                  <td className="py-2.5">{product.dose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {plan.organic_alternative ? (
        <div className="rounded-[12px] bg-surface p-4">
          <p className="text-[14px] font-semibold text-accent">{t("pests.organic")}</p>
          <p className="mt-1 text-[17px] leading-relaxed">{plan.organic_alternative}</p>
        </div>
      ) : null}
      {plan.consult_agronomist ? (
        <p className="flex items-center gap-2 text-[15px] text-warn">
          <ShieldAlert className="size-4 shrink-0" aria-hidden />
          {t("pests.consult")}
        </p>
      ) : null}
    </div>
  );
}

function ResultCard({ result, onPlan }: { result: PestDiagnosis; onPlan: (plan: PestPlan) => void }) {
  const { t, intl } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const confidence = result.confidence;

  const loadPlan = async () => {
    setBusy(true);
    setError(null);
    try {
      onPlan(await api.pestPlan(result.id));
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        {result.healthy ? <CheckCircle2 className="size-9 shrink-0 text-accent" aria-hidden /> : <Stethoscope className="size-9 shrink-0 text-danger" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-muted">{result.healthy ? t("pests.healthy") : t("pests.detected")}</p>
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{result.healthy ? t("pests.healthy") : result.disease}</h2>
          {result.scientific_name ? <p className="text-[17px] italic text-muted">{result.scientific_name}</p> : null}
        </div>
        {!result.healthy ? <Badge tone={SEVERITY_TONE[result.severity] ?? "warn"}>{`${t("pests.severity")}: ${t(`severity.${result.severity}`)}`}</Badge> : null}
      </div>
      <div>
        <div className="mb-2 flex justify-between text-[15px]">
          <span className="text-muted">{t("pests.confidence")}</span>
          <span className="tabular font-semibold">{formatNumber(confidence, intl, 0)}%</span>
        </div>
        <Meter value={confidence} label={t("pests.confidence")} tone={confidence >= 70 ? "accent" : confidence >= 40 ? "warn" : "danger"} />
      </div>
      {result.healthy ? <p className="text-[17px] text-muted">{t("pests.healthy_text")}</p> : null}
      <p className="rounded-[12px] border border-line px-4 py-3 text-[15px] leading-relaxed text-muted">{t("pests.triage_note")}</p>
      {result.description ? (
        <div>
          <h3 className="text-[17px] font-semibold">{t("pests.description")}</h3>
          <p className="mt-1 text-[17px] leading-relaxed">{result.description}</p>
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-3">
        <ListBlock title={t("pests.causes")} items={result.causes} />
        <ListBlock title={t("pests.treatment")} items={result.treatment} />
        <ListBlock title={t("pests.prevention")} items={result.prevention} />
      </div>
      {result.plan ? (
        <PlanView plan={result.plan} />
      ) : !result.healthy ? (
        <div>
          <Button onClick={loadPlan} loading={busy} icon={<ClipboardList className="size-4" aria-hidden />}>
            {busy ? t("pests.plan_loading") : t("pests.plan_cta")}
          </Button>
          {error ? (
            <div className="mt-3">
              <AiNotice error={error} />
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

export function Pests() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("pests");
  const labels = useLabels();
  const relative = useRelative();
  const catalog = useCatalog();
  const crops = useCrops();
  const history = useAsync(() => api.pestHistory(), ["pest-history"], "pests:history");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PestDiagnosis | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const [dragging, setDragging] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const id = window.setTimeout(() => setPreview(url), 0);
    return () => {
      window.clearTimeout(id);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!TYPES.includes(candidate.type)) return setError(t("pests.file_type"));
    if (candidate.size > MAX) return setError(t("pests.file_size"));
    setError("");
    setResult(null);
    setFile(candidate);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setFailure(null);
    try {
      const cropRecord = crops.data?.find((item) => String(item.id) === crop);
      const species = cropRecord?.species ?? (crop.startsWith("s:") ? crop.slice(2) : undefined);
      const diagnosis = await api.diagnose(file, species, cropRecord?.id ?? null);
      setResult(diagnosis);
      history.reload();
    } catch (caught) {
      setFailure(caught);
    } finally {
      setBusy(false);
    }
  };

  const cropOptions = [
    { value: "", code: "other", label: t("pests.crop_any") },
    ...(crops.data ?? []).map((item) => ({ value: String(item.id), code: item.species, label: item.name, sub: labels.species(item.species, catalog.data) })),
    ...(catalog.data ?? []).map((item) => ({ value: `s:${item.code}`, code: item.code, label: labels.species(item.code, catalog.data) })),
  ];

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo} title={t("page.pests")} />
      <div className="grid-12 split-5-7">
        <Card className="flex flex-col gap-5 self-start">
          <CardHeader title={t("pests.upload_title")} className="mb-0" />
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn("relative overflow-hidden rounded-[16px] border-2 border-dashed", dragging ? "border-accent" : "border-line")}
          >
            {preview && file ? (
              <div className="relative aspect-square w-full">
                <Image src={preview} alt={t("pests.preview")} fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
                <ImageUp className="size-10 text-muted" aria-hidden />
                <p className="text-[15px] text-muted">{t("pests.drop_hint")}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={<ImageUp className="size-4" aria-hidden />} onClick={() => pickRef.current?.click()}>
              {file ? t("pests.replace") : t("pests.choose_photo")}
            </Button>
            <Button variant="secondary" icon={<Camera className="size-4" aria-hidden />} onClick={() => cameraRef.current?.click()}>
              {t("pests.take_photo")}
            </Button>
          </div>
          <input ref={pickRef} type="file" accept={TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => accept(e.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => accept(e.target.files?.[0])} />
          <CropChoices label={t("pests.crop")} hint={t("pests.crop_hint")} name="pest-crop" options={cropOptions} value={crop} onChange={setCrop} columns="3" />
          {error ? (
            <p role="alert" className="text-[15px] text-danger">
              {error}
            </p>
          ) : null}
          <Button size="lg" onClick={analyze} disabled={!file} loading={busy}>
            {busy ? t("pests.analyzing") : t("pests.analyze")}
          </Button>
          <p className="flex gap-2 text-[14px] leading-relaxed text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("pests.local_note")}
          </p>
        </Card>

        <div className="flex flex-col gap-6">
          {busy ? <Skeleton className="h-96 rounded-[20px]" /> : null}
          {!busy && failure ? <AiNotice error={failure} /> : null}
          {!busy && result ? <ResultCard result={result} onPlan={(plan) => setResult({ ...result, plan })} /> : null}
          {!busy && !result ? (
            <div className="grid overflow-hidden rounded-[20px] bg-surface sm:grid-cols-2">
              <Photo name="leaf" alt="" rounded={false} className="aspect-[4/3] sm:aspect-auto sm:min-h-72" />
              <div className="flex flex-col justify-center gap-2 p-6">
                <p className="text-[21px] font-semibold tracking-[-0.015em]">{t("pests.upload_title")}</p>
                <p className="text-[17px] text-muted">{t("pests.upload_text")}</p>
              </div>
            </div>
          ) : null}
          <Card>
            <CardHeader title={t("pests.history_title")} />
            {history.error ? (
              <LoadError error={history.error} onRetry={history.reload} />
            ) : !history.data ? (
              <Skeleton className="h-24" />
            ) : history.data.length ? (
              <ul className="divide-y divide-line">
                {history.data.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setResult(item)} className="flex min-h-14 w-full items-center gap-3 py-3 text-left hover:bg-bg">
                      {item.image_url ? (
                        <AuthImage src={item.image_url} alt="" size={48} className="size-12 shrink-0 rounded-[10px]" />
                      ) : (
                        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-bg">
                          {item.healthy ? <CheckCircle2 className="size-5 text-accent" aria-hidden /> : <Stethoscope className="size-5 text-danger" aria-hidden />}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[17px] font-medium">{item.healthy ? t("pests.healthy") : item.disease}</p>
                        <p className="truncate text-[14px] text-muted">
                          {item.crop ? `${labels.species(item.crop, catalog.data)} · ` : ""}
                          {relative(item.created_at)}
                        </p>
                      </div>
                      <span className="tabular text-[15px] text-muted">{formatNumber(item.confidence, intl, 0)}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <InlineEmpty>{t("pests.history_empty")}</InlineEmpty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
