"use client";

import Link from "next/link";
import { ArrowRight, CirclePlay, Gauge, Lightbulb, Sprout } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";

const steps: { id: "measure" | "understand" | "decide"; icon: typeof Gauge }[] = [
  { id: "measure", icon: Gauge },
  { id: "understand", icon: Lightbulb },
  { id: "decide", icon: Sprout },
];

export function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-[1200px]">
        <h2 id="how-title" className="display text-[32px] sm:text-[40px]">
          {t("nav.how")}
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-3">
          {steps.map((step, index) => (
            <li key={step.id} className="flex gap-4 border-t border-line pt-5 sm:flex-col sm:gap-3 sm:pr-6">
              <div className="flex items-start justify-between sm:items-center">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
                  <step.icon className="size-[22px]" aria-hidden />
                </span>
                {index < steps.length - 1 ? <ArrowRight className="hidden size-5 text-muted sm:block" aria-hidden /> : null}
              </div>
              <div className="min-w-0">
                <p className="tabular text-[13px] font-semibold text-muted">0{index + 1}</p>
                <h3 className="text-[21px] font-semibold tracking-[-0.02em]">{t(`landing.step_${step.id}_title` as MessageKey)}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{t(`landing.step_${step.id}_text` as MessageKey)}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/guide" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-[12px] px-1 text-[17px] font-medium text-link hover:underline">
          <CirclePlay className="size-5" aria-hidden />
          {t("guide.link")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
