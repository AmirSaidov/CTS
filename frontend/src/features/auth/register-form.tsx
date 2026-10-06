"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Gamepad2, Mail, Trophy, User } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { Button } from "@/shared/ui/button";
import { Checkbox, Field, Input, Password, RadioCard, passwordStrength } from "@/shared/ui/form";
import { SocialLogin } from "./social";
import { setMockRole } from "./mock-session";

// те же правила, что в Django-сериализаторе регистрации
export const nickRule = z
  .string()
  .trim()
  .min(3, "Минимум 3 символа")
  .max(24, "Максимум 24 символа")
  .regex(/^[A-Za-z0-9_.-]+$/, "Только латиница, цифры, _ . -");

export const passwordRule = z
  .string()
  .min(8, "Минимум 8 символов")
  .refine((v) => {
    const s = passwordStrength(v);
    return s.letters && s.digits && s.special;
  }, "Нужны буквы, цифры и спецсимвол");

const schema = z.object({
  role: z.enum(["player", "organizer"]),
  nick: nickRule,
  email: z.email("Проверьте почту"),
  password: passwordRule,
  terms: z.literal(true, { error: "Нужно принять соглашение и политику" }),
});
type Form = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { register, handleSubmit, control, setValue, setError, clearErrors, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { role: params.get("role") === "org" ? "organizer" : "player", nick: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = formState;
  const [role, nick, password] = useWatch({ control, name: ["role", "nick", "password"] });
  const pwd = passwordStrength(password ?? "");

  // проверка занятости ника на лету — при уходе из поля
  const nickField = register("nick", {
    onBlur: async (e) => {
      const v = e.target.value.trim();
      if (!nickRule.safeParse(v).success) return;
      const { available } = await api.checkNick(v);
      if (!available) setError("nick", { type: "server", message: "Ник уже занят" });
      else clearErrors("nick");
    },
  });

  return (
    <>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(async (body) => {
          try {
            await api.register(body);
            setMockRole(body.role === "organizer" ? "organizer" : "player");
            router.push(`/verify?email=${encodeURIComponent(body.email)}&role=${body.role}`);
          } catch (e) {
            applyServerErrors(e, setError);
          }
        })}
      >
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Роль</legend>
          <RadioCard name="role" value="player" checked={role === "player"} onSelect={() => setValue("role", "player")} icon={Gamepad2} title="Игрок" text="Подаю заявки, играю матчи, веду профиль." />
          <RadioCard name="role" value="organizer" checked={role === "organizer"} onSelect={() => setValue("role", "organizer")} icon={Trophy} title="Организатор" text="Создаю турниры и управляю участниками." />
        </fieldset>
        <Field label="Ник" htmlFor="nick" error={errors.nick?.message} hint={!errors.nick && nick ? `cts.gg/p/${nick.toLowerCase()}` : undefined}>
          <Input id="nick" icon={User} placeholder="Например, Aktan" autoComplete="nickname" invalid={!!errors.nick} {...nickField} />
        </Field>
        <Field label="Почта" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" icon={Mail} placeholder="you@mail.kg" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Пароль" htmlFor="password" error={errors.password?.message}>
          <Password id="password" placeholder="Минимум 8 символов" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
        </Field>
        {!errors.password && (
          <ul className="-mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]" aria-label="Требования к паролю">
            {[
              [pwd.length, "8+ символов"],
              [pwd.letters, "буквы"],
              [pwd.digits, "цифры"],
              [pwd.special, "спецсимвол"],
            ].map(([ok, label]) => (
              <li key={label as string} className={ok ? "text-success-text" : "text-text-3"}>
                {ok ? "✓" : "·"} {label}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-1">
          <Checkbox
            label={
              <>
                Принимаю{" "}
                <Link href="/legal/terms" target="_blank" className="underline underline-offset-2 hover:text-accent-hover">
                  пользовательское соглашение
                </Link>{" "}
                и{" "}
                <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2 hover:text-accent-hover">
                  политику конфиденциальности
                </Link>
              </>
            }
            {...register("terms")}
          />
          {errors.terms && <p role="alert" className="text-[12px] text-danger">{errors.terms.message}</p>}
        </div>
        {errors.root && <p role="alert" className="text-[13px] text-danger">{errors.root.message}</p>}
        <Button type="submit" variant="primary" size="lg" icon={ArrowRight} loading={isSubmitting} block>
          Создать аккаунт
        </Button>
      </form>
      <SocialLogin />
      <p className="text-center text-[14px] text-text-2">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-semibold text-accent-hover hover:text-text">
          Войти
        </Link>
      </p>
    </>
  );
}
