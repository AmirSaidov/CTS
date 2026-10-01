import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { StepBar } from "@/shared/ui/stepper";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Регистрация", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      slogan={
        <>
          Играй.
          <br />
          Организуй.
          <br />
          Побеждай.
        </>
      }
      sub="Бесплатно для игроков. Freemium для организаторов."
    >
      <StepBar current={1} total={4} />
      <AuthTitle eyebrow="Регистрация" title="Создать аккаунт" sub="Выберите роль — её можно сменить позже." />
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
