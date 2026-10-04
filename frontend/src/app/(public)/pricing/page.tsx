import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { PLAN_COMPARISON } from "@/shared/api/mocks/data";
import { Container } from "@/shared/ui/page";
import { Eyebrow } from "@/shared/ui/misc";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { Accordion } from "@/shared/ui/accordion";
import { PlanCard } from "@/features/pricing/plan-card";

export const metadata: Metadata = { title: "Тарифы", description: "Free, Pro и Лига: начните бесплатно и переходите на Pro, когда турниров станет больше.", alternates: { canonical: "/pricing" } };

const FAQ = [
  { q: "Можно ли начать без оплаты?", a: "Да. Тариф Free бессрочный — переходите на Pro, когда турниров станет больше." },
  { q: "Как перейти на Pro?", a: "Напишите нам в Telegram — подключим тариф вручную и выставим счёт. Онлайн-оплата появится позже." },
  { q: "Берёте ли вы комиссию с взносов?", a: "[УТОЧНИТЬ У ЗАКАЗЧИКА]" },
  { q: "Что будет с турнирами, если отменить Pro?", a: "Турниры и история сохранятся. Pro-функции (брендирование, Telegram-рассылки, взносы) отключатся в конце оплаченного периода." },
];

function Cell({ v }: { v: string }) {
  if (v === "✓") return <Check size={16} className="mx-auto text-text" aria-label="Есть" />;
  if (v === "—") return <Minus size={14} className="mx-auto text-text-4" aria-label="Нет" />;
  return <span className="font-semibold">{v}</span>;
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period = "month" } = await searchParams;
  const plans = await api.plans();
  const discount = plans.find((p) => p.key === "pro")?.yearDiscount ?? "[N]";

  return (
    <>
      <section className="glow [--glow-x:50%] [--glow-y:0%]">
        <Container className="flex flex-col items-center gap-6 pt-16 pb-14 text-center">
          <Eyebrow>[ Тарифы ] // Freemium</Eyebrow>
          <h1 className="t-display">Начните бесплатно</h1>
          <p className="text-[17px] text-text-2">Переходите на Pro, когда турниров станет больше.</p>
          <Segmented
            label="Период оплаты"
            active={period as "month" | "year"}
            items={[
              { key: "month", label: "Помесячно", href: "/pricing" },
              { key: "year", label: `Год · −${discount}%`, href: "/pricing?period=year" },
            ]}
          />
        </Container>
      </section>
      <Container className="flex flex-col gap-24 pb-24">
        <div className="grid items-start gap-6 desk:grid-cols-3 desk:pt-6">
          {plans.map((p) => (
            <PlanCard key={p.key} plan={p} period={period === "year" ? "year" : "month"} />
          ))}
        </div>

        <section className="flex flex-col gap-8" aria-labelledby="compare">
          <h2 id="compare" className="font-display text-[clamp(36px,4vw,56px)]">
            Сравнение тарифов
          </h2>
          <div className="border border-line">
            <Table minWidth={640} label="Сравнение тарифов">
              <THead>
                <Th sticky>Возможность</Th>
                <Th align="center">Free</Th>
                <Th align="center">Pro</Th>
                <Th align="center">Лига</Th>
              </THead>
              <tbody>
                {PLAN_COMPARISON.map(([f, ...vals]) => (
                  <Tr key={f}>
                    <Td sticky className="text-text-2">{f}</Td>
                    {vals.map((v, i) => (
                      <Td key={i} align="center">
                        <Cell v={v} />
                      </Td>
                    ))}
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="faq">
          <h2 id="faq" className="font-display text-[clamp(36px,4vw,56px)]">
            Вопросы об оплате
          </h2>
          <Accordion items={FAQ} openFirst />
        </section>
      </Container>
    </>
  );
}
