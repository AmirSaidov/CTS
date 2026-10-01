"use client";

import { useState } from "react";
import { Building, Check, Flag, MessageSquare, TriangleAlert, type LucideIcon } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CardHeader, CornerMarkers, KeyRow } from "@/shared/ui/card";
import { Field, RadioCard, Textarea } from "@/shared/ui/form";
import { PageHeader, Placeholder } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { EmptyStateView } from "@/shared/ui/empty-state";

type Case = Awaited<ReturnType<typeof api.moderation>>[number];
const ICONS: Record<string, LucideIcon> = { flag: Flag, alert: TriangleAlert, message: MessageSquare, building: Building };
const DECISIONS = [
  { key: "warn", title: "Предупреждение", text: "Без ограничений" },
  { key: "ban30", title: "Бан 30 дней", text: "Турниры и матчи" },
  { key: "perm", title: "Перм. бан", text: "Аккаунт и устройство" },
] as const;

export function ModerationScreen({ initial }: { initial: Case[] }) {
  const [queue, setQueue] = useState(initial);
  const [state, setState] = useState<"open" | "work" | "closed">("open");
  const [kind, setKind] = useState<"all" | "complaint" | "tournament" | "verification">("all");
  const [current, setCurrent] = useState(initial[0]?.id);
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]["key"]>("perm");
  const [reason, setReason] = useState("Использование стороннего ПО подтверждено по демо матча.");
  const [confirm, setConfirm] = useState(false);

  const list = state === "open" ? queue.filter((c) => kind === "all" || c.kind === kind) : [];
  const c = list.find((x) => x.id === current) ?? list[0];

  const close = (msg: string) => {
    setQueue((q) => q.filter((x) => x.id !== c?.id));
    toast.success(msg, "Пользователь получит уведомление · действие в журнале");
    setConfirm(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Админка // Модерация"
        title="Модерация"
        sub={`${queue.length} открытых обращений`}
        actions={
          <Segmented
            label="Состояние"
            active={state}
            onChange={setState}
            items={[
              { key: "open", label: `Открытые · ${queue.length}` },
              { key: "work", label: "В работе · 3" },
              { key: "closed", label: "Закрытые" },
            ]}
          />
        }
      />
      <div className="grid gap-6 desk:grid-cols-[1fr_560px]">
        <section className="self-start border border-line" aria-labelledby="queue-h">
          <CardHeader id="queue-h" title="Очередь">
            <Segmented
              label="Тип"
              active={kind}
              onChange={setKind}
              items={[
                { key: "all", label: "Все" },
                { key: "complaint", label: "Жалобы" },
                { key: "tournament", label: "Турниры" },
                { key: "verification", label: "Верификация" },
              ]}
            />
          </CardHeader>
          {list.length === 0 ? (
            <div className="p-6">
              <EmptyStateView code="EMPTY.QUEUE" icon={Check} title="Очередь пуста" text="Новых обращений нет." />
            </div>
          ) : (
            <ul>
              {list.map((q) => {
                const Icon = ICONS[q.icon];
                const on = c?.id === q.id;
                return (
                  <li key={q.id}>
                    <button type="button" onClick={() => setCurrent(q.id)} aria-current={on} className={cn("flex w-full gap-4 border-b border-line px-6 py-5 text-left last:border-b-0 hover:bg-elev-1", on && "bg-elev-2")}>
                      <span className={cn("flex size-11 shrink-0 items-center justify-center border", "warn" in q && q.warn ? "border-gold text-gold" : "border-line-strong")}>
                        <Icon size={18} strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-[16px] font-semibold">{q.title}</span>
                        <span className="truncate text-[14px] text-text-2">{q.meta}</span>
                      </span>
                      <span className="mono flex shrink-0 items-start gap-2 text-[10px] text-text-3">
                        {q.age} {q.unread && <span className="mt-0.5 size-1.5 bg-text" aria-label="Новое" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        {c && (
          <section className="relative self-start border border-accent bg-elev-1" aria-labelledby="case-h">
            <CornerMarkers offset={8} />
            <CardHeader id="case-h" title={`${c.kind === "verification" ? "Верификация" : c.kind === "tournament" ? "Турнир" : "Жалоба"} #${c.id}`}>
              <Badge tone="accent" dot>
                Высокий приоритет
              </Badge>
            </CardHeader>
            <KeyRow k="Нарушитель" v="xX_smurf_Xx · аккаунт 1 день" />
            <KeyRow k="Жалобы от" v="Kok-Boru, Steppe Rush, судья турнира" />
            <KeyRow k="Матч" v="QF-03 · Weekend Clash #14" />
            <KeyRow k="Прошлые нарушения" v="Нет" />
            <div className="flex flex-col gap-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <Placeholder label="Клип 1" className="h-[110px] border border-line" />
                <Placeholder label="Клип 2" className="h-[110px] border border-line" />
              </div>
              <fieldset className="flex flex-col gap-3">
                <legend className="mono-label mb-3">Решение</legend>
                <div className="grid grid-cols-3 gap-2">
                  {DECISIONS.map((d) => (
                    <RadioCard key={d.key} name="decision" value={d.key} title={d.title} text={d.text} checked={decision === d.key} onSelect={() => setDecision(d.key)} className="p-4 [&_.font-display]:text-[17px]" />
                  ))}
                </div>
              </fieldset>
              <Field label="Причина для пользователя" htmlFor="mr">
                <Textarea id="mr" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <Button onClick={() => close("Жалоба отклонена")}>Отклонить жалобу</Button>
                <Button variant="primary" icon={Check} disabled={reason.trim().length < 5} onClick={() => (decision === "warn" ? close("Предупреждение выдано") : setConfirm(true))}>
                  Применить
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        danger
        title={decision === "perm" ? "Перманентный бан?" : "Бан на 30 дней?"}
        text={decision === "perm" ? "Аккаунт и устройство будут заблокированы навсегда. Отменить можно только через журнал суперадмина." : "Пользователь не сможет подавать заявки и играть матчи 30 дней."}
        confirmLabel="Забанить"
        onConfirm={() => close(decision === "perm" ? "Перманентный бан применён" : "Бан на 30 дней применён")}
      />
    </div>
  );
}
