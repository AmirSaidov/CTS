"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import type { SessionUser } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { CutFrame } from "@/shared/ui/cut-frame";
import { Field, Input } from "@/shared/ui/form";
import { PageHeader, Progress, TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

type History = { date: string; desc: string; amount: string; status: "paid" | "refund" }[];

/**
 * Подписка и оплата. Ввод карты — только на стороне платёжного сервиса (виджет/редирект):
 * фронт номеров карт не видит. Кнопки ведут на эндпоинт бэкенда, который отдаёт URL оплаты.
 */
export function BillingScreen({ user, history }: { user: SessionUser; history: History }) {
  const org = user.org!;
  const [cancel, setCancel] = useState(false);
  const [legal, setLegal] = useState({ name: "[НАЗВАНИЕ ЮРЛИЦА]", inn: "[ИНН]" });
  const usage = [
    { label: "Турниры", used: 7, limit: null as number | null },
    { label: "Организаторы", used: org.limits.staff[0], limit: org.limits.staff[1] },
    { label: "Рассылки", used: org.limits.mailings[0], limit: org.limits.mailings[1] },
  ];
  const toPayment = (what: string) => toast.info(`${what}`, "Откроется страница платёжного сервиса [ПЛАТЁЖНЫЙ СЕРВИС]");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Настройки // Биллинг" title="Подписка и оплата" sub="Тариф, способ оплаты и история платежей" />
      <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
        <CutFrame cut={22} fill="bg-elev-2">
          <div className="flex flex-col gap-8 p-6 tab:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="mono-label">Текущий тариф</span>
                <Badge tone="success">Активен</Badge>
              </span>
              <span className="mono text-[11px] tracking-[0.14em] text-text-2 uppercase">Следующее списание 24.10.2026</span>
            </div>
            <div className="flex flex-wrap items-end gap-6">
              <span className="font-display text-[88px] leading-none">{org.plan === "free" ? "Free" : org.plan === "pro" ? "Pro" : "Лига"}</span>
              <span className="flex flex-col gap-2 pb-3">
                <span className="font-display text-[26px] leading-none">[ЦЕНА] / мес</span>
                <span className="mono-label">Ежемесячно</span>
              </span>
            </div>
            <div className="grid gap-6 tab:grid-cols-3">
              {usage.map((u) => (
                <div key={u.label} className="flex flex-col gap-2">
                  <span className="mono-label">{u.label}</span>
                  <span className="font-display text-[26px]">{u.limit ? `${u.used} / ${u.limit}` : `${u.used} · Безлимит`}</span>
                  <Progress value={u.limit ? (u.used / u.limit) * 100 : 100} tone={u.limit && u.used >= u.limit ? "accent" : "primary"} label={u.label} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" href="/pricing">
                Сменить тариф
              </Button>
              <Button onClick={() => toPayment("Переход на годовую оплату · −[N]%")}>Перейти на годовую · −[N]%</Button>
              <Button variant="ghost" className="ml-auto" onClick={() => setCancel(true)}>
                Отменить подписку
              </Button>
            </div>
          </div>
        </CutFrame>
        <aside className="flex flex-col gap-6">
          <Card tone="raised" className="flex flex-col gap-4 p-6">
            <CornerMarkers only="tl" />
            <h2 className="t-h3">Способ оплаты</h2>
            <div className="flex items-center gap-4">
              <TeamLogo tag="VS" size={44} />
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">Карта •••• 4417</span>
                <span className="mono text-[10px] text-text-3">до 08/28</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => toPayment("Изменение карты")}>
                Изменить
              </Button>
            </div>
            <Button icon={Plus} block onClick={() => toPayment("Новый способ оплаты")}>
              Добавить способ
            </Button>
          </Card>
          <Card tone="raised" className="flex flex-col gap-4 p-6">
            <h2 className="t-h3">Реквизиты для счёта</h2>
            <Field label="Организация" htmlFor="lo">
              <Input id="lo" value={legal.name} onChange={(e) => setLegal((l) => ({ ...l, name: e.target.value }))} />
            </Field>
            <Field label="ИНН" htmlFor="inn" error={legal.inn && !/^\[|^\d{12,14}$/.test(legal.inn) ? "ИНН — 12–14 цифр" : undefined}>
              <Input id="inn" inputMode="numeric" value={legal.inn} onChange={(e) => setLegal((l) => ({ ...l, inn: e.target.value }))} />
            </Field>
            <Button block onClick={() => toast.success("Реквизиты сохранены")}>
              Сохранить
            </Button>
          </Card>
        </aside>
      </div>
      <Card>
        <CardHeader title="История платежей" />
        <Table minWidth={620} label="История платежей">
          <THead>
            <Th>Дата</Th>
            <Th sticky>Описание</Th>
            <Th>Сумма</Th>
            <Th>Статус</Th>
            <Th align="right" />
          </THead>
          <tbody>
            {history.map((p) => (
              <Tr key={p.date}>
                <Td className="mono">{p.date}</Td>
                <Td sticky>{p.desc}</Td>
                <Td className="font-display text-[20px]">{p.amount}</Td>
                <Td>
                  <Badge tone={p.status === "paid" ? "success" : "muted"}>{p.status === "paid" ? "Оплачено" : "Возврат"}</Badge>
                </Td>
                <Td align="right">
                  <Button size="sm" variant="ghost" icon={Download} href={`/api/v1/org/billing/receipts/${p.date}.pdf`}>
                    PDF
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <ConfirmModal
        open={cancel}
        onClose={() => setCancel(false)}
        danger
        title="Отменить подписку Pro?"
        confirmLabel="Отменить подписку"
        onConfirm={async () => {
          await api.cancelSubscription();
          setCancel(false);
          toast.success("Подписка отменена", "Pro работает до 24.10.2026, затем — Free");
        }}
      >
        <ul className="flex flex-col gap-2 text-[14px] text-text-2">
          <li>· Pro действует до конца оплаченного периода — 24.10.2026.</li>
          <li>· Затем лимит Free: 3 активных турнира. Остальные станут архивными, но не удалятся.</li>
          <li>· Отключатся брендирование, Telegram-рассылки и взносы за участие.</li>
          <li>· Организаторы сверх лимита потеряют доступ.</li>
        </ul>
      </ConfirmModal>
    </div>
  );
}
