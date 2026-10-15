import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotForm } from "@/features/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
