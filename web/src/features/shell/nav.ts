import {
  Activity,
  Bug,
  Calculator,
  CirclePlay,
  CloudSun,
  Cpu,
  FileText,
  House,
  Package,
  ScrollText,
  Settings,
  Users,
  MessagesSquare,
  MoonStar,
  Sprout,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n";

export interface NavItem {
  href: string;
  label: MessageKey;
  icon: LucideIcon;
  superadminOnly?: boolean;
}

export interface NavGroup {
  label: MessageKey | null;
  items: NavItem[];
  adminOnly?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/app", label: "page.overview", icon: House }],
  },
  {
    label: "group.my_field",
    items: [
      { href: "/app/crops", label: "page.crops", icon: Sprout },
      { href: "/app/devices", label: "page.devices", icon: Cpu },
      { href: "/app/monitoring", label: "page.monitoring", icon: Activity },
    ],
  },
  {
    label: "group.weather_calendar",
    items: [
      { href: "/app/weather", label: "page.weather", icon: CloudSun },
      { href: "/app/almanac", label: "page.almanac", icon: MoonStar },
    ],
  },
  {
    label: "group.decisions",
    items: [
      { href: "/app/pests", label: "page.pests", icon: Bug },
      { href: "/app/inputs", label: "page.inputs", icon: Calculator },
      { href: "/app/yield", label: "page.yield", icon: TrendingUp },
      { href: "/app/advisory", label: "page.advisory", icon: MessagesSquare },
    ],
  },
  {
    label: "group.records",
    items: [{ href: "/app/reports", label: "page.reports", icon: FileText }],
  },
  {
    label: "group.administration",
    adminOnly: true,
    items: [
      { href: "/app/admin/users", label: "admin.tab_users", icon: Users },
      { href: "/app/admin/audit", label: "admin.tab_audit", icon: ScrollText },
      { href: "/app/admin/catalog", label: "admin.tab_catalogue", icon: Package },
      { href: "/app/admin/settings", label: "admin.tab_settings", icon: Settings, superadminOnly: true },
    ],
  },
];

export const TAB_ITEMS: NavItem[] = [
  { href: "/app", label: "page.overview", icon: House },
  { href: "/app/crops", label: "page.crops", icon: Sprout },
  { href: "/app/monitoring", label: "page.monitoring", icon: Activity },
  { href: "/app/pests", label: "page.pests", icon: Bug },
];

export const PROFILE_ITEM: NavItem = { href: "/app/profile", label: "page.profile", icon: UserRound };

export const GUIDE_ITEM: NavItem = { href: "/guide", label: "guide.title", icon: CirclePlay };

export function isActive(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string): MessageKey {
  if (isActive(pathname, PROFILE_ITEM.href)) return PROFILE_ITEM.label;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) if (isActive(pathname, item.href)) return item.label;
  }
  if (pathname.startsWith("/app/admin")) return "page.admin";
  return "page.overview";
}
