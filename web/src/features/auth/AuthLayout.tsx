"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSelect } from "@/components/common/LanguageSelect";
import { Photo } from "@/components/ui/Photo";
import { useI18n } from "@/lib/i18n";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-4 sm:px-8 [@media(max-height:800px)]:py-3">
        <header className="flex items-center justify-between gap-3">
          <Logo label={t("brand.home")} />
          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" data-lang-fade className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-4 [@media(max-height:800px)]:py-0">
          <h1 className="display text-[30px] sm:text-[34px] [@media(max-height:800px)]:text-[26px]">{title}</h1>
          <p className="mt-2 text-[16px] leading-snug text-muted sm:text-[17px]">{subtitle}</p>
          <div className="mt-6 [@media(max-height:800px)]:mt-4">{children}</div>
          {footer ? <div className="mt-5 [@media(max-height:800px)]:mt-3">{footer}</div> : null}
        </main>
      </div>
      <aside className="hidden p-4 lg:block">
        <div className="sticky top-4 flex h-[calc(100dvh-32px)] flex-col gap-4">
          <Photo name="auth" alt="" priority sizes="50vw" className="flex-1" />
          <div className="rounded-[20px] bg-surface p-6">
            <p className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">{t("auth.panel_title")}</p>
            <p className="mt-2 text-[16px] text-muted">{t("auth.panel_text")}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
