"use client";

import { useState, type FormEvent } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useI18n } from "@/lib/i18n";
import { getPosition } from "./Geolocate";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
}

interface LocationFormProps {
  initial: LocationValue;
  onSubmit: (value: { latitude: number; longitude: number; place_name: string }) => Promise<void> | void;
  submitLabel: string;
  autoLocate?: boolean;
}

export function LocationForm({ initial, onSubmit, submitLabel }: LocationFormProps) {
  const { t } = useI18n();
  const [place, setPlace] = useState(initial.place_name ?? "");
  const [lat, setLat] = useState(initial.latitude?.toString() ?? "");
  const [lon, setLon] = useState(initial.longitude?.toString() ?? "");
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const locate = async () => {
    setLocating(true);
    setMessage("");
    try {
      const position = await getPosition();
      setLat(String(position.lat));
      setLon(String(position.lon));
    } catch (error) {
      setMessage(error instanceof Error && error.message === "unsupported" ? t("weather.unsupported") : t("weather.denied"));
    } finally {
      setLocating(false);
    }
  };

  const latitude = Number(lat);
  const longitude = Number(lon);
  const valid = lat !== "" && lon !== "" && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await onSubmit({ latitude, longitude, place_name: place.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Button variant="secondary" onClick={locate} loading={locating} icon={<LocateFixed className="size-4" aria-hidden />}>
          {locating ? t("weather.locating") : t("weather.use_location")}
        </Button>
        {message ? (
          <p role="alert" className="mt-2 text-[15px] text-warn">
            {message}
          </p>
        ) : null}
      </div>
      <Input label={t("weather.place")} placeholder={t("weather.place_placeholder")} value={place} onChange={(e) => setPlace(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t("weather.lat")} inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-15.84" />
        <Input label={t("weather.lon")} inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="-70.02" />
      </div>
      <div>
        <Button type="submit" disabled={!valid} loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
