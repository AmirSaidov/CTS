"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, Mail, Send } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/form";

const schema = z.object({ email: z.email("Проверьте почту") });

export default function ForgotPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<{ email: string }>({ resolver: zodResolver(schema), mode: "onTouched" });

  return (
    <AuthShell
      slogan={
        <>
          Вернёмся
          <br />в игру
        </>
      }
      sub="Сбросить пароль можно за минуту."
    >
      <Link href="/login" className="mono flex items-center gap-2 text-[11px] tracking-[0.16em] text-text-2 uppercase hover:text-text">
        <ArrowLeft size={14} aria-hidden /> Ко входу
      </Link>
      <AuthTitle eyebrow="Восстановление" title="Забыли пароль?" sub="Введите почту — отправим ссылку для сброса пароля. Ссылка действует 30 минут." />
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(async ({ email }) => {
          try {
            await api.forgot(email);
            setSentTo(email);
          } catch (e) {
            applyServerErrors(e, setError);
          }
        })}
      >
        <Field label="Почта" htmlFor="email" error={formState.errors.email?.message}>
          <Input id="email" type="email" icon={Mail} autoComplete="email" invalid={!!formState.errors.email} {...register("email")} />
        </Field>
        <Button type="submit" variant="primary" size="lg" icon={Send} loading={formState.isSubmitting} block>
          {sentTo ? "Отправить ещё раз" : "Отправить ссылку"}
        </Button>
      </form>
      {sentTo && (
        <div role="status" className="flex gap-4 border border-success bg-elev-1 p-5">
          <Check size={20} className="mt-0.5 shrink-0 text-success-text" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="text-[16px] font-semibold">Письмо отправлено</span>
            <span className="text-[14px] text-text-2">
              Проверьте почту {sentTo} и папку «Спам».
            </span>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
