"use client";

import { Cpu } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { errorMessage, isAiUnavailable } from "@/lib/errors";

export function AiNotice({ error }: { error: unknown }) {
  const { t } = useI18n();
  if (isAiUnavailable(error)) {
    return (
      <div role="status" className="flex gap-3 rounded-[16px] border border-line bg-bg p-4">
        <Cpu className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
        <div>
          <p className="text-[17px] font-semibold">{t("ai.unavailable_title")}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{t("errors.ai_unavailable")}</p>
        </div>
      </div>
    );
  }
  return (
    <p role="alert" className="text-[15px] text-danger">
      {errorMessage(error, t)}
    </p>
  );
}
