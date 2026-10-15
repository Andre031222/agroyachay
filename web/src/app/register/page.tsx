import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/AuthForms";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
