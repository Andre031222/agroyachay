"use client";

import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/common/Logo";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <LogoMark size={48} />
      <h1 className="display text-[48px]">404</h1>
      <p className="text-[17px] text-muted">{t("errors.not_found_page")}</p>
      <ButtonLink href="/">{t("errors.go_home")}</ButtonLink>
    </main>
  );
}
