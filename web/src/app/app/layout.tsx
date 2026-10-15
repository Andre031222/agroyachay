import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/features/shell/AppShell";

export const metadata: Metadata = { title: "App", robots: { index: false } };

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
