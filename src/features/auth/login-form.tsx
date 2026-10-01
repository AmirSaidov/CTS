"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, User } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { ApiRequestError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { Checkbox, Field, Input, Password } from "@/shared/ui/form";
import { SocialLogin } from "./social";
import { safeNext, setMockRole } from "./mock-session";

const schema = z.object({
  login: z.string().trim().min(2, "Введите почту или ник"),
  password: z.string().min(1, "Введите пароль"),
  remember: z.boolean(),
});
type Form = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const { register, handleSubmit, setError, formState } = useForm<Form>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { remember: true, login: "", password: "" } });
  const { errors, isSubmitting } = formState;

  return (
    <>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(async (v) => {
          try {
            await api.login(v);
            setMockRole(v.login.toLowerCase().includes("org") ? "organizer" : "captain");
            router.replace(safeNext(next, v.login.toLowerCase().includes("org") ? "/org" : "/me"));
            router.refresh();
          } catch (e) {
            // ошибка неверного пароля — общая, без уточнения, что именно неверно
            if (e instanceof ApiRequestError && e.status === 429) setError("root", { message: "Слишком много попыток. Подождите минуту и попробуйте снова." });
            else setError("root", { message: e instanceof ApiRequestError ? "Неверная почта/ник или пароль" : "Нет связи с сервером" });
          }
        })}
      >
        <Field label="Почта или ник" htmlFor="login" error={errors.login?.message}>
          <Input id="login" icon={User} autoComplete="username" placeholder="aktan@mail.kg" invalid={!!errors.login} {...register("login")} />
        </Field>
        <Field label="Пароль" htmlFor="password" error={errors.password?.message}>
          <Password id="password" invalid={!!errors.password} {...register("password")} />
        </Field>
        <div className="flex items-center justify-between">
          <Checkbox label="Запомнить меня" {...register("remember")} />
          <Link href="/forgot" className="text-[14px] text-text-2 hover:text-text">
            Забыли пароль?
          </Link>
        </div>
        {errors.root && (
          <p role="alert" className="border border-danger px-4 py-3 text-[14px] text-danger">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" icon={ArrowRight} loading={isSubmitting} block>
          Войти
        </Button>
      </form>
      <SocialLogin next={next ?? undefined} />
      <p className="text-center text-[14px] text-text-2">
        Нет аккаунта?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-accent-hover hover:text-text">
          Зарегистрироваться
        </Link>
      </p>
    </>
  );
}
