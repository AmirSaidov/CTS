import { ArrowRight, Bell, CalendarDays, ChartColumn, Check, Network, Trophy, Users } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { CutFrame } from "@/shared/ui/cut-frame";
import { Eyebrow } from "@/shared/ui/misc";
import { Reveal } from "@/shared/ui/reveal";
import { LiveWidget } from "@/features/landing/live-widget";
import { PlanCard } from "@/features/pricing/plan-card";

export const revalidate = 60;

const FEATURES = [
  { code: "MOD-01", icon: Users, title: "Регистрация команд", text: "Онлайн-заявки, состав, капитан и проверка игроков. Организатор одобряет команды в один клик." },
  { code: "MOD-02", icon: Network, title: "Автоматическая сетка", text: "Single и Double Elimination, групповой этап. Сетка генерируется сама и обновляется после каждого матча." },
  { code: "MOD-03", icon: CalendarDays, title: "Расписание матчей", text: "Слоты, площадки и время. Любое изменение сразу видят все капитаны и игроки." },
  { code: "MOD-04", icon: Trophy, title: "Результаты", text: "Счёт вносит организатор или капитаны — с подтверждением. Победитель сам проходит дальше по сетке." },
  { code: "MOD-05", icon: ChartColumn, title: "База участников", text: "Профили игроков и команд с историей выступлений на всех ваших турнирах." },
  { code: "MOD-06", icon: Bell, title: "Уведомления", text: "Напоминания о матчах, переносах и результатах — игрокам, капитанам и организатору." },
];

const STEPS = ["Регистрация", "Авто-сетка", "Расписание", "Результаты"];

export default async function LandingPage() {
  const [bracket, plans, user] = await Promise.all([api.bracket("bishkek-cyber-cup", { revalidate: 30 }), api.plans(), getSession()]);

  return (
    <>
      {/* ───── Hero ───── */}
      <section className="glow relative overflow-hidden border-b border-line [--glow-x:75%] [--glow-y:30%]">
        <div className="mx-auto max-w-[calc(var(--content-max)+2*var(--page-pad))] px-[var(--page-pad)] pt-8 pb-16 desk:pb-24">
          <div className="mono mb-12 hidden justify-between text-[10px] tracking-[0.16em] text-text-4 uppercase tab:flex" aria-hidden>
            <span>N 42.87° / E 74.59°</span>
            <span>SYS.STATUS: ONLINE</span>
            <span>BUILD 2026.09</span>
          </div>
          <div className="grid items-center gap-14 desk:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col gap-7">
              <Eyebrow index="01">CRM для киберспортивных турниров</Eyebrow>
              <h1 className="t-display">
                Турнир
                <br />
                под ключ.
                <br />
                <span className="text-accent">От заявки</span>
                <br />
                до финала.
              </h1>
              <p className="max-w-[560px] text-[17px] text-text-2 tab:text-[18px]">
                Регистрация команд, автоматическая сетка, расписание и результаты матчей — в одной панели. Для компьютерных клубов, студенческих лиг и игровых комьюнити.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/register?role=org" variant="primary" size="lg" iconRight={ArrowRight}>
                  Создать турнир
                </Button>
                <Button href="/tournaments/bishkek-cyber-cup" size="lg">
                  Смотреть демо
                </Button>
              </div>
              <span className="mono text-[10px] tracking-[0.16em] text-text-3 uppercase">Freemium · старт без оплаты</span>
            </div>
            <LiveWidget initial={bracket} />
          </div>
        </div>
        <ol className="mx-auto grid max-w-[calc(var(--content-max)+2*var(--page-pad))] grid-cols-2 border-t border-line tab:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 border-line px-[var(--page-pad)] py-6 not-first:border-l max-tab:nth-3:border-l-0 max-tab:nth-[n+3]:border-t tab:px-8">
              <span className="mono text-[10px] text-text-4">0{i + 1}</span>
              <span className="font-display text-[20px]">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ───── [02] Возможности ───── */}
      <section id="features" className="mx-auto max-w-[calc(var(--content-max)+2*var(--page-pad))] scroll-mt-20 px-[var(--page-pad)] py-20 desk:py-28">
        <Reveal className="mb-12 grid gap-6 desk:grid-cols-[1.4fr_1fr] desk:items-end">
          <div className="flex flex-col gap-5">
            <Eyebrow index="02">Возможности</Eyebrow>
            <h2 className="font-display text-[clamp(40px,5vw,64px)]">
              Всё для турнира —
              <br />в одной панели
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] text-text-2 desk:justify-self-end">Забудьте про таблицы, чаты и ручные сетки. CTS ведёт турнир от первой заявки до награждения.</p>
        </Reveal>
        <div className="grid gap-6 tab:grid-cols-2 desk:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.code} delay={i * 60}>
              <article className="relative flex h-full flex-col gap-4 border border-line bg-elev-1 p-7">
                <CornerMarkers only="tl" />
                <div className="flex items-start justify-between">
                  <f.icon size={22} strokeWidth={1.5} className="text-accent" aria-hidden />
                  <span className="mono text-[10px] tracking-[0.16em] text-text-4">{f.code}</span>
                </div>
                <h3 className="t-h3 mt-4">{f.title}</h3>
                <p className="text-[14px] text-text-2">{f.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───── [03] Для кого ───── */}
      <section id="audience" className="mx-auto max-w-[calc(var(--content-max)+2*var(--page-pad))] scroll-mt-20 px-[var(--page-pad)] pb-20 desk:pb-28">
        <Reveal className="mb-12 flex flex-col gap-5">
          <Eyebrow index="03">Для кого</Eyebrow>
          <h2 className="font-display text-[clamp(40px,5vw,64px)]">Две стороны одного турнира</h2>
        </Reveal>
        <div className="grid gap-6 desk:grid-cols-2">
          {[
            {
              eyebrow: "Клубы / лиги / комьюнити / ивент-агентства",
              title: "Организаторам",
              items: ["Турнир создаётся за несколько минут", "Заявки, сетка и расписание в одной панели", "Публичная страница турнира для зрителей", "История всех турниров и участников"],
              cta: { label: "Создать турнир", href: "/register?role=org", primary: true },
            },
            {
              eyebrow: "Игроки / капитаны команд",
              title: "Игрокам",
              items: ["Заявка команды на турнир в пару кликов", "Своё расписание матчей и напоминания", "Профиль с историей выступлений", "Сетка и результаты в реальном времени"],
              cta: { label: "Найти турнир", href: "/tournaments", primary: false },
            },
          ].map((c) => (
            <Reveal key={c.title}>
              <CutFrame cut={24} line="bg-line" fill="bg-elev-1">
                <div className="flex flex-col gap-6 p-8 tab:p-10">
                  <span className="mono-label">{c.eyebrow}</span>
                  <h3 className="font-display text-[40px]">{c.title}</h3>
                  <ul className="flex flex-col gap-3 text-[15px] text-text-2">
                    {c.items.map((it) => (
                      <li key={it} className="flex gap-3">
                        <Check size={16} className="mt-1 shrink-0 text-accent" aria-hidden />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Button href={c.cta.href} variant={c.cta.primary ? "primary" : "secondary"} className="mt-4 self-start">
                    {c.cta.label}
                  </Button>
                </div>
              </CutFrame>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───── [04] Тарифы ───── */}
      <section id="pricing" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-[calc(var(--content-max)+2*var(--page-pad))] px-[var(--page-pad)] py-20 desk:py-28">
          <Reveal className="mb-14 grid gap-6 desk:grid-cols-[1.4fr_1fr] desk:items-end">
            <div className="flex flex-col gap-5">
              <Eyebrow index="04">Тарифы</Eyebrow>
              <h2 className="font-display text-[clamp(40px,5vw,64px)]">Начните бесплатно</h2>
            </div>
            <p className="max-w-[360px] text-[15px] text-text-2 desk:justify-self-end">Переходите на PRO, когда турниров станет больше.</p>
          </Reveal>
          <div className="grid items-stretch gap-6 desk:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.key} plan={p} compact authed={!!user} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Финальный CTA ───── */}
      <section className="glow border-t border-line [--glow-x:50%] [--glow-y:60%]">
        <Reveal className="mx-auto flex max-w-[calc(var(--content-max)+2*var(--page-pad))] flex-col items-center gap-8 px-[var(--page-pad)] py-24 text-center desk:py-32">
          <span className="mono text-[10px] tracking-[0.16em] text-text-3 uppercase">{"// Ready_check"}</span>
          <h2 className="t-display">
            Твой турнир —
            <br />
            <span className="text-accent">следующий</span>
          </h2>
          <Button href="/register?role=org" variant="primary" size="lg">
            Создать турнир бесплатно
          </Button>
        </Reveal>
      </section>
    </>
  );
}
