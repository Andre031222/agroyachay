"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSelect } from "@/components/common/LanguageSelect";
import { ButtonLink } from "@/components/ui/Button";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const sections: { href: string; key: MessageKey }[] = [
  { href: "#features", key: "nav.features" },
  { href: "/guide", key: "guide.title" },
  { href: "#languages", key: "nav.languages" },
  { href: "#research", key: "nav.research" },
];

export function LandingNav() {
  const { t } = useI18n();
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const signedIn = status === "authenticated";
  const resolve = (href: string) => (href.startsWith("#") && pathname !== "/" ? `/${href}` : href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-[12px] focus:bg-bg focus:px-4 focus:py-2">
        {t("common.skip")}
      </a>
      <nav aria-label={t("nav.primary")} className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo label={t("brand.home")} />
        <ul className="hidden items-center gap-1 lg:flex">
          {sections.map((section) => (
            <li key={section.href}>
              <Link
                href={resolve(section.href)}
                aria-current={pathname === section.href ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-[980px] px-3.5 text-[14px] text-muted hover:text-text aria-[current=page]:font-medium aria-[current=page]:text-text"
              >
                {t(section.key)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSelect />
          <ThemeToggle />
          {signedIn ? (
            <span className="hidden sm:inline-flex">
              <ButtonLink href="/app" className="min-h-11 px-4 text-[14px]">
                {t("nav.open_app")}
              </ButtonLink>
            </span>
          ) : (
            <>
              <Link href="/login" className="hidden min-h-11 items-center rounded-[980px] px-3.5 text-[14px] font-medium hover:bg-surface sm:inline-flex">
                {t("nav.sign_in")}
              </Link>
              <span className="hidden sm:inline-flex">
                <ButtonLink href="/register" className="min-h-11 px-4 text-[14px]">
                  {t("nav.get_started")}
                </ButtonLink>
              </span>
            </>
          )}
          <button
            type="button"
            className="top-control w-11 justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={t("nav.menu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>
      {open ? (
        <div id="landing-menu" className="border-t border-line bg-bg px-4 pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {sections.map((section) => (
              <li key={section.href} className="border-b border-line">
                <Link
                  href={resolve(section.href)}
                  aria-current={pathname === section.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center text-[17px] aria-[current=page]:font-semibold"
                >
                  {t(section.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <ButtonLink href="/app">{t("nav.open_app")}</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline">
                  {t("nav.sign_in")}
                </ButtonLink>
                <ButtonLink href="/register">{t("nav.get_started")}</ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
