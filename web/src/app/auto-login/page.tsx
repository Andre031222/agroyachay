import type { Metadata } from "next";
import { AutoLogin } from "@/features/auth/AutoLogin";

export const metadata: Metadata = { title: "AgroYachay", robots: { index: false } };

export default function AutoLoginPage() {
  return <AutoLogin />;
}
