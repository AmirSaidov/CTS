import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      slogan={
        <>
          Твой турнир
          <br />
          ждёт
        </>
      }
      sub="Сетка, расписание и результаты — всё в одном месте."
    >
      <AuthTitle eyebrow="Вход" title="С возвращением" sub="Войдите, чтобы управлять турнирами и командой." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
