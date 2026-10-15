"use client";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="display text-[40px]">{t("common.error_title")}</h1>
      <p className="text-[17px] text-muted">{t("errors.generic")}</p>
      <Button onClick={reset}>{t("common.retry")}</Button>
    </main>
  );
}
