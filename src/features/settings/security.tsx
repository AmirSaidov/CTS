"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Download, FileText, LogOut, Mail, Smartphone, User } from "lucide-react";
import type { AuthSession, SessionUser } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { download } from "@/shared/lib/format";
import { toast } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Field, Input, Password, Select, Toggle } from "@/shared/ui/form";
import { PageHeader } from "@/shared/ui/misc";
import { ConfirmModal, Modal } from "@/shared/ui/overlay";
import { OtpInput } from "@/shared/ui/otp";
import { passwordRule } from "@/features/auth/register-form";
import { SettingsSection } from "./section";

const pwdSchema = z
  .object({ current: z.string().min(1, "Введите текущий пароль"), next: passwordRule, repeat: z.string() })
  .refine((v) => v.next === v.repeat, { path: ["repeat"], message: "Пароли не совпадают" })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Новый пароль совпадает с текущим" });


export function SecurityScreen({ user, sessions: initialSessions }: { user: SessionUser; sessions: AuthSession[] }) {
  const [email, setEmail] = useState(user.email);
  const [nick, setNick] = useState(user.nick);
  const [role, setRole] = useState(user.isOrganizer ? "both" : "player");
  const [dirty, setDirty] = useState(false);
  const [verify, setVerify] = useState<null | "email" | "phone">(null);
  const [code, setCode] = useState("");
  const [twofa, setTwofa] = useState(true);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [sessions, setSessions] = useState(initialSessions);
  const [logoutAll, setLogoutAll] = useState(false);
  useUnsavedGuard(dirty);

  const pwd = useForm<z.infer<typeof pwdSchema>>({ resolver: zodResolver(pwdSchema), mode: "onTouched" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Настройки // Аккаунт"
        title="Профиль и безопасность"
        sub="Данные для входа и защита аккаунта"
        actions={
          <Button
            variant="primary"
            icon={Check}
            disabled={!dirty}
            onClick={async () => {
              // смена почты требует подтверждения новым кодом
              if (email !== user.email) return setVerify("email");
              await api.saveAccount({ nick, defaultCabinet: role });
              setDirty(false);
              toast.success("Сохранено");
            }}
          >
            Сохранить
          </Button>
        }
      />
      <SettingsSection title="Данные входа" text="Почта и телефон используются для входа и восстановления.">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Почта" htmlFor="em" hint={email === user.email ? (user.emailVerified ? "Подтверждена" : "Не подтверждена") : "Нужно подтвердить новую почту кодом"}>
            <Input id="em" type="email" icon={Mail} value={email} onChange={(e) => { setEmail(e.target.value); setDirty(true); }} />
          </Field>
          <Field label="Телефон" htmlFor="ph" hint="Подтверждён" aside={<button type="button" className="text-[12px] text-text-2 hover:text-text" onClick={() => setVerify("phone")}>Сменить</button>}>
            <Input id="ph" icon={Smartphone} value={user.phone} readOnly />
          </Field>
          <Field label="Ник" htmlFor="nk">
            <Input id="nk" icon={User} value={nick} onChange={(e) => { setNick(e.target.value); setDirty(true); }} />
          </Field>
          <Field label="Роль по умолчанию" htmlFor="dr" hint="Куда вести после входа">
            <Select id="dr" value={role} onChange={(e) => { setRole(e.target.value); setDirty(true); }} options={[{ value: "player", label: "Игрок" }, { value: "org", label: "Организатор" }, { value: "both", label: "Игрок и организатор" }]} />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Пароль" text="Последняя смена — 3 месяца назад.">
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

      <SettingsSection title="Двухфакторная защита" text="Код из приложения или Telegram при входе с нового устройства.">
        <Toggle label="Включить 2FA" hint="Способ: Telegram-бот CTS" checked={twofa} onChange={async (v) => { setTwofa(v); await api.setTwoFactor(v); toast.success(v ? "2FA включена" : "2FA выключена"); }} />
        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          <Button icon={FileText} disabled={!twofa} onClick={async () => setCodes((await api.backupCodes()).codes)}>
            Резервные коды
          </Button>
          <Button variant="ghost" disabled={!twofa} onClick={() => toast.info("Смена способа", "Выберите приложение-аутентификатор или Telegram")}>
            Сменить способ
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Активные сессии" text="Выйдите с устройств, которыми не пользуетесь.">
        <ul className="border border-line">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-5 border-b border-line px-5 py-4 last:border-b-0">
              <span className={s.current ? "mono w-14 text-[12px] text-success-text" : "mono w-14 text-[11px] text-text-3"}>{s.age}</span>
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{s.device}</span>
                <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{s.meta}</span>
              </span>
              {s.current ? (
                <Badge tone="success">Активна</Badge>
              ) : (
                <Button size="sm" variant="ghost" onClick={async () => { await api.revokeSession(s.id); setSessions((l) => l.filter((x) => x.id !== s.id)); toast.success("Сессия завершена"); }}>
                  Выйти
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Button variant="danger" icon={LogOut} className="self-start" onClick={() => setLogoutAll(true)}>
          Выйти со всех устройств
        </Button>
      </SettingsSection>

      <Modal
        open={!!verify}
        onClose={() => setVerify(null)}
        title={verify === "email" ? "Подтвердите новую почту" : "Подтвердите телефон"}
        size="sm"
        footer={
          <Button
            variant="primary"
            disabled={code.length < 6}
            onClick={async () => {
              await api.saveAccount({ email, nick, defaultCabinet: role, code });
              setVerify(null);
              setCode("");
              setDirty(false);
              toast.success(verify === "email" ? "Почта изменена" : "Телефон изменён");
            }}
          >
            Подтвердить
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-text-2">Мы отправили 6-значный код на {verify === "email" ? email : "новый номер"}.</p>
          <OtpInput value={code} onChange={setCode} autoFocus />
        </div>
      </Modal>

      <Modal
        open={!!codes}
        onClose={() => setCodes(null)}
        title="Резервные коды"
        size="sm"
        footer={
          <Button icon={Download} onClick={() => codes && download("cts-backup-codes.txt", codes.join("\n"))}>
            Скачать
          </Button>
        }
      >
        <p className="mb-4 text-[14px] text-text-2">Коды показываются один раз. Сохраните их — каждый можно использовать для входа однократно.</p>
        <ul className="mono grid grid-cols-2 gap-2 text-[15px]">
          {codes?.map((c) => (
            <li key={c} className="border border-line px-3 py-2 text-center">
              {c}
            </li>
          ))}
        </ul>
      </Modal>

      <ConfirmModal
        open={logoutAll}
        onClose={() => setLogoutAll(false)}
        danger
        title="Выйти со всех устройств?"
        text="Все сессии, кроме текущей, будут завершены. Понадобится войти заново."
        confirmLabel="Выйти везде"
        onConfirm={async () => {
          await api.revokeSession("others");
          setSessions((l) => l.filter((s) => s.current));
          setLogoutAll(false);
          toast.success("Сессии завершены");
        }}
      />
    </div>
  );
}
