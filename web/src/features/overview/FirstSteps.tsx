"use client";

import { CheckCircle2, ChevronRight, Circle, ListChecks } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { createStoredValue, useStoredValue } from "@/lib/stored";
import { cn } from "@/lib/cn";

export const firstStepsHidden = createStoredValue<"0" | "1">("agroyachay.first_steps_hidden", "0", ["0", "1"]);

export interface FirstStepsStatus {
  crop: boolean;
  sensor: boolean;
  link: boolean;
  location: boolean;
}

const STEPS: { key: keyof FirstStepsStatus; title: MessageKey; text: MessageKey; href: string }[] = [
  { key: "crop", title: "onboarding.step_crop", text: "onboarding.step_crop_text", href: "/app/crops" },
  { key: "sensor", title: "onboarding.step_sensor", text: "onboarding.step_sensor_text", href: "/app/devices" },
  { key: "link", title: "onboarding.step_link", text: "onboarding.step_link_text", href: "/app/devices" },
  { key: "location", title: "onboarding.step_location", text: "onboarding.step_location_text", href: "/app/weather" },
];

export function FirstSteps({ status }: { status: FirstStepsStatus }) {
  const { t } = useI18n();
  const hidden = useStoredValue(firstStepsHidden) === "1";
  const done = STEPS.filter((step) => status[step.key]).length;
  if (done === STEPS.length) return null;
  if (hidden) {
    return (
      <div>
        <Button variant="ghost" icon={<ListChecks className="size-5" aria-hidden />} onClick={() => firstStepsHidden.set("0")}>
          {t("onboarding.show")}
        </Button>
      </div>
    );
  }
  const nextKey = STEPS.find((step) => !status[step.key])?.key;
  return (
    <section aria-labelledby="first-steps-title" className="rounded-[20px] border border-line p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="first-steps-title" className="text-[24px] font-semibold tracking-[-0.02em]">
            {t("onboarding.title")}
          </h2>
          <p className="mt-1 text-[17px] text-muted">{t("onboarding.text")}</p>
        </div>
        <Button variant="ghost" onClick={() => firstStepsHidden.set("1")}>
          {t("onboarding.hide")}
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Meter value={done} max={STEPS.length} label={t("onboarding.progress", { done, total: STEPS.length })} className="flex-1" />
        <span className="tabular shrink-0 text-[16px] font-medium">{t("onboarding.progress", { done, total: STEPS.length })}</span>
      </div>
      <ol className="mt-5 grid gap-3 xl:grid-cols-2">
        {STEPS.map((step, index) => {
          const complete = status[step.key];
          const current = step.key === nextKey;
          return (
            <li
              key={step.key}
              className={cn("flex flex-col gap-3 rounded-[16px] p-4 sm:flex-row sm:items-center xl:flex-col xl:items-stretch", current ? "border-2 border-accent" : "bg-surface")}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {complete ? (
                  <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-accent" aria-hidden />
                ) : (
                  <Circle className="mt-0.5 size-7 shrink-0 text-muted" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className={cn("text-[18px] font-semibold leading-snug", complete && "text-muted line-through decoration-1")}>
                    <span className="tabular">{index + 1}.</span> {t(step.title)}
                  </p>
                  {complete ? null : <p className="mt-1 text-[16px] text-muted">{t(step.text)}</p>}
                  <Badge tone={complete ? "accent" : "neutral"} className="mt-2">
                    {complete ? t("onboarding.done") : t("onboarding.pending")}
                  </Badge>
                </div>
              </div>
              {complete ? null : (
                <ButtonLink
                  href={step.href}
                  variant={current ? "primary" : "outline"}
                  size="lg"
                  className="w-full sm:w-auto xl:w-full"
                  icon={null}
                  aria-label={`${t("onboarding.go")}: ${t(step.title)}`}
                >
                  {t("onboarding.go")}
                  <ChevronRight className="size-5" aria-hidden />
                </ButtonLink>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
