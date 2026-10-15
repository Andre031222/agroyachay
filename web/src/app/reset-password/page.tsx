import type { Metadata } from "next";
import { ResetForm } from "@/features/auth/AuthForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false }, referrer: "no-referrer" };

export default function ResetPasswordPage() {
  return <ResetForm />;
}
