"use client";

import { useState, type FormEvent } from "react";
import { Cpu, Radio, Settings2, Unlink } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, InlineEmpty } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { formatNumber, METRICS, METRIC_UNIT } from "@/lib/format";
import type { Crop, Device, Metric, Threshold } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useRelative } from "../shared/RelativeTime";
import { useCrops } from "../shared/data";
import { latestOf, thresholdOf } from "../monitoring/metric";
import { useModuleHelp } from "../shared/help";
import { HardwareVideos } from "../hardware/HardwareVideos";

function cropOptions(crops: Crop[] | undefined, noneLabel: string) {
  return [{ value: "", label: noneLabel }, ...(crops ?? []).map((crop) => ({ value: String(crop.id), label: crop.name }))];
}

function LatestLine({ readings }: { readings: Device["latest"] }) {
  const { intl, t } = useI18n();
  const parts = METRICS.map((metric) => {
    const value = latestOf(readings, metric)?.value;
    return value === undefined ? null : `${t(`metric.${metric}`)} ${formatNumber(value, intl)} ${METRIC_UNIT[metric]}`;
  }).filter(Boolean);
  return parts.length ? <p className="tabular text-[14px] text-muted">{parts.join(" · ")}</p> : null;
}

function ClaimModal({ device, crops, onClose, onDone }: { device: Device | null; crops: Crop[] | undefined; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [cropId, setCropId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!device || !name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.claimDevice(device.id, { name: name.trim(), crop_id: cropId ? Number(cropId) : null });
      toast.success(t("devices.claimed"));
      setName("");
      setCropId("");
      onDone();
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!device} onClose={onClose} title={t("devices.claim_title")} description={t("devices.claim_text")}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="rounded-[12px] bg-surface px-4 py-3 font-mono text-[15px]">
          {t("devices.esp32_id")}: {device?.esp32_id}
        </p>
        <Input label={t("devices.name")} placeholder={t("devices.name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} required data-autofocus />
        <Select label={t("devices.crop")} options={cropOptions(crops, t("devices.no_crop"))} value={cropId} onChange={(e) => setCropId(e.target.value)} />
        {error ? (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={busy} disabled={!name.trim()}>
            {t("devices.claim")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ConfigureModal({ device, crops, onClose, onSaved }: { device: Device; crops: Crop[] | undefined; onClose: () => void; onSaved: (device: Device) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(device.name ?? "");
  const [cropId, setCropId] = useState(device.crop_id ? String(device.crop_id) : "");
  const [thresholds, setThresholds] = useState<Record<Metric, { min: string; max: string }>>(() =>
    Object.fromEntries(METRICS.map((metric) => {
      const value = thresholdOf(device, metric);
      return [metric, { min: String(value.min), max: String(value.max) }];
    })) as Record<Metric, { min: string; max: string }>,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parsed: Threshold[] = METRICS.map((metric) => ({ metric, min: Number(thresholds[metric].min), max: Number(thresholds[metric].max) }));
  const valid = parsed.every((item) => Number.isFinite(item.min) && Number.isFinite(item.max) && item.min < item.max) && !!name.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      const updated = await api.updateDevice(device.id, { name: name.trim(), crop_id: cropId ? Number(cropId) : null, thresholds: parsed });
      toast.success(t("common.saved"));
      onSaved(updated ?? { ...device, name: name.trim(), crop_id: cropId ? Number(cropId) : null, thresholds: parsed });
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t("devices.configure_title")} description={device.esp32_id} size="lg">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("devices.name")} value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label={t("devices.crop")} options={cropOptions(crops, t("devices.no_crop"))} value={cropId} onChange={(e) => setCropId(e.target.value)} />
        </div>
        <fieldset className="rounded-[16px] border border-line p-4">
          <legend className="px-1 text-[17px] font-semibold">{t("devices.thresholds")}</legend>
          <p className="mb-4 text-[15px] text-muted">{t("devices.thresholds_text")}</p>
          <div className="flex flex-col gap-4">
            {METRICS.map((metric) => (
              <div key={metric} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_120px_120px]">
                <p className="col-span-2 text-[17px] font-medium sm:col-span-1 sm:pb-3">
                  {t(`metric.${metric}`)} <span className="text-muted">({METRIC_UNIT[metric]})</span>
                </p>
                <Input
                  label={t("devices.min")}
                  inputMode="decimal"
                  value={thresholds[metric].min}
                  onChange={(e) => setThresholds((current) => ({ ...current, [metric]: { ...current[metric], min: e.target.value } }))}
                />
                <Input
                  label={t("devices.max")}
                  inputMode="decimal"
                  value={thresholds[metric].max}
                  onChange={(e) => setThresholds((current) => ({ ...current, [metric]: { ...current[metric], max: e.target.value } }))}
                />
              </div>
            ))}
          </div>
        </fieldset>
        {error ? (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={busy} disabled={!valid}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function Devices() {
  const { t } = useI18n();
  const help = useModuleHelp("devices");
  const relative = useRelative();
  const pending = useAsync(() => api.pendingDevices(), ["pending"], "devices:pending");
  const devices = useAsync(() => api.devices(), ["devices"], "devices");
  const crops = useCrops();
  const [claiming, setClaiming] = useState<Device | null>(null);
  const [configuring, setConfiguring] = useState<Device | null>(null);
  const [releasing, setReleasing] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false);

  const release = async () => {
    if (!releasing) return;
    setBusy(true);
    try {
      await api.releaseDevice(releasing.id);
      toast.success(t("devices.released"));
      setReleasing(null);
      devices.reload();
      pending.reload();
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  const mine = (devices.data ?? []).filter((device) => device.status !== "pending");

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo} title={t("page.devices")} />
      <div className="flex flex-col gap-8 lg:gap-10">
        <Card>
          <CardHeader title={t("devices.pending_title")} description={t("devices.pending_text")} action={<Radio className="size-5 text-accent" aria-hidden />} />
          {pending.error ? (
            <LoadError error={pending.error} onRetry={pending.reload} />
          ) : !pending.data ? (
            <Skeleton className="h-[120px]" />
          ) : pending.data.length ? (
            <ul className="divide-y divide-line rounded-[16px] border border-line bg-bg">
              {pending.data.map((device) => (
                <li key={device.id} className="flex flex-wrap items-center gap-4 px-4 py-4">
                  <Cpu className="size-5 text-muted" aria-hidden />
                  <div className="min-w-[12rem] flex-1">
                    <p className="font-mono text-[17px] font-medium">{device.esp32_id}</p>
                    <p className="text-[14px] text-muted">{t("devices.last_seen", { time: relative(device.last_seen_at) })}</p>
                    <LatestLine readings={device.latest} />
                  </div>
                  <Button onClick={() => setClaiming(device)} className="w-full sm:w-auto">{t("devices.claim")}</Button>
                </li>
              ))}
            </ul>
          ) : (
            <InlineEmpty>{t("devices.pending_empty")}</InlineEmpty>
          )}
        </Card>

        <section>
          <h2 className="mb-4 text-[24px] font-semibold tracking-[-0.02em]">{t("devices.mine_title")}</h2>
          {devices.error ? (
            <LoadError error={devices.error} onRetry={devices.reload} />
          ) : !devices.data ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-40 rounded-[20px]" />
              <Skeleton className="h-40 rounded-[20px]" />
            </div>
          ) : mine.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {mine.map((device) => (
                <Card key={device.id} className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[19px] font-semibold">{device.name ?? device.esp32_id}</p>
                      <p className="font-mono text-[14px] text-muted">{device.esp32_id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge tone={device.online ? "accent" : "neutral"} dot>
                        {device.online ? t("common.online") : t("common.offline")}
                      </Badge>
                      <Badge tone={device.status === "active" ? "link" : "neutral"}>{t(`devices.status.${device.status}`)}</Badge>
                    </div>
                  </div>
                  <div className="text-[15px] text-muted">
                    <p>
                      {t("devices.crop")}: <span className="text-text">{device.crop_name ?? t("devices.no_crop")}</span>
                    </p>
                    <p>{t("devices.last_seen", { time: relative(device.last_seen_at) })}</p>
                  </div>
                  <LatestLine readings={device.latest} />
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button variant="secondary" icon={<Settings2 className="size-4" aria-hidden />} onClick={() => setConfiguring(device)}>
                      {t("devices.configure")}
                    </Button>
                    <Button variant="danger" icon={<Unlink className="size-4" aria-hidden />} onClick={() => setReleasing(device)}>
                      {t("devices.release")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              photo="sensor"
              title={t("devices.mine_empty_title")}
              text={t("devices.mine_empty_text")}
              action={
                <ButtonLink href="#howto" variant="primary">
                  {t("devices.see_howto")}
                </ButtonLink>
              }
            />
          )}
        </section>

        <HardwareVideos />

        <Card tone="outline" id="howto" className="scroll-mt-24">
          <CardHeader title={t("devices.howto_title")} />
          <ol className="grid gap-4 md:grid-cols-3">
            {(["devices.howto_1", "devices.howto_2", "devices.howto_3"] as const).map((key, index) => (
              <li key={key} className="flex gap-3">
                <span className="tabular inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-[15px] font-semibold">{index + 1}</span>
                <p className="text-[17px] leading-relaxed">{t(key)}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <ClaimModal
        device={claiming}
        crops={crops.data}
        onClose={() => setClaiming(null)}
        onDone={() => {
          setClaiming(null);
          pending.reload();
          devices.reload();
        }}
      />
      {configuring ? (
        <ConfigureModal
          device={configuring}
          crops={crops.data}
          onClose={() => setConfiguring(null)}
          onSaved={() => {
            setConfiguring(null);
            devices.reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={!!releasing}
        icon={<Unlink aria-hidden />}
        onClose={() => setReleasing(null)}
        title={t("devices.release_title")}
        itemName={releasing?.name ?? releasing?.esp32_id ?? ""}
        message={t("devices.release_confirm", { name: releasing?.name ?? releasing?.esp32_id ?? "" })}
        confirmLabel={t("devices.release")}
        busy={busy}
        onConfirm={release}
      />
    </>
  );
}
