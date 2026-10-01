import type { Metadata } from "next";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { Container } from "@/shared/ui/page";
import { Eyebrow } from "@/shared/ui/misc";
import { Accordion } from "@/shared/ui/accordion";
import { ContactForm } from "@/features/about/contact-form";

export const metadata: Metadata = { title: "О платформе", description: "CTS — CRM для киберспортивных турниров. Как это работает, FAQ и контакты.", alternates: { canonical: "/about" } };

const STEPS = [
  ["Создайте турнир", "Выберите игру, формат и даты — мастер проведёт по шагам."],
  ["Откройте регистрацию", "Поделитесь ссылкой: капитаны подают заявки командами."],
  ["Запустите сетку", "Одобрите заявки, проведите чек-ин — сетка построится сама."],
  ["Ведите матчи", "Капитаны вносят счёт, вы подтверждаете и решаете споры."],
];

const FAQ = [
  { q: "Какие игры поддерживаются?", a: "Любые командные и 1v1 дисциплины: Valorant, CS2, Dota 2, Mobile Legends и другие. Список расширяется." },
  { q: "Нужно ли игрокам регистрироваться?", a: "Да, капитан и игроки регистрируются в CTS — так организатор видит составы, а игроки получают напоминания и историю выступлений." },
  { q: "Можно ли провести LAN-турнир?", a: "Да. В мастере выберите площадку LAN или смешанный формат, добавьте залы — расписание учтёт площадки." },
  { q: "Есть ли мобильная версия?", a: "Сайт адаптирован под телефон: каталог, страница матча, чек-ин и ввод счёта удобно работают с мобильного." },
  { q: "Как перенести турнир из таблицы?", a: "Импортируйте участников из CSV в «Базе участников» — колонки сопоставляются вручную." },
];

export default function AboutPage() {
  return (
    <>
      <section className="glow [--glow-x:75%] [--glow-y:0%]">
        <Container className="grid gap-10 pt-16 pb-20 desk:grid-cols-[1fr_480px] desk:items-end">
          <div className="flex flex-col gap-6">
            <Eyebrow>[ О платформе ]</Eyebrow>
            <h1 className="t-display">
              Турниры
              <br />
              без хаоса
            </h1>
          </div>
          <p className="text-[18px] text-text-2">CTS — CRM для киберспортивных турниров. Мы делаем инструмент, в котором клуб, лига или комьюнити проводит турнир от первой заявки до награждения — без таблиц, чатов и ручных сеток.</p>
        </Container>
      </section>
      <Container className="flex flex-col gap-24 pb-24">
        <section className="flex flex-col gap-8" aria-labelledby="how">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="how" className="font-display text-[clamp(40px,5vw,64px)]">
              Как это работает
            </h2>
            <Button variant="primary" href="/register?role=org">
              Создать турнир
            </Button>
          </div>
          <ol className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="relative flex flex-col gap-4 border border-line bg-elev-1 p-7">
                <CornerMarkers only="tl" />
                <span className="mono-label text-text-2!">Step 0{i + 1}</span>
                <h3 className="t-h2">{title}</h3>
                <p className="text-[14px] text-text-2">{text}</p>
              </li>
            ))}
          </ol>
        </section>
        <div className="grid gap-16 desk:grid-cols-2">
          <section id="faq" className="flex scroll-mt-24 flex-col gap-4" aria-labelledby="faq-h">
            <h2 id="faq-h" className="font-display text-[clamp(40px,5vw,64px)]">
              FAQ
            </h2>
            <Accordion items={FAQ} openFirst />
          </section>
          <section id="contact" className="flex scroll-mt-24 flex-col gap-6" aria-labelledby="contact-h">
            <h2 id="contact-h" className="font-display text-[clamp(40px,5vw,64px)]">
              Контакты
            </h2>
            <ContactForm />
            <dl className="flex flex-wrap gap-12">
              {[
                ["Почта", "[EMAIL]"],
                ["Telegram", "[@CTS]"],
                ["Город", "Бишкек"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="mono-label">{k}</dt>
                  <dd className="text-[17px] font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </Container>
    </>
  );
}
