"use client";

import { ErrorNote } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { errorMessage } from "@/lib/errors";

export function LoadError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <ErrorNote
      message={errorMessage(error, t)}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        ) : undefined
      }
    />
  );
}
