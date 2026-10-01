"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Trash, TriangleAlert, User, X } from "lucide-react";
import type { SessionUser } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { ApiRequestError } from "@/shared/api/client";
import { toast } from "@/shared/lib/stores";
import { Button } from "@/shared/ui/button";
import { Card, CornerMarkers } from "@/shared/ui/card";
import { Checkbox, Field, Input, Password, Select, Textarea } from "@/shared/ui/form";
import { PageHeader } from "@/shared/ui/misc";

export function DeleteAccount({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [reason, setReason] = useState("Больше не участвую в турнирах");
  const [comment, setComment] = useState("");
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [sure, setSure] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // капитан без переданного капитанства — блокирующее предупреждение
  const blocked = !!user.captainOf;
  const ready = !blocked && nick === user.nick && password.length > 0 && sure;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Настройки // Опасная зона" title="Удаление аккаунта" sub="Действие необратимо" />
      <div className="grid gap-6 desk:grid-cols-2">
        <Card tone="raised" className="flex flex-col gap-5 self-start p-6 tab:p-8">
          <CornerMarkers only="tl" />
          <h2 className="t-h2">Что произойдёт</h2>
          <ul className="flex flex-col gap-3 text-[15px] text-text-2">
            {["Профиль и ник станут недоступны", `Вы покинете команду ${user.team?.name ?? ""} — капитанство нужно передать заранее`, "Подписка Pro будет отменена без возврата за текущий месяц", "Турниры организации останутся, но без владельца"].map((t) => (
              <li key={t} className="flex gap-3">
                <X size={16} className="mt-1 shrink-0 text-text-3" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3 border-t border-line pt-5 text-[15px] text-text-2">
            {["Результаты матчей сохранятся анонимно", "30 дней можно восстановить аккаунт через поддержку"].map((t) => (
              <li key={t} className="flex gap-3">
                <Check size={16} className="mt-1 shrink-0 text-success-text" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <Button
            icon={Download}
            className="self-start"
            onClick={async () => {
              await api.exportMyData();
              toast.success("Архив готовится", "Ссылка на скачивание придёт на почту");
            }}
          >
            Скачать мои данные
          </Button>
        </Card>
        <section className="relative flex flex-col gap-5 border border-accent bg-elev-1 p-6 tab:p-8" aria-labelledby="del-h">
          <CornerMarkers offset={6} />
          <h2 id="del-h" className="t-h2 flex items-center gap-3">
            <TriangleAlert size={22} aria-hidden /> Подтвердите удаление
          </h2>
          {blocked && (
            <div role="alert" className="flex flex-col gap-2 border border-gold p-4 text-[14px]">
              <span className="font-semibold text-gold">Вы капитан {user.team?.name}</span>
              <span className="text-text-2">
                Сначала передайте капитанство в разделе{" "}
                <Link href="/me/team" className="underline underline-offset-2 hover:text-text">
                  «Моя команда»
                </Link>
                .
              </span>
            </div>
          )}
          <Field label="Причина" htmlFor="dr">
            <Select id="dr" value={reason} onChange={(e) => setReason(e.target.value)} options={["Больше не участвую в турнирах", "Создам новый аккаунт", "Не устраивает сервис", "Беспокоюсь о данных", "Другое"]} />
          </Field>
          <Field label="Комментарий (необязательно)" htmlFor="dc">
            <Textarea id="dc" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <Field label="Введите ник для подтверждения" htmlFor="dn" hint={`Ваш ник: ${user.nick}`}>
            <Input id="dn" icon={User} placeholder={user.nick} autoComplete="off" value={nick} onChange={(e) => setNick(e.target.value)} />
          </Field>
          <Field label="Пароль" htmlFor="dp" error={err ?? undefined}>
            <Password id="dp" value={password} invalid={!!err} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Checkbox label="Понимаю, что действие необратимо" checked={sure} onChange={(e) => setSure(e.target.checked)} />
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Button href="/settings/profile">Отмена</Button>
            <Button
              variant="danger"
              icon={Trash}
              disabled={!ready}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                setErr(null);
                try {
                  await api.deleteAccount({ reason, comment, nick, password });
                  document.cookie = "cts_mock_role=guest; path=/; max-age=31536000";
                  toast.success("Аккаунт удалён", "30 дней его можно восстановить через поддержку");
                  router.push("/");
                  router.refresh();
                } catch (e) {
                  setErr(e instanceof ApiRequestError ? (e.fields.password?.[0] ?? e.message) : "Нет связи с сервером");
                  setBusy(false);
                }
              }}
            >
              Удалить аккаунт
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
