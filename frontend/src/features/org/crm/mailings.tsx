"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Clock, Plus, Send } from "lucide-react";
import type { Mailing } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { fmtDayTime } from "@/shared/lib/format";
import { hasPlan } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { Badge, ProBadge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/shared/ui/form";
import { PageHeader } from "@/shared/ui/misc";
import { ConfirmModal, Modal } from "@/shared/ui/overlay";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

const VARS = ["капитан", "команда", "турнир", "время_матча"] as const;
const SAMPLE: Record<(typeof VARS)[number], string> = { капитан: "Aktan", команда: "TENGRI", турнир: "Osh Open", время_матча: "10.10 · 16:00" };
const AUDIENCES = [
  { value: "captains:osh-open", label: "Капитаны · Osh Open", count: 12 },
  { value: "all:osh-open", label: "Все игроки · Osh Open", count: 64 },
  { value: "captains:all", label: "Все капитаны базы", count: 48 },
  { value: "vip", label: "Метка VIP", count: 6 },
];
const TEMPLATES: Record<string, { subject: string; text: string }> = {
  "Напоминание о матче": { subject: "Osh Open: жеребьёвка 09.10 в 20:00", text: "Привет, {капитан}! Жеребьёвка Osh Open пройдёт 09.10 в 20:00 в прямом эфире. Сетка появится на странице турнира сразу после неё." },
  "Регистрация открыта": { subject: "Открыта регистрация: {турнир}", text: "Привет, {капитан}! Регистрация на {турнир} открыта. Подайте заявку от {команда} до 08.10." },
  "Чек-ин открыт": { subject: "Чек-ин открыт", text: "{команда}, чек-ин на матч в {время_матча} открыт. Отметьтесь в кабинете за 10 минут до старта." },
  "Итоги турнира": { subject: "Итоги {турнир}", text: "Спасибо, {команда}! Итоги и фото — на странице турнира." },
};

const fill = (s: string) => s.replace(/\{([^}]+)\}/g, (m, k: keyof typeof SAMPLE) => SAMPLE[k] ?? m);

export function MailingsScreen({ initial }: { initial: Mailing[] }) {
  const qc = useQueryClient();
  const user = useUser();
  const pro = hasPlan(user, "pro");
  const { data: history = [] } = useQuery({ queryKey: qk.mailings, queryFn: () => api.mailings(), initialData: initial });
  const [audience, setAudience] = useState(AUDIENCES[0].value);
  const [template, setTemplate] = useState("Напоминание о матче");
  const [subject, setSubject] = useState(TEMPLATES[template].subject);
  const [text, setText] = useState(TEMPLATES[template].text);
  const [channels, setChannels] = useState({ cts: true, telegram: pro, email: false });
  const [confirm, setConfirm] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [when, setWhen] = useState("2026-10-09T18:00");
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const count = AUDIENCES.find((a) => a.value === audience)?.count ?? 0;
  const chosen = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  const insertVar = (v: string) => {
    const el = area.current;
    const token = `{${v}}`;
    if (!el) return setText((t) => t + token);
    const { selectionStart: s, selectionEnd: e } = el;
    const next = text.slice(0, s) + token + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length);
    });
  };

  const send = async (scheduleAt?: string) => {
    setBusy(true);
    try {
      await api.sendMailing({ audience, subject, text, channels: chosen, scheduleAt });
      qc.setQueryData<Mailing[]>(qk.mailings, (l) => [{ id: crypto.randomUUID(), title: fill(subject), audience: `${AUDIENCES.find((a) => a.value === audience)?.label} · ${count}`, status: scheduleAt ? "scheduled" : "sent", at: scheduleAt ? new Date(scheduleAt).toISOString() : new Date().toISOString(), readRate: null }, ...(l ?? [])]);
      toast.success(scheduleAt ? "Рассылка запланирована" : `Отправлено · ${count} получателей`);
    } catch {
      toast.error("Рассылка не отправлена");
    } finally {
      setBusy(false);
      setConfirm(false);
      setSchedule(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Организатор // Рассылки" title="Рассылки" sub="Сообщения участникам в Telegram, на почту и в уведомления CTS" />
      <div className="grid gap-6 desk:grid-cols-[1fr_440px]">
        <Card>
          <CardHeader title="Новая рассылка" />
          <div className="flex flex-col gap-5 p-6">
            <div className="grid gap-4 tab:grid-cols-2">
              <Field label="Кому" htmlFor="aud">
                <Select id="aud" value={audience} onChange={(e) => setAudience(e.target.value)} options={AUDIENCES.map((a) => ({ value: a.value, label: a.label }))} />
              </Field>
              <Field label="Шаблон" htmlFor="tpl">
                <Select
                  id="tpl"
                  value={template}
                  onChange={(e) => {
                    setTemplate(e.target.value);
                    setSubject(TEMPLATES[e.target.value].subject);
                    setText(TEMPLATES[e.target.value].text);
                  }}
                  options={Object.keys(TEMPLATES)}
                />
              </Field>
            </div>
            <Field label="Тема" htmlFor="subj">
              <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Текст" htmlFor="text" hint={`${text.length} / 1000`}>
              <Textarea ref={area} id="text" rows={6} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-label">Переменные:</span>
              {VARS.map((v) => (
                <button key={v} type="button" onClick={() => insertVar(v)} className="mono border border-line-strong px-2 py-1 text-[10px] tracking-[0.1em] text-text-2 hover:border-accent hover:text-text">
                  {`{${v}}`}
                </button>
              ))}
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="mono-label mb-3">Каналы</legend>
              <div className="flex flex-wrap gap-6">
                <Checkbox label="Уведомление CTS" checked={channels.cts} onChange={(e) => setChannels((c) => ({ ...c, cts: e.target.checked }))} />
                <Checkbox
                  label={
                    <span className="flex items-center gap-2">
                      Telegram {!pro && <ProBadge className="h-5" />}
                    </span>
                  }
                  disabled={!pro}
                  checked={channels.telegram}
                  onChange={(e) => setChannels((c) => ({ ...c, telegram: e.target.checked }))}
                />
                <Checkbox label="Почта" checked={channels.email} onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))} />
              </div>
            </fieldset>
            <div className="grid gap-3 tab:grid-cols-[auto_1fr]">
              <Button size="lg" icon={Clock} disabled={!chosen.length || !text.trim()} onClick={() => setSchedule(true)}>
                Запланировать
              </Button>
              <Button variant="primary" size="lg" icon={Send} disabled={!chosen.length || !text.trim()} onClick={() => setConfirm(true)}>
                Отправить · {count} получателей
              </Button>
            </div>
          </div>
        </Card>
        <aside className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <span className="mono-label">Превью · Telegram</span>
              <ProBadge />
            </div>
            <div className="flex flex-col gap-3 border border-line bg-elev-2 p-5" aria-live="polite">
              <span className="mono text-[10px] tracking-[0.16em] text-text-3 uppercase">CTS Bot</span>
              <span className="text-[18px] font-semibold">{fill(subject)}</span>
              <p className="text-[14px] whitespace-pre-line text-text-2">{fill(text)}</p>
              <span className="w-fit border border-line-strong px-3 py-1.5 text-[13px]">Открыть турнир</span>
            </div>
          </Card>
          <Card tone="raised" className="flex flex-col gap-1 p-6">
            <CornerMarkers only="tl" />
            <h2 className="t-h3 mb-3">Шаблоны</h2>
            {Object.keys(TEMPLATES).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTemplate(t);
                  setSubject(TEMPLATES[t].subject);
                  setText(TEMPLATES[t].text);
                }}
                className="flex items-center justify-between py-2 text-left text-[15px] hover:text-accent-hover"
              >
                {t} <ChevronRight size={14} className="text-text-3" aria-hidden />
              </button>
            ))}
            <Button variant="ghost" icon={Plus} className="mt-2" onClick={() => toast.info("Шаблон сохранится из текущего текста", "Назовите его — после API шаблонов")}>
              Новый шаблон
            </Button>
          </Card>
        </aside>
      </div>
      <Card>
        <CardHeader title="История" />
        <Table minWidth={760} label="История рассылок">
          <THead>
            <Th sticky>Рассылка</Th>
            <Th>Получатели</Th>
            <Th>Статус</Th>
            <Th>Время</Th>
            <Th align="right">Открытия</Th>
          </THead>
          <tbody>
            {history.map((m) => (
              <Tr key={m.id}>
                <Td sticky>{m.title}</Td>
                <Td>{m.audience}</Td>
                <Td>
                  <Badge tone={m.status === "sent" ? "success" : m.status === "scheduled" ? "gold" : "muted"}>{m.status === "sent" ? "Отправлено" : m.status === "scheduled" ? "Запланировано" : "Черновик"}</Badge>
                </Td>
                <Td className="mono">{fmtDayTime(m.at)}</Td>
                <Td align="right" className="mono font-semibold">
                  {m.readRate === null ? "—" : `${m.readRate}% прочит.`}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <ConfirmModal open={confirm} onClose={() => setConfirm(false)} loading={busy} onConfirm={() => send()} title={`Отправить ${count} получателям?`} text={`Каналы: ${chosen.map((c) => ({ cts: "CTS", telegram: "Telegram", email: "почта" })[c]).join(", ")}. Отменить отправку будет нельзя.`} confirmLabel="Отправить" />
      <Modal
        open={schedule}
        onClose={() => setSchedule(false)}
        title="Запланировать рассылку"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSchedule(false)}>
              Отмена
            </Button>
            <Button variant="primary" loading={busy} onClick={() => send(when)}>
              Запланировать
            </Button>
          </>
        }
      >
        <Field label="Дата и время (UTC+6)" htmlFor="when">
          <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
