"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="hero-title" className="px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
        <h1 id="hero-title" className="display text-[40px] sm:text-[52px] lg:col-span-8 lg:text-[54px] xl:text-[62px]">
          <span className="block">{t("landing.hero_line1")}</span>
          <span className="block text-muted">{t("landing.hero_line2")}</span>
        </h1>
        <div className="lg:col-span-4 lg:pt-2">
          <p className="text-[17px] leading-relaxed text-muted">{t("brand.long")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <ButtonLink href="/register" size="lg">
              {t("landing.hero_cta")}
            </ButtonLink>
            <a href="#how" className="inline-flex min-h-12 items-center gap-1.5 rounded-[12px] px-1 text-[17px] font-medium text-link hover:underline">
              {t("landing.hero_secondary")}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
