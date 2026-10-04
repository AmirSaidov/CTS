"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Mail, User } from "lucide-react";
import type { SessionUser } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { toast } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Button } from "@/shared/ui/button";
import { Field, Input, Password, Select } from "@/shared/ui/form";
import { PageHeader } from "@/shared/ui/misc";
import { Modal } from "@/shared/ui/overlay";
import { OtpInput } from "@/shared/ui/otp";
import { passwordRule } from "@/features/auth/register-form";
import { SettingsSection } from "./section";

const pwdSchema = z
  .object({ current: z.string().min(1, "Введите текущий пароль"), next: passwordRule, repeat: z.string() })
  .refine((v) => v.next === v.repeat, { path: ["repeat"], message: "Пароли не совпадают" })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Новый пароль совпадает с текущим" });

/** Экран 44 в MVP: почта, ник и смена пароля. 2FA и «Активные сессии» — v2, телефона нет (подтверждение только по почте). */
export function SecurityScreen({ user }: { user: SessionUser }) {
  const [email, setEmail] = useState(user.email);
  const [nick, setNick] = useState(user.nick);
  const [role, setRole] = useState(user.isOrganizer ? "both" : "player");
  const [dirty, setDirty] = useState(false);
  const [verify, setVerify] = useState(false);
  const [code, setCode] = useState("");
  useUnsavedGuard(dirty);

  const pwd = useForm<z.infer<typeof pwdSchema>>({ resolver: zodResolver(pwdSchema), mode: "onTouched" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Настройки // Аккаунт"
        title="Профиль и безопасность"
        sub="Данные для входа и пароль"
        actions={
          <Button
            variant="primary"
            icon={Check}
            disabled={!dirty}
            onClick={async () => {
              // смена почты требует подтверждения новым кодом
              if (email !== user.email) return setVerify(true);
              await api.saveAccount({ nick, defaultCabinet: role });
              setDirty(false);
              toast.success("Сохранено");
            }}
          >
            Сохранить
          </Button>
        }
      />
      <SettingsSection title="Данные входа" text="Почта используется для входа и восстановления пароля.">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Почта" htmlFor="em" className="tab:col-span-2" hint={email === user.email ? (user.emailVerified ? "Подтверждена" : "Не подтверждена") : "Нужно подтвердить новую почту кодом"}>
            <Input id="em" type="email" icon={Mail} value={email} onChange={(e) => { setEmail(e.target.value); setDirty(true); }} />
          </Field>
          <Field label="Ник" htmlFor="nk">
            <Input id="nk" icon={User} value={nick} onChange={(e) => { setNick(e.target.value); setDirty(true); }} />
          </Field>
          <Field label="Роль по умолчанию" htmlFor="dr" hint="Куда вести после входа">
            <Select id="dr" value={role} onChange={(e) => { setRole(e.target.value); setDirty(true); }} options={[{ value: "player", label: "Игрок" }, { value: "org", label: "Организатор" }, { value: "both", label: "Игрок и организатор" }]} />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Пароль" text="После смены пароля другие устройства выйдут из аккаунта.">
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={pwd.handleSubmit(async (v) => {
            try {
              await api.changePassword({ current: v.current, next: v.next });
              pwd.reset();
              toast.success("Пароль изменён", "Другие сессии завершены");
            } catch (e) {
              applyServerErrors(e, pwd.setError);
            }
          })}
        >
          <Field label="Текущий пароль" htmlFor="pc" error={pwd.formState.errors.current?.message}>
            <Password id="pc" invalid={!!pwd.formState.errors.current} {...pwd.register("current")} />
          </Field>
          <div className="grid gap-4 tab:grid-cols-2">
            <Field label="Новый пароль" htmlFor="pn" error={pwd.formState.errors.next?.message}>
              <Password id="pn" placeholder="Минимум 8 символов" autoComplete="new-password" invalid={!!pwd.formState.errors.next} {...pwd.register("next")} />
            </Field>
            <Field label="Повторите" htmlFor="pr" error={pwd.formState.errors.repeat?.message}>
              <Password id="pr" autoComplete="new-password" invalid={!!pwd.formState.errors.repeat} {...pwd.register("repeat")} />
            </Field>
          </div>
          <Button type="submit" className="self-start" loading={pwd.formState.isSubmitting}>
            Сменить пароль
          </Button>
        </form>
      </SettingsSection>

      <Modal
        open={verify}
        onClose={() => setVerify(false)}
        title="Подтвердите новую почту"
        size="sm"
        footer={
          <Button
            variant="primary"
            disabled={code.length < 6}
            onClick={async () => {
              await api.saveAccount({ email, nick, defaultCabinet: role, code });
              setVerify(false);
              setCode("");
              setDirty(false);
              toast.success("Почта изменена");
            }}
          >
            Подтвердить
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-text-2">Мы отправили 6-значный код на {email}.</p>
          <OtpInput value={code} onChange={setCode} autoFocus />
        </div>
      </Modal>
    </div>
  );
}
