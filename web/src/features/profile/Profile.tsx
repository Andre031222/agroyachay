"use client";

import { useState, type FormEvent } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { ThemeSwitch } from "@/components/common/ThemeToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LOCALES, useI18n } from "@/lib/i18n";
import { errorMessage } from "@/lib/errors";
import { formatDate, initials } from "@/lib/format";
import type { Locale, User } from "@/lib/types";
import { LocationForm } from "../shared/LocationForm";
import { useModuleHelp } from "../shared/help";

function PersonalForm({ user }: { user: User }) {
  const { t, locale, setLocale } = useI18n();
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState<Locale>(locale);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const updated = await api.updateMe({ name: name.trim(), locale: language });
      setUser(updated ?? { ...user, name: name.trim(), locale: language });
      setLocale(language);
      toast.success(t("profile.saved"));
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label={t("profile.name")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      <Input label={t("profile.email")} value={user.email} readOnly disabled />
      <Select label={t("profile.language")} options={LOCALES.map((value) => ({ value, label: t(`lang.${value}`) }))} value={language} onChange={(e) => setLanguage(e.target.value as Locale)} />
      <div>
        <Button type="submit" loading={busy}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({ user }: { user: User }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const needsCurrent = user.has_password !== false;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next.length < 8) return setError(t("auth.password_short"));
    if (next !== confirm) return setError(t("profile.mismatch"));
    setBusy(true);
    setError("");
    try {
      await api.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(t("profile.password_changed"));
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!needsCurrent ? <p className="text-[15px] text-muted">{t("profile.google_note")}</p> : null}
      {needsCurrent ? <Input label={t("profile.current_password")} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /> : null}
      <Input label={t("profile.new_password")} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint={t("auth.password_hint")} required />
      <Input label={t("profile.confirm_password")} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      {error ? (
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={busy} disabled={!next || !confirm || (needsCurrent && !current)}>
          {t("profile.change_password")}
        </Button>
      </div>
    </form>
  );
}

export function Profile() {
  const { t, intl } = useI18n();
  const help = useModuleHelp("profile");
  const { user, setUser } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo} title={t("page.profile")} />
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[20px] bg-surface p-6">
        <span aria-hidden className="inline-flex size-16 items-center justify-center rounded-full bg-accent text-[24px] font-semibold text-on-accent">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[24px] font-semibold tracking-[-0.02em]">{user.name}</p>
          <p className="truncate text-[17px] text-muted">{user.email}</p>
          <p className="text-[14px] text-muted">{t("profile.member_since", { date: formatDate(user.created_at, intl) })}</p>
        </div>
        <Badge tone="accent">{t(`role.${user.role}`)}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("profile.personal")} />
          <PersonalForm user={user} />
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-[15px] font-medium">{t("theme.label")}</p>
            <ThemeSwitch />
          </div>
        </Card>
        <Card>
          <CardHeader title={t("profile.location")} description={t("profile.location_text")} />
          <LocationForm
            initial={{ latitude: user.latitude, longitude: user.longitude, place_name: user.place_name }}
            submitLabel={t("common.save")}
            onSubmit={async (value) => {
              try {
                const updated = await api.updateMe({ latitude: value.latitude, longitude: value.longitude, place_name: value.place_name || undefined });
                setUser(updated ?? { ...user, ...value });
                toast.success(t("profile.saved"));
              } catch (failure) {
                toast.error(errorMessage(failure, t));
              }
            }}
          />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={t("profile.password_title")} />
          <div className="max-w-md">
            <PasswordForm user={user} />
          </div>
        </Card>
      </div>
    </>
  );
}
