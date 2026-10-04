"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, Globe, Layers, MapPin, Network, type LucideIcon } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { FORMAT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { Field, Input, RadioCard, Select, Toggle } from "@/shared/ui/form";
import { PageHeader, Placeholder, TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Stepper } from "@/shared/ui/stepper";
import { useWizard } from "./context";
import { STEPS, slugify, validateStep, type Draft, type WizardFormat } from "./model";

// группы и швейцарка — v2
const FORMATS: { key: WizardFormat; title: string; text: string; icon: LucideIcon }[] = [
  { key: "single", title: "Single Elim", text: "Проиграл — выбыл. Быстро и просто.", icon: Network },
  { key: "double", title: "Double Elim", text: "Верхняя и нижняя сетка, второй шанс.", icon: Layers },
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

  const last = step === STEPS.length;

  const valid = () => {
    const errs = validateStep(step, draft);
    setAttempted(true);
    if (!Object.keys(errs).length) return true;
    toast.error("Проверьте поля шага", Object.values(errs)[0]);
    document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    return false;
  };

  const next = async () => {
    if (!valid()) return;
    const id = await save(step, true);
    router.push(`/org/tournaments/${id}/setup/${step + 1}`);
  };

  // публикация — прямо с последнего шага: сохраняем черновик и публикуем, затем «Заявки» (экран 34)
  const publish = async () => {
    setPublishing(true);
    try {
      const id = await save(step, true);
      await api.publish(id);
      toast.success("Турнир опубликован", "Регистрация откроется по расписанию");
      router.push(`/org/tournaments/${id}/applications`);
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
        sub={`Шаг ${step} из ${STEPS.length} · ${STEPS[step - 1]}`}
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
            {last ? (
              <Button variant="primary" size="lg" icon={Check} onClick={() => valid() && setPublishAsk(true)}>
                Опубликовать турнир
              </Button>
            ) : (
              <Button variant="primary" size="lg" icon={ArrowRight} loading={saving} onClick={next}>
                Далее
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
        text="После публикации нельзя поменять игру и формат сетки. Турнир появится в каталоге CTS."
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
  const allowed = game?.formats ?? ["single", "double"];
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
                  const fmts = games.find((x) => x.slug === g.slug)?.formats.filter((f): f is WizardFormat => f === "single" || f === "double");
                  if (fmts?.length && !fmts.includes(draft.format)) set("format", fmts[0]);
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
          <Field label="Матчи" htmlFor="bo" className="tab:col-span-2">
            <Select id="bo" value={draft.matches} onChange={(e) => set("matches", e.target.value)} options={["BO1", "BO1 · финал BO3", "BO3", "BO3 · финал BO5"]} />
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
        <div className="grid gap-3 tab:grid-cols-2">
          {(
            [
              ["open", "Открытая", "Любая команда подаёт заявку, вы одобряете."],
              ["invite", "По приглашениям", "Только приглашённые команды."],
            ] as const
          ).map(([k, t, d]) => (
            <RadioCard key={k} name="regType" value={k} title={t} text={d} checked={draft.regType === k} onSelect={() => set("regType", k)} className="[&>span.font-display]:text-[18px]" />
          ))}
        </div>
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <Toggle label="Проверять заявки вручную" hint="Иначе команды попадают в список сразу" checked={draft.manualReview} onChange={(v) => set("manualReview", v)} />
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

function PreviewCard({ draft }: { draft: Draft }) {
  const day = draft.startDate ? `${draft.startDate.slice(8, 10)}.${draft.startDate.slice(5, 7)}` : "—";
  return (
    <div className="relative border border-line bg-elev-1" aria-label="Превью карточки турнира">
      <CornerMarkers offset={6} />
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="mono-label">Превью карточки</span>
        <Badge tone="muted">Черновик</Badge>
      </div>
      <Placeholder label="Арт игры" className="h-[140px] border-b border-line" />
      <div className="flex flex-col gap-3 p-5">
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
