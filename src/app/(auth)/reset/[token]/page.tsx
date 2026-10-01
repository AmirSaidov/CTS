"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { ApiRequestError } from "@/shared/api/client";
import { toast } from "@/shared/lib/stores";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { Button } from "@/shared/ui/button";
import { Field, Password } from "@/shared/ui/form";
import { passwordRule } from "@/features/auth/register-form";

const schema = z
  .object({ password: passwordRule, repeat: z.string() })
  .refine((v) => v.password === v.repeat, { path: ["repeat"], message: "Пароли не совпадают" });

export default function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [expired, setExpired] = useState(false);
  // живая проверка совпадения — сразу при вводе
  const { register, handleSubmit, formState, setError } = useForm<{ password: string; repeat: string }>({ resolver: zodResolver(schema), mode: "onChange" });
  const { errors, isSubmitting, dirtyFields } = formState;

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
      <AuthTitle eyebrow="Новый пароль · шаг 2" title="Придумайте пароль" />
      {expired ? (
        <div role="alert" className="flex flex-col items-start gap-4 border border-danger bg-elev-1 p-5">
          <span className="text-[16px] font-semibold">Ссылка устарела</span>
          <span className="text-[14px] text-text-2">Ссылка для сброса действует 30 минут. Запросите новую — письмо придёт сразу.</span>
          <Button href="/forgot" variant="primary">
            Отправить заново
          </Button>
        </div>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(async ({ password }) => {
            try {
              await api.reset(token, password);
              toast.success("Пароль сохранён", "Войдите с новым паролем");
              router.push("/login");
            } catch (e) {
              if (e instanceof ApiRequestError && (e.status === 410 || e.body.code === "token_expired")) setExpired(true);
              else setError("root", { message: e instanceof ApiRequestError ? e.message : "Нет связи с сервером" });
            }
          })}
        >
          <Field label="Новый пароль" htmlFor="password" error={errors.password?.message}>
            <Password id="password" placeholder="Минимум 8 символов" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          </Field>
          <Field label="Повторите пароль" htmlFor="repeat" error={dirtyFields.repeat ? errors.repeat?.message : undefined}>
            <Password id="repeat" autoComplete="new-password" invalid={!!dirtyFields.repeat && !!errors.repeat} {...register("repeat")} />
          </Field>
          {errors.root && <p role="alert" className="text-[13px] text-danger">{errors.root.message}</p>}
          <Button type="submit" variant="primary" size="lg" icon={Check} loading={isSubmitting} block>
            Сохранить пароль
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
