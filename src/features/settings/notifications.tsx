"use client";

import { useEffect, useState } from "react";
import { Check, Clock } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { toast, useUser } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { Checkbox, Field, Input, Toggle } from "@/shared/ui/form";
import { PageHeader, TeamLogo } from "@/shared/ui/misc";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

const EVENTS = [
  { key: "reminder", title: "Напоминание о матче", hint: "За 60 и 10 минут" },
  { key: "checkin", title: "Чек-ин открыт", hint: "Когда можно отметиться" },
  { key: "schedule", title: "Изменение расписания", hint: "Перенос времени и площадки" },
  { key: "result", title: "Результат матча", hint: "Подтверждение и споры" },
  { key: "invites", title: "Приглашения", hint: "В команду, на турнир, скримы" },
  { key: "applications", title: "Новые заявки", hint: "Для организаторов", org: true },
  { key: "news", title: "Новости CTS", hint: "Обновления и анонсы" },
] as const;
const CHANNELS = ["cts", "telegram", "email"] as const;
type Prefs = Record<string, Record<(typeof CHANNELS)[number], boolean>>;

const DEFAULTS: Prefs = {
  reminder: { cts: true, telegram: true, email: false },
  checkin: { cts: true, telegram: true, email: false },
  schedule: { cts: true, telegram: true, email: true },
  result: { cts: true, telegram: true, email: false },
  invites: { cts: true, telegram: true, email: true },
  applications: { cts: true, telegram: false, email: true },
  news: { cts: false, telegram: false, email: true },
};

export function NotificationSettings() {
  const user = useUser();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [telegram, setTelegram] = useState(true);
  const [push, setPush] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- разрешение известно только в браузере
    setPush(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);
  const [quiet, setQuiet] = useState(true);
  const [from, setFrom] = useState("00:00");
  const [to, setTo] = useState("08:00");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(dirty);
  const events = EVENTS.filter((e) => !("org" in e) || user?.isOrganizer);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Настройки // Уведомления"
        title="Уведомления"
        sub="Куда и о чём сообщать"
        actions={
          <Button
            variant="primary"
            icon={Check}
            loading={busy}
            disabled={!dirty}
            onClick={async () => {
              setBusy(true);
              await api.saveNotificationPrefs({ prefs, quiet: quiet ? { from, to } : null });
              setBusy(false);
              setDirty(false);
              toast.success("Настройки уведомлений сохранены");
            }}
          >
            Сохранить
          </Button>
        }
      />
      <div className="grid gap-4 desk:grid-cols-3">
        <Card tone="raised" className="flex items-center gap-4 p-5">
          <TeamLogo tag="TG" size={44} />
          <span className="flex flex-1 flex-col">
            <span className="text-[17px] font-semibold">Telegram</span>
            <span className="mono text-[10px] tracking-[0.12em] text-success-text uppercase">{telegram ? "@aktan_kg · подключён" : "не подключён"}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => setTelegram((v) => !v)}>
            {telegram ? "Отключить" : "Подключить"}
          </Button>
        </Card>
        <Card tone="raised" className="flex items-center gap-4 p-5">
          <TeamLogo tag="@" size={44} />
          <span className="flex flex-1 flex-col">
            <span className="text-[17px] font-semibold">Почта</span>
            <span className="mono text-[10px] tracking-[0.12em] text-text-3 uppercase">{user?.email}</span>
          </span>
          <Badge tone="success">OK</Badge>
        </Card>
        <Card tone="raised" className="flex items-center gap-4 p-5">
          <TeamLogo tag="WB" size={44} />
          <span className="flex flex-1 flex-col">
            <span className="text-[17px] font-semibold">Браузер</span>
            <span className="mono text-[10px] tracking-[0.12em] text-text-3 uppercase">{push === "granted" ? "Разрешено" : push === "denied" ? "Запрещено в браузере" : push === "unsupported" ? "Не поддерживается" : "Не разрешено"}</span>
          </span>
          {push === "default" && (
            <Button
              size="sm"
              onClick={async () => {
                // системный запрос разрешения; подписку на push бэкенд оформит через Web Push (VAPID)
                const r = await Notification.requestPermission();
                setPush(r);
                if (r === "granted") toast.success("Браузерные уведомления включены");
              }}
            >
              Разрешить
            </Button>
          )}
        </Card>
      </div>
      <Card>
        <CardHeader title="Что присылать" />
        <Table minWidth={640} label="Каналы уведомлений">
          <THead>
            <Th sticky>Событие</Th>
            <Th align="center">CTS</Th>
            <Th align="center">Telegram</Th>
            <Th align="center">Почта</Th>
          </THead>
          <tbody>
            {events.map((e) => (
              <Tr key={e.key}>
                <Td sticky>
                  <span className="flex flex-col">
                    <span className="font-semibold">{e.title}</span>
                    <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{e.hint}</span>
                  </span>
                </Td>
                {CHANNELS.map((c) => (
                  <Td key={c} align="center">
                    <span className="inline-flex">
                      <Checkbox
                        aria-label={`${e.title}: ${c === "cts" ? "CTS" : c === "telegram" ? "Telegram" : "почта"}`}
                        checked={prefs[e.key][c]}
                        disabled={c === "telegram" && !telegram}
                        onChange={(ev) => {
                          setPrefs((p) => ({ ...p, [e.key]: { ...p[e.key], [c]: ev.target.checked } }));
                          setDirty(true);
                        }}
                      />
                    </span>
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card tone="raised" className="flex flex-col gap-5 p-6">
        <Toggle label="Тихие часы" hint={`Не присылать уведомления с ${from} до ${to}, кроме чек-ина`} checked={quiet} onChange={(v) => { setQuiet(v); setDirty(true); }} />
        {quiet && (
          <div className="grid gap-4 border-t border-line pt-5 tab:grid-cols-2">
            <Field label="С" htmlFor="qf">
              <Input id="qf" type="time" icon={Clock} value={from} onChange={(e) => { setFrom(e.target.value); setDirty(true); }} />
            </Field>
            <Field label="До" htmlFor="qt">
              <Input id="qt" type="time" icon={Clock} value={to} onChange={(e) => { setTo(e.target.value); setDirty(true); }} />
            </Field>
          </div>
        )}
      </Card>
    </div>
  );
}
