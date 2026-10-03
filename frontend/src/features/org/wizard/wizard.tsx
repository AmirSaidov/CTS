"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Calendar, Check, Clock, FileText, Globe, Layers, Link2, MapPin, Network, Pencil, Plus, RefreshCw, Send, Trash, Tv, Upload, User, Users, type LucideIcon,
} from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import type { BracketFormat } from "@/shared/api/types";
import { FORMAT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { cn } from "@/shared/lib/cn";
import { hasPlan } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Badge, ProBadge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { ColorPicker } from "@/shared/ui/color-picker";
import { Field, Input, RadioCard, Select, Textarea, Toggle } from "@/shared/ui/form";
import { FileDrop, IMAGE_TYPES } from "@/shared/ui/file-drop";
import { PageHeader, Placeholder, TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { ProGate } from "@/shared/ui/feedback";
import { Stepper } from "@/shared/ui/stepper";
import { useWizard } from "./context";
import { STEPS, slugify, validateStep, type Draft } from "./model";

const FORMATS: { key: BracketFormat; title: string; text: string; icon: LucideIcon }[] = [
  { key: "single", title: "Single Elim", text: "Проиграл — выбыл. Быстро и просто.", icon: Network },
  { key: "double", title: "Double Elim", text: "Верхняя и нижняя сетка, второй шанс.", icon: Layers },
  { key: "groups", title: "Группы + плей-офф", text: "Круговой этап, затем плей-офф.", icon: Users },
  { key: "swiss", title: "Швейцарка", text: "Пары по очкам, без повторов.", icon: RefreshCw },
];

export function WizardScreen({ step }: { step: number }) {
  const router = useRouter();
  const { draft, save, saving, dirty, savedAt } = useWizard();
  // после первой попытки «Далее» ошибки пересчитываются на лету — исправленное поле сразу гаснет
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateStep(step, draft) : {};
  const [publishAsk, setPublishAsk] = useState(false);
  const [publishing, setPublishing] = useState(false);
  useUnsavedGuard(dirty);

  const base = draft.id ? `/org/tournaments/${draft.id}/setup` : null;
  const done = Array.from({ length: step - 1 }, (_, i) => i + 1);

  const next = async () => {
    const errs = validateStep(step, draft);
    setAttempted(true);
    if (Object.keys(errs).length) {
      toast.error("Проверьте поля шага", Object.values(errs)[0]);
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    const id = await save(step, true);
    router.push(`/org/tournaments/${id}/setup/${step + 1}`);
  };

  const publish = async () => {
    if (!draft.id) return;
    setPublishing(true);
    try {
      await api.publish(draft.id, { visibility: draft.visibility, notify: draft.notify });
      toast.success("Турнир опубликован", "Регистрация откроется по расписанию");
      router.push(`/org/tournaments/${draft.id}/applications`);
    } catch {
      toast.error("Не удалось опубликовать");
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Организатор // Новый турнир"
        title="Создание турнира"
        sub={`Шаг ${step} из 5 · ${STEPS[step - 1]}`}
        actions={
          <div className="flex items-center gap-4">
            {savedAt && <span className="mono-label hidden tab:inline">Сохранено {savedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>}
            <Button loading={saving} onClick={() => save(step).then((id) => !draft.id && router.replace(`/org/tournaments/${id}/setup/${step}`))}>
              Сохранить черновик
            </Button>
          </div>
        }
      />
      <div className="grid gap-6 desk:grid-cols-[260px_minmax(0,520px)_300px]">
        <nav aria-label="Шаги мастера" className="desk:sticky desk:top-24 desk:self-start">
          <Stepper steps={[...STEPS]} current={step} done={done} hrefFor={(n) => (base && n < step ? `${base}/${n}` : null)} />
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          {step === 1 && <Step1 errors={errors} />}
          {step === 2 && <Step2 errors={errors} />}
          {step === 3 && <Step3 errors={errors} />}
          {step === 4 && <Step4 errors={errors} />}
          {step === 5 && <Step5 />}
          <div className="flex items-center justify-between border-t border-line pt-6">
            {step === 1 ? (
              <Button size="lg" href="/org">
                Отмена
              </Button>
            ) : (
              <Button size="lg" icon={ArrowLeft} href={`${base}/${step - 1}`}>
                Назад
              </Button>
            )}
            {step < 5 ? (
              <Button variant="primary" size="lg" icon={ArrowRight} loading={saving} onClick={next}>
                Далее
              </Button>
            ) : (
              <Button variant="primary" size="lg" icon={Check} onClick={() => setPublishAsk(true)}>
                Опубликовать турнир
              </Button>
            )}
          </div>
        </div>
        <aside className="hidden desk:sticky desk:top-24 desk:block desk:self-start">
          <PreviewCard draft={draft} />
        </aside>
      </div>
      <ConfirmModal
        open={publishAsk}
        onClose={() => setPublishAsk(false)}
        onConfirm={publish}
        loading={publishing}
        title="Опубликовать турнир?"
        confirmLabel="Опубликовать"
        text={
          <>
            После публикации нельзя поменять игру и формат сетки. Турнир будет {draft.visibility === "public" ? "виден в каталоге CTS" : "доступен только по ссылке"}
            {draft.notify ? ", подписчики получат уведомление." : "."}
          </>
        }
      />
    </div>
  );
}

function Panel({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border border-line bg-elev-1 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="t-h3">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/* ───────── Шаг 1: Игра и формат ───────── */
function Step1({ errors }: { errors: Record<string, string> }) {
  const { draft, set } = useWizard();
  // список игр и доступные форматы — с API (экран 52), не хардкод
  const { data: games = [] } = useQuery({ queryKey: qk.games, queryFn: () => api.games() });
  const game = games.find((g) => g.slug === draft.game);
  const allowed = game?.formats ?? ["single", "double", "groups", "swiss"];
  return (
    <>
      <Panel title="Игра">
        <div className="grid grid-cols-2 gap-3 tab:grid-cols-3" role="radiogroup" aria-label="Игра">
          {[...games.filter((g) => g.slug !== "eafc"), { slug: "other" as const, name: "Другая", short: "ДР" }].map((g) => {
            const on = draft.game === g.slug;
            return (
              <button
                key={g.slug}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  set("game", g.slug as Draft["game"]);
                  const fmts = games.find((x) => x.slug === g.slug)?.formats;
                  if (fmts && !fmts.includes(draft.format)) set("format", fmts[0]);
                }}
                className={cn("relative flex items-center gap-3 border px-4 py-4 text-left transition-colors", on ? "border-accent bg-elev-2" : "border-line hover:border-line-strong")}
              >
                {on && <CornerMarkers only="tl-br" />}
                <TeamLogo tag={g.short === "VL" ? "VA" : g.short} size={32} />
                <span className="text-[16px] leading-tight font-semibold">{g.name === "Counter-Strike 2" ? "CS2" : g.name}</span>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title="Формат сетки">
        <div className="grid gap-3 tab:grid-cols-2">
          {FORMATS.map((f) => (
            <RadioCard
              key={f.key}
              name="format"
              value={f.key}
              icon={f.icon}
              title={f.title}
              text={allowed.includes(f.key) ? f.text : `Недоступно для ${game?.name ?? "этой игры"}`}
              checked={draft.format === f.key}
              disabled={!allowed.includes(f.key)}
              onSelect={() => set("format", f.key)}
            />
          ))}
        </div>
      </Panel>
      <Panel title="Параметры">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Размер команды" htmlFor="ts">
            <Select id="ts" value={draft.teamSize} onChange={(e) => set("teamSize", e.target.value)} options={["5×5", "4×4", "2×2", "1×1"]} />
          </Field>
          <Field label="Макс. команд" htmlFor="mt">
            <Select id="mt" value={draft.maxTeams} onChange={(e) => set("maxTeams", e.target.value)} options={["8", "16", "32", "64"]} />
          </Field>
          <Field label="Матчи" htmlFor="bo">
            <Select id="bo" value={draft.matches} onChange={(e) => set("matches", e.target.value)} options={["BO1", "BO1 · финал BO3", "BO3", "BO3 · финал BO5"]} />
          </Field>
          <Field label="Матч за 3 место" htmlFor="third">
            <Select id="third" value={draft.thirdPlace} onChange={(e) => set("thirdPlace", e.target.value as Draft["thirdPlace"])} options={[{ value: "no", label: "Нет" }, { value: "yes", label: "Да" }]} />
          </Field>
        </div>
      </Panel>
      <section className="border border-line bg-elev-1 p-6">
        <Field label="Название турнира" htmlFor="name" error={errors.name} hint={draft.name ? `Будет в URL: cts.gg/${slugify(draft.name)}` : "Например, Osh Open"}>
          <Input id="name" value={draft.name} invalid={!!errors.name} onChange={(e) => set("name", e.target.value)} maxLength={60} />
        </Field>
      </section>
    </>
  );
}

/* ───────── Шаг 2: Даты и регистрация ───────── */
function Step2({ errors }: { errors: Record<string, string> }) {
  const { draft, set } = useWizard();
  return (
    <>
      <Panel title="Даты">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Старт турнира" htmlFor="sd" error={errors.startDate}>
            <Input id="sd" type="date" icon={Calendar} value={draft.startDate} invalid={!!errors.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Время" htmlFor="st">
            <Input id="st" type="time" icon={Clock} value={draft.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="Финал" htmlFor="fd" error={errors.finalDate}>
            <Input id="fd" type="date" icon={Calendar} value={draft.finalDate} invalid={!!errors.finalDate} onChange={(e) => set("finalDate", e.target.value)} />
          </Field>
          <Field label="Часовой пояс" htmlFor="tz">
            <Select id="tz" value={draft.timezone} onChange={(e) => set("timezone", e.target.value)} options={[{ value: "Asia/Bishkek", label: "UTC+6 · Бишкек" }, { value: "Asia/Almaty", label: "UTC+5 · Алматы" }, { value: "Asia/Tashkent", label: "UTC+5 · Ташкент" }, { value: "Europe/Moscow", label: "UTC+3 · Москва" }]} />
          </Field>
        </div>
      </Panel>
      <Panel title="Регистрация">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Открытие" htmlFor="ro" error={errors.regOpen}>
            <Input id="ro" type="datetime-local" value={draft.regOpen} invalid={!!errors.regOpen} onChange={(e) => set("regOpen", e.target.value)} />
          </Field>
          <Field label="Закрытие" htmlFor="rc" error={errors.regClose}>
            <Input id="rc" type="datetime-local" value={draft.regClose} invalid={!!errors.regClose} onChange={(e) => set("regClose", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-3 tab:grid-cols-3">
          {(
            [
              ["open", "Открытая", "Любая команда подаёт заявку, вы одобряете."],
              ["invite", "По приглашениям", "Только приглашённые команды."],
              ["qualify", "С отбором", "Квалификация перед основным этапом."],
            ] as const
          ).map(([k, t, d]) => (
            <RadioCard key={k} name="regType" value={k} title={t} text={d} checked={draft.regType === k} onSelect={() => set("regType", k)} className="[&>span.font-display]:text-[18px]" />
          ))}
        </div>
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <Toggle label="Проверять заявки вручную" hint="Иначе команды попадают в список сразу" checked={draft.manualReview} onChange={(v) => set("manualReview", v)} />
          <Toggle label="Требовать привязанный игровой аккаунт" checked={draft.requireAccount} onChange={(v) => set("requireAccount", v)} />
          <Toggle label="Лист ожидания" hint="При заполнении слотов" checked={draft.waitlist} onChange={(v) => set("waitlist", v)} />
        </div>
      </Panel>
      <Panel title="Площадка">
        <div className="grid gap-3 tab:grid-cols-3">
          {(
            [
              ["online", "Онлайн", "Игроки играют из дома.", Globe],
              ["lan", "LAN", "Клуб или площадка.", MapPin],
              ["mixed", "Смешанный", "Онлайн отбор, LAN финал.", Layers],
            ] as const
          ).map(([k, t, d, icon]) => (
            <RadioCard key={k} name="venue" value={k} title={t} text={d} icon={icon} checked={draft.venue === k} onSelect={() => set("venue", k)} />
          ))}
        </div>
        {draft.venue !== "online" && (
          <Field label="Адрес площадки" htmlFor="addr" error={errors.address}>
            <Input id="addr" icon={MapPin} value={draft.address} invalid={!!errors.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        )}
        <div className="border-t border-line pt-5">
          <Toggle label="Чек-ин перед матчем" hint="Открывается за 60 минут, закрывается за 10" checked={draft.checkin} onChange={(v) => set("checkin", v)} />
        </div>
      </Panel>
    </>
  );
}

/* ───────── Шаг 3: Правила и призы ───────── */
function Step3({ errors }: { errors: Record<string, string> }) {
  const { draft, set } = useWizard();
  const user = useUser();
  const pro = hasPlan(user, "pro");
  const [editing, setEditing] = useState<number | null>(null);
  const placeColor = (i: number) => (i === 0 ? "text-gold" : i === 2 ? "text-bronze" : "text-text-2");

  return (
    <>
      <Panel
        title="Регламент"
        aside={
          <Button
            size="sm"
            icon={FileText}
            onClick={() =>
              set("rules", [
                { title: "1. Общие положения", body: `Турнир проводится по правилам ${draft.game === "valorant" ? "Riot Games" : "издателя игры"}. Опоздание более 10 минут — техническое поражение.` },
                { title: "2. Споры", body: "Споры решает главный судья на основании скриншотов и демо." },
              ])
            }
          >
            Шаблон {GAME_NAMES[draft.game as keyof typeof GAME_NAMES] ?? ""}
          </Button>
        }
      >
        <div className="border border-line bg-sunken">
          {draft.rules.length === 0 && <p className="p-5 text-[14px] text-text-3">Загрузите шаблон игры или добавьте раздел.</p>}
          {draft.rules.map((r, i) => (
            <div key={i} className="group flex flex-col gap-2 border-b border-line p-5 last:border-b-0">
              {editing === i ? (
                <>
                  <Input aria-label="Заголовок раздела" value={r.title} onChange={(e) => set("rules", draft.rules.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Textarea aria-label="Текст раздела" value={r.body} onChange={(e) => set("rules", draft.rules.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
                  <Button size="sm" className="self-start" icon={Check} onClick={() => setEditing(null)}>
                    Готово
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[22px]">{r.title}</h3>
                    <span className="flex gap-1">
                      <button type="button" className="text-text-3 hover:text-text" aria-label={`Редактировать «${r.title}»`} onClick={() => setEditing(i)}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="text-text-3 hover:text-text" aria-label={`Удалить «${r.title}»`} onClick={() => set("rules", draft.rules.filter((_, j) => j !== i))}>
                        <Trash size={15} />
                      </button>
                    </span>
                  </div>
                  <p className="text-[14px] text-text-2">{r.body}</p>
                </>
              )}
            </div>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={Plus}
          className="self-start"
          onClick={() => {
            set("rules", [...draft.rules, { title: `${draft.rules.length + 1}. Новый раздел`, body: "" }]);
            setEditing(draft.rules.length);
          }}
        >
          Добавить раздел
        </Button>
        <Toggle label="Показывать ключевые правила при подаче заявки" hint="Капитан обязан подтвердить их чекбоксом" checked={draft.showKeyRules} onChange={(v) => set("showKeyRules", v)} />
      </Panel>
      <Panel
        title="Призовой фонд"
        aside={
          <div className="w-[130px]">
            <Select aria-label="Валюта" value={draft.currency} onChange={(e) => set("currency", e.target.value)} options={[{ value: "KGS", label: "KGS · сом" }, { value: "USD", label: "USD" }, { value: "KZT", label: "KZT" }]} />
          </div>
        }
      >
        {draft.prizes.map((p, i) => (
          <div key={i} className="grid grid-cols-[96px_1fr_44px] items-center gap-3">
            <span className={cn("font-display text-[22px]", placeColor(i))}>{i + 1} место</span>
            <Input aria-label={`Приз за ${i + 1} место`} value={p} placeholder="[СУММА]" onChange={(e) => set("prizes", draft.prizes.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="flex size-11 items-center justify-center border border-line text-text-3 hover:text-text" aria-label={`Удалить ${i + 1} место`} onClick={() => set("prizes", draft.prizes.filter((_, j) => j !== i))}>
              <Trash size={15} />
            </button>
          </div>
        ))}
        <Button size="sm" variant="ghost" icon={Plus} className="self-start" onClick={() => set("prizes", [...draft.prizes, ""])}>
          Добавить место
        </Button>
        <div className="border-t border-line pt-5">
          <ProGate locked={!pro} label="Взносы — в Pro">
            <Toggle label="Взнос за участие" hint="Оплата через [ПЛАТЁЖНЫЙ СЕРВИС] · доступно в Pro" checked={draft.feeEnabled} onChange={(v) => set("feeEnabled", v)} />
            {draft.feeEnabled && (
              <div className="mt-4">
                <Input aria-label="Сумма взноса" placeholder="[СУММА]" value={draft.fee} onChange={(e) => set("fee", e.target.value)} />
              </div>
            )}
          </ProGate>
        </div>
      </Panel>
      <Panel title="Судьи и контакты">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Главный судья" htmlFor="judge">
            <Input id="judge" icon={User} placeholder="Ник организатора" value={draft.judge} onChange={(e) => set("judge", e.target.value)} />
          </Field>
          <Field label="Контакт для капитанов" htmlFor="contact" error={errors.contact}>
            <Input id="contact" icon={Send} value={draft.contact} invalid={!!errors.contact} onChange={(e) => set("contact", e.target.value)} />
          </Field>
        </div>
      </Panel>
    </>
  );
}

/* ───────── Шаг 4: Оформление ───────── */
function Step4({ errors }: { errors: Record<string, string> }) {
  const { draft, set, banner, setBanner, logo, setLogo } = useWizard();
  const user = useUser();
  const pro = hasPlan(user, "pro");
  return (
    <>
      <Panel title="Баннер">
        <FileDrop label="Перетащите изображение или выберите файл" hint="1920×1080 · до 5 МБ · JPG / PNG / WEBP" accept={IMAGE_TYPES} maxMb={5} value={banner} onChange={setBanner} aspect="16 / 9" />
      </Panel>
      <Panel title="Логотип и описание">
        <div className="flex flex-wrap items-center gap-5">
          <TeamLogo tag={logo ? "✓" : "00"} size={96} />
          <div className="flex flex-col gap-2">
            <label className="btn-text inline-flex h-10 w-fit cursor-pointer items-center gap-2 border border-line-strong px-4 text-[13px] hover:border-accent">
              <Upload size={14} aria-hidden /> Загрузить логотип
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
            </label>
            <span className="text-[13px] text-text-2">{logo ? logo.name : "Квадрат, минимум 400×400"}</span>
          </div>
        </div>
        <Field label="Короткое описание" htmlFor="desc" error={errors.description} hint={`${draft.description.length} / 280`}>
          <Textarea id="desc" rows={3} value={draft.description} invalid={!!errors.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </Panel>
      <Panel title="Акцентный цвет" aside={<ProBadge />}>
        <p className="text-[14px] text-text-2">Цвет кнопок и выделений на странице турнира. На Free используется фирменный цвет CTS.</p>
        <ProGate locked={!pro}>
          <ColorPicker value={draft.accent} onChange={(v) => set("accent", v)} disabled={!pro} />
        </ProGate>
      </Panel>
      <Panel title="Трансляция и соцсети">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Twitch / YouTube" htmlFor="stream">
            <Input id="stream" icon={Tv} placeholder="Ссылка на канал" value={draft.stream} onChange={(e) => set("stream", e.target.value)} />
          </Field>
          <Field label="Telegram-канал" htmlFor="tgc">
            <Input id="tgc" icon={Send} placeholder="t.me/…" value={draft.telegram} onChange={(e) => set("telegram", e.target.value)} />
          </Field>
        </div>
      </Panel>
    </>
  );
}

/* ───────── Шаг 5: Проверка и публикация ───────── */
function Step5() {
  const { draft, set } = useWizard();
  const base = `/org/tournaments/${draft.id}/setup`;
  const block = (title: string, step: number, rows: [string, string][]) => (
    <section className="border border-line bg-elev-1">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="t-h3">{title}</h2>
        <Button size="sm" variant="ghost" icon={Pencil} href={`${base}/${step}`}>
          Изменить
        </Button>
      </header>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line px-5 py-3.5 text-[14px] last:border-b-0">
          <span className="text-text-2">{k}</span>
          <span className="min-w-0 text-right font-semibold [overflow-wrap:anywhere]">{v || "—"}</span>
        </div>
      ))}
    </section>
  );
  const d = (iso: string) => (iso ? iso.slice(8, 10) + "." + iso.slice(5, 7) : "");
  return (
    <>
      <div role="status" className="flex gap-4 border border-success bg-elev-1 p-5">
        <Check size={20} className="mt-0.5 text-success-text" aria-hidden />
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Всё готово к публикации</span>
          <span className="text-[13px] text-text-2">После публикации нельзя поменять игру и формат сетки.</span>
        </div>
      </div>
      {block("Игра и формат", 1, [
        ["Игра", GAME_NAMES[draft.game as keyof typeof GAME_NAMES] ?? "Другая"],
        ["Формат", `${FORMAT_LABELS[draft.format]} · ${draft.matches}`],
        ["Команды", `до ${draft.maxTeams} · ${draft.teamSize.replace("×", "x")}`],
      ])}
      {block("Даты и регистрация", 2, [
        ["Турнир", `${d(draft.startDate)} — ${d(draft.finalDate)}.${draft.finalDate.slice(0, 4)} · UTC+6`],
        ["Регистрация", `${d(draft.regOpen)} — ${d(draft.regClose)}`],
        ["Тип", `${{ open: "Открытая", invite: "По приглашениям", qualify: "С отбором" }[draft.regType]}${draft.manualReview ? " · ручная проверка" : ""}`],
        ["Площадка", draft.venue === "online" ? "Онлайн" : `${draft.venue === "lan" ? "LAN" : "Смешанный"} · ${draft.address}`],
      ])}
      {block("Правила и призы", 3, [
        ["Регламент", `${draft.rules.length} раздела`],
        ["Призы", `${draft.prizes.filter(Boolean).length} места · ${draft.prizes[0] || "—"}`],
        ["Взнос", draft.feeEnabled ? draft.fee : "Нет"],
      ])}
      <Panel title="Видимость">
        <div className="grid gap-3 tab:grid-cols-2">
          <RadioCard name="vis" value="public" icon={Globe} title="Публичный" text="В каталоге CTS и по ссылке." checked={draft.visibility === "public"} onSelect={() => set("visibility", "public")} />
          <RadioCard name="vis" value="link" icon={Link2} title="По ссылке" text="Не показывается в каталоге." checked={draft.visibility === "link"} onSelect={() => set("visibility", "link")} />
        </div>
        <Toggle label="Уведомить подписчиков организатора" checked={draft.notify} onChange={(v) => set("notify", v)} />
      </Panel>
    </>
  );
}

function PreviewCard({ draft }: { draft: Draft }) {
  const day = draft.startDate ? `${draft.startDate.slice(8, 10)}.${draft.startDate.slice(5, 7)}` : "—";
  return (
    <div className="relative border border-line bg-elev-1" aria-label="Превью карточки турнира">
      <CornerMarkers offset={6} />
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="mono-label">Превью карточки</span>
        <Badge tone="muted">Черновик</Badge>
      </div>
      <Placeholder label="Баннер турнира" className="h-[140px] border-b border-line" />
      <div className="flex flex-col gap-3 p-5" style={{ ["--accent" as string]: draft.accent }}>
        <div className="flex gap-2">
          <Badge>Регистрация</Badge>
          <Badge tone="muted">{GAME_NAMES[draft.game as keyof typeof GAME_NAMES] ?? "Игра"}</Badge>
        </div>
        <span className="font-display text-[30px] leading-none break-words">{draft.name || "Название"}</span>
        <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">
          {FORMAT_LABELS[draft.format]} · {draft.maxTeams} команд · {day}
        </span>
      </div>
    </div>
  );
}
