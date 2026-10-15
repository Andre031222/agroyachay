"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/common/Logo";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { LINKS } from "./links";

export function CtaBand() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="cta-title" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 rounded-[24px] bg-surface p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:rounded-[28px]">
        <div className="min-w-0">
          <h2 id="cta-title" className="display text-[32px] sm:text-[44px]">
            {t("landing.cta_title")}
          </h2>
          <p className="mt-3 text-[17px] text-muted sm:text-[19px]">{t("landing.cta_text")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <ButtonLink href="/register" size="lg">
            {t("nav.get_started")}
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="outline">
            {t("nav.sign_in")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  const columns: { title: MessageKey; links: { label: MessageKey; href: string; external?: boolean }[] }[] = [
    {
      title: "footer.product",
      links: [
        { label: "nav.features", href: "/#features" },
        { label: "nav.how", href: "/#how" },
        { label: "guide.title", href: "/guide" },
        { label: "nav.languages", href: "/#languages" },
      ],
    },
    {
      title: "footer.research",
      links: [
        { label: "footer.paper", href: LINKS.paper, external: true },
        { label: "footer.zenodo", href: LINKS.zenodo, external: true },
        { label: "footer.github", href: LINKS.github, external: true },
        { label: "footer.license", href: LINKS.license, external: true },
      ],
    },
    {
      title: "footer.account",
      links: [
        { label: "nav.sign_in", href: "/login" },
        { label: "nav.get_started", href: "/register" },
        { label: "footer.credits", href: LINKS.credits, external: true },
      ],
    },
  ];
  return (
    <footer className="border-t border-line bg-surface px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-2 text-[21px] font-semibold tracking-[-0.03em]">
            <LogoMark />
            AgroYachay
          </div>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted">{t("brand.long")}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={t(column.title)}>
            <h2 className="text-[13px] font-semibold text-text">{t(column.title)}</h2>
            <ul className="mt-3 flex flex-col">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-[14px] text-muted hover:text-text">
                      {t(link.label)}
                    </a>
                  ) : (
                    <Link href={link.href} className="inline-flex min-h-11 items-center text-[14px] text-muted hover:text-text">
                      {t(link.label)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-line pt-6 text-[13px] text-muted">
        <p>
          © {new Date().getFullYear()} AgroYachay · {t("footer.rights")}
        </p>
        <p>{t("footer.made")}</p>
      </div>
    </footer>
  );
}
