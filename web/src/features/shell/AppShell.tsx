"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MoreHorizontal, UserRound } from "lucide-react";
import { Logo, LogoMark } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSelect } from "@/components/common/LanguageSelect";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth, isAdmin } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import type { User } from "@/lib/types";
import { Announcement } from "./Announcement";
import { GUIDE_ITEM, NAV_GROUPS, PROFILE_ITEM, TAB_ITEMS, isActive, titleFor, type NavItem } from "./nav";

function NavLink({ item, pathname, onNavigate, size = "md" }: { item: NavItem; pathname: string; onNavigate?: () => void; size?: "md" | "lg" }) {
  const { t } = useI18n();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-3 font-medium transition-colors",
        size === "md" ? "min-h-12 text-[17px]" : "min-h-12 text-[17px]",
        active ? "bg-surface text-text" : "text-muted hover:bg-surface hover:text-text",
      )}
    >
      <item.icon className={cn("size-[19px] shrink-0", active && "text-accent")} aria-hidden />
      {t(item.label)}
    </Link>
  );
}

function NavGroups({ pathname, user, onNavigate, size }: { pathname: string; user: User | null; onNavigate?: () => void; size?: "md" | "lg" }) {
  const { t } = useI18n();
  return (
    <>
      {NAV_GROUPS.filter((group) => !group.adminOnly || isAdmin(user)).map((group, index) => (
        <div key={group.label ?? index} className="mb-5">
          {group.label ? <h2 className="mb-1 px-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{t(group.label)}</h2> : null}
          <ul className="flex flex-col gap-0.5">
            {group.items
              .filter((item) => !item.superadminOnly || user?.role === "superadmin")
              .map((item) => (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} onNavigate={onNavigate} size={size} />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Avatar({ user, className }: { user: User; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex size-9 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-on-accent", className)}>
      {initials(user.name)}
    </span>
  );
}

function AccountMenu({ user }: { user: User }) {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("shell.account")}
        onClick={() => setOpen((value) => !value)}
        className="top-control w-11 justify-center"
      >
        <Avatar user={user} className="size-[34px] text-[14px]" />
      </button>
      {open ? (
        <div role="menu" className="pop-in absolute right-0 top-[52px] z-50 w-72 rounded-[20px] border border-line bg-elevated p-2">
          <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
            <Avatar user={user} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold">{user.name}</p>
              <p className="truncate text-[14px] text-muted">{user.email}</p>
              <p className="text-[13px] text-muted">{t(`role.${user.role}`)}</p>
            </div>
          </div>
          <Link role="menuitem" href={PROFILE_ITEM.href} onClick={() => setOpen(false)} className="mt-1 flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-[17px] hover:bg-surface">
            <UserRound className="size-[18px]" aria-hidden />
            {t("page.profile")}
          </Link>
          <Link role="menuitem" href={GUIDE_ITEM.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-[17px] hover:bg-surface">
            <GUIDE_ITEM.icon className="size-[18px]" aria-hidden />
            {t(GUIDE_ITEM.label)}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[17px] text-danger hover:bg-surface"
          >
            <LogOut className="size-[18px]" aria-hidden />
            {t("auth.sign_out")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh lg:pl-64" role="status" aria-busy="true">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-line p-4 lg:block">
        <Skeleton className="h-9 w-28" />
        <div className="mt-8 flex flex-col gap-2">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
        <Skeleton className="h-12 w-64" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-[20px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const config = useAsync(status === "authenticated" ? () => api.publicConfig() : null, [status]);

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "authenticated" || !user) return <ShellSkeleton />;

  const title = t(titleFor(pathname));
  const rawAnnouncement = config.data?.announcement;
  const announcement = typeof rawAnnouncement === "string" ? rawAnnouncement : rawAnnouncement ? rawAnnouncement[locale] || rawAnnouncement.es : null;
  const tabActive = TAB_ITEMS.some((item) => isActive(pathname, item.href));

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-[12px] focus:bg-bg focus:px-4 focus:py-2">
        {t("common.skip")}
      </a>
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href="/app" label={t("brand.home")} />
        </div>
        <nav aria-label={t("shell.main_nav")} data-lang-fade className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
          <NavGroups pathname={pathname} user={user} />
        </nav>
        <div className="border-t border-line p-3">
          <NavLink item={PROFILE_ITEM} pathname={pathname} />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 border-b border-line bg-bg">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/app" aria-label={t("brand.home")} className="inline-flex size-11 shrink-0 items-center justify-center lg:hidden">
                <LogoMark size={32} priority />
              </Link>
              <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LanguageSelect />
              <ThemeToggle />
              <AccountMenu user={user} />
            </div>
          </div>
        </header>
        <main id="main" data-lang-fade className="print-shell mx-auto max-w-[1440px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          {children}
        </main>
      </div>

      <nav aria-label={t("shell.tab_nav")} className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {TAB_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[12px] font-medium", active ? "text-accent" : "text-muted")}
                >
                  <item.icon className="size-[22px]" aria-hidden />
                  <span className="max-w-full truncate px-1">{t(item.label)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn("flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[12px] font-medium", !tabActive ? "text-accent" : "text-muted")}
            >
              <MoreHorizontal className="size-[22px]" aria-hidden />
              {t("shell.more")}
            </button>
          </li>
        </ul>
      </nav>
      {announcement ? <Announcement text={announcement} /> : null}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={t("shell.more")} placement="sheet">
        <nav aria-label={t("shell.main_nav")}>
          <NavGroups pathname={pathname} user={user} onNavigate={() => setMoreOpen(false)} size="lg" />
          <NavLink item={PROFILE_ITEM} pathname={pathname} onNavigate={() => setMoreOpen(false)} size="lg" />
          <NavLink item={GUIDE_ITEM} pathname={pathname} onNavigate={() => setMoreOpen(false)} size="lg" />
        </nav>
      </Modal>
    </div>
  );
}
