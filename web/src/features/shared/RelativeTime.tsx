"use client";

import { useI18n } from "@/lib/i18n";
import { formatDateTime, relativeParts } from "@/lib/format";
import { useNow } from "./useNow";

export function RelativeTime({ value }: { value: string | null | undefined }) {
  const { t, intl } = useI18n();
  const now = useNow();
  if (!value) return <>{t("common.never")}</>;
  const parts = now ? relativeParts(value, now) : null;
  return (
    <time dateTime={value} title={formatDateTime(value, intl)}>
      {parts ? t(parts.key, { n: parts.n }) : formatDateTime(value, intl)}
    </time>
  );
}

export function useRelative() {
  const { t, intl } = useI18n();
  const now = useNow();
  return (value: string | null | undefined): string => {
    if (!value) return t("common.never");
    const parts = now ? relativeParts(value, now) : null;
    return parts ? t(parts.key, { n: parts.n }) : formatDateTime(value, intl);
  };
}
