"use client";

import { useState } from "react";
import { Download, Pencil, Plus } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/form";
import { PageHeader, StatTile } from "@/shared/ui/misc";
import { Modal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

type Data = Awaited<ReturnType<typeof api.payments>>;
type Tx = Data["transactions"][number];
type Promo = { code: string; value: string; meta: string; active: boolean };
const TX = { success: { label: "Успешно", tone: "success" }, failed: { label: "Отклонено", tone: "accent" }, refund: { label: "Возврат", tone: "muted" } } as const;

export function PaymentsScreen({ initial }: { initial: Data }) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [filter, setFilter] = useState<"all" | "failed" | "refund">("all");
  const [details, setDetails] = useState<Tx | null>(null);
  const [promos, setPromos] = useState<Promo[]>([...initial.promos]);
  const [create, setCreate] = useState(false);
  const [draft, setDraft] = useState({ code: "", kind: "discount", value: "20", plan: "Pro", until: "2026-12-31", limit: "50" });
  const txs = initial.transactions.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Админка // Биллинг"
        title="Подписки и платежи"
        sub="Выручка и транзакции"
        actions={
          <>
            <Segmented label="Период" active={period} onChange={setPeriod} items={[{ key: "month", label: "Сентябрь" }, { key: "quarter", label: "Квартал" }, { key: "year", label: "Год" }]} />
            <Button icon={Download} onClick={() => toast.info("Экспорт запущен")}>
              Экспорт
            </Button>
          </>
        }
      />
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="MRR" value="[СУММА]" tone="accent" />
        <StatTile label="Активных Pro" value="[N]" />
        <StatTile label="Активных Лига" value="[N]" tone="gold" />
        <StatTile label="Отток за месяц" value="[N]%" />
      </div>
      <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
        <Card className="min-w-0 self-start">
          <CardHeader title="Транзакции">
            <Segmented label="Фильтр" active={filter} onChange={setFilter} items={[{ key: "all", label: "Все" }, { key: "failed", label: "Ошибки" }, { key: "refund", label: "Возвраты" }]} />
          </CardHeader>
          <Table minWidth={760} label="Транзакции">
            <THead>
              <Th>Время</Th>
              <Th sticky>Клиент</Th>
              <Th>Сумма</Th>
              <Th>Статус</Th>
              <Th>Метод</Th>
              <Th align="right" />
            </THead>
            <tbody>
              {txs.map((t) => (
                <Tr key={t.at}>
                  <Td className="mono">{t.at}</Td>
                  <Td sticky>
                    <span className="flex flex-col">
                      <span className="font-semibold">{t.client}</span>
                      <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{t.plan}</span>
                    </span>
                  </Td>
                  <Td className="font-display text-[20px]">{t.amount}</Td>
                  <Td>
                    <Badge tone={TX[t.status].tone} dot={t.status === "failed"}>
                      {TX[t.status].label}
                    </Badge>
                  </Td>
                  <Td className="mono text-[12px]">{t.method}</Td>
                  <Td align="right">
                    <Button size="sm" variant="ghost" onClick={() => setDetails(t)}>
                      Детали
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Тарифы" />
            {[
              ["Free", "0 · лимит 3 турнира"],
              ["Pro", "[ЦЕНА] / мес"],
              ["Лига", "[ЦЕНА] / мес"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line px-6 py-3.5 text-[15px]">
                {k}
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            <div className="p-5">
              <Button block icon={Pencil} onClick={() => toast.info("Редактор тарифов", "Изменения цен применятся к новым подпискам")}>
                Редактировать тарифы
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Промокоды" />
            {promos.map((p) => (
              <div key={p.code} className="flex items-center gap-4 border-b border-line px-6 py-4">
                <span className="mono w-14 text-[12px]">{p.value}</span>
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{p.code}</span>
                  <span className="mono text-[9px] tracking-[0.12em] text-text-3 uppercase">{p.meta}</span>
                </span>
                <Badge tone={p.active ? "success" : "muted"}>{p.active ? "Активен" : "Выкл"}</Badge>
              </div>
            ))}
            <div className="p-5">
              <Button block variant="ghost" icon={Plus} onClick={() => setCreate(true)}>
                Создать промокод
              </Button>
            </div>
          </Card>
        </aside>
      </div>
      <Modal open={!!details} onClose={() => setDetails(null)} title="Транзакция" size="sm">
        {details && (
          <dl className="flex flex-col gap-3 text-[14px]">
            {[
              ["Клиент", details.client],
              ["Тариф", details.plan],
              ["Сумма", details.amount],
              ["Метод", details.method],
              ["Время", details.at],
              ["Статус", TX[details.status].label],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                <dt className="text-text-2">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="Новый промокод"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreate(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              disabled={!/^[A-Z0-9]{4,20}$/.test(draft.code)}
              onClick={() => {
                setPromos((l) => [{ code: draft.code, value: draft.kind === "discount" ? `-${draft.value}%` : `${draft.value} мес`, meta: `${draft.plan} · до ${draft.until.split("-").reverse().slice(0, 2).join(".")} · 0`, active: true }, ...l]);
                setCreate(false);
                toast.success("Промокод создан");
              }}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Код" htmlFor="pc" hint="Латиница и цифры, 4–20 символов" className="tab:col-span-2">
            <Input id="pc" value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} />
          </Field>
          <Field label="Тип" htmlFor="pk">
            <Select id="pk" value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))} options={[{ value: "discount", label: "Скидка, %" }, { value: "trial", label: "Бесплатный период, мес" }]} />
          </Field>
          <Field label={draft.kind === "discount" ? "Скидка, %" : "Месяцев"} htmlFor="pv">
            <Input id="pv" inputMode="numeric" value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value.replace(/\D/g, "") }))} />
          </Field>
          <Field label="Тариф" htmlFor="pp">
            <Select id="pp" value={draft.plan} onChange={(e) => setDraft((d) => ({ ...d, plan: e.target.value }))} options={["Pro", "Лига"]} />
          </Field>
          <Field label="Действует до" htmlFor="pu">
            <Input id="pu" type="date" value={draft.until} onChange={(e) => setDraft((d) => ({ ...d, until: e.target.value }))} />
          </Field>
          <Field label="Число активаций" htmlFor="pl">
            <Input id="pl" inputMode="numeric" value={draft.limit} onChange={(e) => setDraft((d) => ({ ...d, limit: e.target.value.replace(/\D/g, "") }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
