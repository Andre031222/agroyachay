"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Cpu, LocateFixed, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { errorMessage } from "@/lib/errors";
import { daysSince, formatDate, formatNumber } from "@/lib/format";
import type { Crop, CropInput, CropSpecies, CropStatus } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useCatalog, useCrops } from "../shared/data";
import { useLabels } from "../shared/labels";
import { getPosition } from "../shared/Geolocate";
import { CropPhoto, SpeciesPicker } from "../shared/CropPhoto";
import { useModuleHelp } from "../shared/help";

const STATUSES: CropStatus[] = ["planned", "sown", "growing", "harvested", "inactive"];
const STATUS_TONE: Record<CropStatus, Tone> = { planned: "neutral", sown: "link", growing: "accent", harvested: "warn", inactive: "neutral" };

interface FormState {
  name: string;
  species: string;
  variety: string;
  area_ha: string;
  latitude: string;
  longitude: string;
  location_name: string;
  sowing_date: string;
  harvest_date: string;
  status: CropStatus;
  notes: string;
}

function toForm(crop: Crop | null, defaultSpecies: string): FormState {
  return {
    name: crop?.name ?? "",
    species: crop?.species ?? defaultSpecies,
    variety: crop?.variety ?? "",
    area_ha: crop ? String(crop.area_ha) : "",
    latitude: crop?.latitude?.toString() ?? "",
    longitude: crop?.longitude?.toString() ?? "",
    location_name: crop?.location_name ?? "",
    sowing_date: crop?.sowing_date?.slice(0, 10) ?? "",
    harvest_date: crop?.harvest_date?.slice(0, 10) ?? "",
    status: crop?.status ?? "planned",
    notes: crop?.notes ?? "",
  };
}

function toInput(form: FormState): CropInput {
  const num = (value: string) => (value.trim() === "" ? null : Number(value));
  return {
    name: form.name.trim(),
    species: form.species,
    variety: form.variety.trim() || null,
    area_ha: Number(form.area_ha),
    latitude: num(form.latitude),
    longitude: num(form.longitude),
    location_name: form.location_name.trim() || null,
    sowing_date: form.sowing_date || null,
    harvest_date: form.harvest_date || null,
    status: form.status,
    notes: form.notes.trim() || null,
  };
}

function CropForm({ crop, catalog, onClose, onSaved }: { crop: Crop | null; catalog: CropSpecies[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(() => toForm(crop, catalog[0]?.code ?? "potato"));
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const area = Number(form.area_ha);
  const valid = form.name.trim() !== "" && form.species !== "" && Number.isFinite(area) && area > 0;

  const locate = async () => {
    setLocating(true);
    try {
      const position = await getPosition();
      setForm((current) => ({ ...current, latitude: String(position.lat), longitude: String(position.lon) }));
    } catch {
      setError(t("weather.denied"));
    } finally {
      setLocating(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      if (crop) await api.updateCrop(crop.id, toInput(form));
      else await api.createCrop(toInput(form));
      toast.success(t("crops.saved"));
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={crop ? t("crops.edit_title") : t("crops.new_title")} size="lg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <SpeciesPicker label={t("crops.species")} name="crop-species" catalog={catalog} value={form.species} onChange={(code) => set("species", code)} />
        <Input label={t("crops.name")} placeholder={t("crops.name_placeholder")} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("crops.variety")} value={form.variety} onChange={(e) => set("variety", e.target.value)} />
          <Input label={t("crops.area")} inputMode="decimal" value={form.area_ha} onChange={(e) => set("area_ha", e.target.value)} required />
          <Select label={t("crops.status")} options={STATUSES.map((value) => ({ value, label: t(`status.${value}`) }))} value={form.status} onChange={(e) => set("status", e.target.value as CropStatus)} />
          <Input label={t("crops.sowing_date")} type="date" value={form.sowing_date} onChange={(e) => set("sowing_date", e.target.value)} />
          <Input label={t("crops.harvest_date")} type="date" value={form.harvest_date} onChange={(e) => set("harvest_date", e.target.value)} />
        </div>
        <fieldset className="rounded-[16px] border border-line p-4">
          <legend className="px-1 text-[17px] font-semibold">{t("crops.location_name")}</legend>
          <div className="flex flex-col gap-4">
            <Input label={t("crops.location_name")} value={form.location_name} onChange={(e) => set("location_name", e.target.value)} placeholder={t("weather.place_placeholder")} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("crops.lat")} inputMode="decimal" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
              <Input label={t("crops.lon")} inputMode="decimal" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
            </div>
            <div>
              <Button variant="secondary" onClick={locate} loading={locating} icon={<LocateFixed className="size-4" aria-hidden />}>
                {t("crops.use_location")}
              </Button>
            </div>
          </div>
        </fieldset>
        <Textarea label={t("crops.notes")} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        {error ? (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
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

export function Crops() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("crops");
  const labels = useLabels();
  const crops = useCrops();
  const catalog = useCatalog();
  const [editing, setEditing] = useState<Crop | "new" | null>(null);
  const [deleting, setDeleting] = useState<Crop | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteCrop(deleting.id);
      crops.setData((current) => current?.filter((crop) => crop.id !== deleting.id));
      toast.success(t("crops.deleted"));
      setDeleting(null);
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  const ready = !!catalog.data;
  const newButton = (
    <Button onClick={() => setEditing("new")} disabled={!ready} icon={<Plus className="size-4" aria-hidden />}>
      {t("crops.new")}
    </Button>
  );

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo} title={t("page.crops")} actions={crops.data?.length ? newButton : undefined} />
      {crops.error ? (
        <LoadError error={crops.error} onRetry={crops.reload} />
      ) : !crops.data ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" itemClassName="h-52" />
      ) : crops.data.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {crops.data.map((crop) => {
            const days = daysSince(crop.sowing_date);
            const deviceCount = crop.device_count;
            return (
              <Card key={crop.id} padded={false} className="flex flex-col overflow-hidden">
                <CropPhoto code={crop.species} alt={labels.species(crop.species, catalog.data)} variant="full" shape="wide" radius="none" sizes="(min-width: 768px) 50vw, 100vw" />
                <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-accent">{labels.species(crop.species, catalog.data)}</p>
                    <h2 className="truncate text-[21px] font-semibold tracking-[-0.015em]">{crop.name}</h2>
                    {crop.variety ? <p className="text-[15px] text-muted">{crop.variety}</p> : null}
                  </div>
                  <Badge tone={STATUS_TONE[crop.status]}>{t(`status.${crop.status}`)}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-[15px]">
                  <div className="rounded-[12px] bg-bg p-3">
                    <dt className="text-muted">{t("crops.area")}</dt>
                    <dd className="tabular text-[19px] font-semibold">
                      {formatNumber(crop.area_ha, intl, 2)} <span className="text-[15px] font-normal text-muted">{t("common.ha")}</span>
                    </dd>
                  </div>
                  <div className="rounded-[12px] bg-bg p-3">
                    <dt className="text-muted">{t("crops.sowing_date")}</dt>
                    <dd className="text-[17px] font-semibold">{crop.sowing_date ? formatDate(crop.sowing_date, intl) : t("crops.not_sown")}</dd>
                    {days !== null && days >= 0 ? <dd className="text-[13px] text-muted">{t("crops.days_since", { days })}</dd> : null}
                  </div>
                </dl>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted">
                  {crop.location_name || crop.latitude !== null ? (
                    <li className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" aria-hidden />
                      {crop.latitude !== null && crop.longitude !== null ? (
                        <a
                          className="text-link hover:underline"
                          href={`https://www.openstreetmap.org/?mlat=${crop.latitude}&mlon=${crop.longitude}#map=15/${crop.latitude}/${crop.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {crop.location_name ?? t("crops.open_map")}
                        </a>
                      ) : (
                        crop.location_name
                      )}
                    </li>
                  ) : null}
                  {crop.harvest_date ? (
                    <li className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" aria-hidden />
                      {t("crops.harvest_date")}: {formatDate(crop.harvest_date, intl)}
                    </li>
                  ) : null}
                  <li className="inline-flex items-center gap-1.5">
                    <Cpu className="size-4" aria-hidden />
                    {t("crops.devices", { count: deviceCount })}
                  </li>
                </ul>
                <div className="mt-auto flex gap-2">
                  <Button variant="secondary" icon={<Pencil className="size-4" aria-hidden />} onClick={() => setEditing(crop)} disabled={!ready}>
                    {t("common.edit")}
                  </Button>
                  <Button variant="danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setDeleting(crop)}>
                    {t("common.delete")}
                  </Button>
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState photo="potato-field" title={t("crops.empty_title")} text={t("crops.empty_text")} action={newButton} />
      )}

      {editing && catalog.data ? (
        <CropForm
          crop={editing === "new" ? null : editing}
          catalog={catalog.data}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            crops.reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t("crops.delete_title")}
        itemName={deleting?.name ?? ""}
        message={t("crops.delete_confirm", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        busy={busy}
        onConfirm={remove}
      />
    </>
  );
}
