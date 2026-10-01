"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Flag, Paperclip, Send, Swords } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { useChannel } from "@/shared/realtime/provider";
import { cn } from "@/shared/lib/cn";
import { isCaptain } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Field, Select, Textarea } from "@/shared/ui/form";
import { FileDrop, IMAGE_TYPES } from "@/shared/ui/file-drop";
import { Countdown } from "@/shared/ui/feedback";
import { PageHeader, TeamLogo } from "@/shared/ui/misc";
import { Segmented } from "@/shared/ui/tabs";
import { ConfirmModal } from "@/shared/ui/overlay";
import { EmptyStateView } from "@/shared/ui/empty-state";

type Data = MyMatches;
export interface MyMatches {
  checkin: { match: string; tournament: string; bo: number; at: string; us: { tag: string; name: string }; them: { tag: string; name: string }; usReady: number; usTotal: number; themReady: number; themTotal: number; closesAt: string; checkedIn: boolean };
  report: { code: string; bo: number; us: string; them: string; maps: { name: string; a: number; b: number }[] };
  upcoming: { date: string; gold?: boolean; title: string; meta: string; href: string | null; status: string | null }[];
  incoming: { code: string; from: string; score: string; expiresAt: string };
  dispute: { status: string; code: string; tournament: string; date: string; judge: string; text: string };
}

const MAP_POOL = ["Ascent", "Bind", "Lotus", "Haven", "Split", "Sunset", "Icebox"];

export function MatchesScreen({ data }: { data: Data }) {
  const user = useUser();
  const captain = isCaptain(user);
  const params = useSearchParams();
  const [tab, setTab] = useState<"upcoming" | "played" | "disputes">(params.get("tab") === "disputes" ? "disputes" : "upcoming");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Кабинет игрока // Матчи"
        title="Мои матчи"
        sub="Чек-ин, ввод результата и споры"
        actions={
          <Segmented
            label="Раздел"
            active={tab}
            onChange={setTab}
            items={[
              { key: "upcoming", label: "Предстоящие" },
              { key: "played", label: "Сыгранные" },
              { key: "disputes", label: "Споры · 1" },
            ]}
          />
        }
      />
      {tab === "played" ? (
        <EmptyStateView code="EMPTY.MATCHES" icon={Swords} title="Нет матчей" text="Сыгранные матчи с итогами и статистикой появятся здесь." cta={{ href: "/tournaments", label: "Найти турнир" }} />
      ) : (
        <div className="grid gap-6 desk:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
            {tab === "upcoming" && <CheckinCard c={data.checkin} />}
            {tab === "upcoming" && (
              <Card>
                <CardHeader title="Предстоящие" />
                {data.upcoming.map((u) => (
                  <div key={u.title + u.date} className="flex items-center gap-5 border-b border-line px-6 py-4 last:border-b-0">
                    <span className={cn("mono w-12 text-[12px]", u.gold ? "text-gold" : "text-text-2")}>{u.date}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{u.title}</span>
                      <span className="mono truncate text-[10px] tracking-[0.14em] text-text-3 uppercase">{u.meta}</span>
                    </span>
                    {u.href ? (
                      <Button size="sm" href={u.href}>
                        Матч
                      </Button>
                    ) : (
                      <Badge tone="muted">{u.status}</Badge>
                    )}
                  </div>
                ))}
              </Card>
            )}
            {tab === "disputes" && <DisputeCard d={data.dispute} />}
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            {tab === "upcoming" && (captain ? <ReportCard r={data.report} /> : <p className="border border-line bg-elev-1 p-6 text-[14px] text-text-2">Результат матча вносит капитан команды.</p>)}
            {tab === "upcoming" && captain && <IncomingResult r={data.incoming} />}
            {tab === "upcoming" && <DisputeCard d={data.dispute} />}
          </div>
        </div>
      )}
    </div>
  );
}

/** Чек-ин: обратный отсчёт, «5 / 5 готовы», статус соперника обновляется вживую (канал user) */
function CheckinCard({ c }: { c: MyMatches["checkin"] }) {
  const [done, setDone] = useState(c.checkedIn);
  const [busy, setBusy] = useState(false);
  const [them, setThem] = useState(c.themReady);
  useChannel<{ ready: number }>("user", ({ event, data }) => {
    if (event === "checkin.opponent") setThem(data.ready);
  });
  const themReady = them >= c.themTotal;

  return (
    <Card>
      <CardHeader title="Сегодня · чек-ин открыт" />
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="accent" dot>
            Чек-ин · <Countdown to={c.closesAt} />
          </Badge>
          <span className="mono text-[11px] tracking-[0.14em] text-text-2 uppercase">
            {c.tournament} · {c.match} · BO{c.bo} · {c.at}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span className="flex items-center gap-3">
            <TeamLogo tag={c.us.tag} size={44} />
            <span className="font-display text-[clamp(26px,3vw,40px)]">{c.us.name}</span>
          </span>
          <span className="font-display text-[26px] text-text-3">VS</span>
          <span className="flex items-center justify-end gap-3">
            <span className="font-display text-[clamp(26px,3vw,40px)]">{c.them.name}</span>
            <TeamLogo tag={c.them.tag} size={44} />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3" aria-live="polite">
          <div className={cn("flex items-center justify-between border px-4 py-3", done ? "border-success" : "border-line")}>
            <span>{c.us.name}</span>
            <Badge tone={done ? "success" : "muted"}>{done ? `${c.usTotal} / ${c.usTotal} готовы` : "Ожидаем"}</Badge>
          </div>
          <div className={cn("flex items-center justify-between border px-4 py-3", themReady ? "border-success" : "border-line")}>
            <span>{c.them.name}</span>
            <Badge tone={themReady ? "success" : "muted"}>{themReady ? `${c.themTotal} / ${c.themTotal} готовы` : them > 0 ? `${them} / ${c.themTotal}` : "Ожидаем"}</Badge>
          </div>
        </div>
        <div className="grid gap-3 tab:grid-cols-[1fr_auto]">
          <Button
            variant="primary"
            size="lg"
            icon={Check}
            disabled={done}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await api.checkIn(c.match);
              setDone(true);
              setBusy(false);
              toast.success("Вы отметились", "Ждём соперника — лобби откроется перед стартом");
            }}
          >
            {done ? "Вы на месте" : "Я на месте · чек-ин"}
          </Button>
          <Button size="lg" onClick={() => toast.info("Лобби", "Код лобби пришлёт судья в Telegram за 10 минут до старта")}>
            Лобби
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Ввод результата: счёт по картам, скриншот обязателен, автоподсчёт «Итог: 2 : 1» */
function ReportCard({ r }: { r: MyMatches["report"] }) {
  const [maps, setMaps] = useState(r.maps.map((m) => ({ name: m.name, a: String(m.a), b: String(m.b) })));
  const [shot, setShot] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const played = maps.filter((m) => m.a !== "" && m.b !== "");
  const wa = played.filter((m) => Number(m.a) > Number(m.b)).length;
  const wb = played.filter((m) => Number(m.b) > Number(m.a)).length;
  const need = Math.ceil(r.bo / 2);
  const valid = (wa === need || wb === need) && !!shot && played.every((m) => Number(m.a) !== Number(m.b));

  const set = (i: number, k: "name" | "a" | "b", v: string) => setMaps((ms) => ms.map((m, j) => (j === i ? { ...m, [k]: k === "name" ? v : v.replace(/\D/g, "").slice(0, 2) } : m)));

  return (
    <section className="relative border border-accent bg-elev-1" aria-labelledby="report-h">
      <CornerMarkers offset={6} />
      <CardHeader id="report-h" title="Внести результат">
        <span className="mono-label">
          {r.code} · BO{r.bo}
        </span>
      </CardHeader>
      <div className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_52px_8px_52px] items-center gap-2 tab:grid-cols-[70px_1fr_80px_12px_80px] tab:gap-3">
          <span className="max-tab:hidden" />
          <span className="mono-label">Карта</span>
          <span className="mono-label truncate text-center">{r.us}</span>
          <span />
          <span className="mono-label truncate text-center">{r.them}</span>
          {maps.map((m, i) => (
            <div key={i} className="contents">
              <span className="mono-label max-tab:hidden">Карта {i + 1}</span>
              <Select aria-label={`Карта ${i + 1}`} value={m.name} onChange={(e) => set(i, "name", e.target.value)} options={MAP_POOL} />
              <input aria-label={`${r.us}, карта ${i + 1}`} inputMode="numeric" value={m.a} onChange={(e) => set(i, "a", e.target.value)} className="font-display h-12 border border-line bg-sunken text-center text-[26px] outline-none focus:border-accent" />
              <span className="text-center text-text-4">:</span>
              <input aria-label={`${r.them}, карта ${i + 1}`} inputMode="numeric" value={m.b} onChange={(e) => set(i, "b", e.target.value)} className="font-display h-12 border border-line bg-sunken text-center text-[26px] outline-none focus:border-accent" />
            </div>
          ))}
        </div>
        <FileDrop compact label="Скриншот итогов" hint="Обязателен для подтверждения · PNG / JPG" accept={IMAGE_TYPES} maxMb={10} value={shot} onChange={setShot} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-display text-[34px] text-accent" aria-live="polite">
            Итог: {wa} : {wb}
          </span>
          <Button
            variant="primary"
            icon={Send}
            disabled={!valid || sent}
            loading={busy}
            onClick={async () => {
              const form = new FormData();
              form.append("maps", JSON.stringify(maps));
              if (shot) form.append("screenshot", shot);
              setBusy(true);
              await api.reportResult(r.code, form);
              setBusy(false);
              setSent(true);
              toast.success("Результат отправлен", "Соперник подтвердит или откроет спор в течение 15 минут");
            }}
          >
            {sent ? "Ждём подтверждения" : "Отправить на подтверждение"}
          </Button>
        </div>
        <p className="text-[13px] text-text-3">Соперник подтвердит результат или откроет спор в течение 15 минут. Без ответа результат засчитается автоматически.</p>
      </div>
    </section>
  );
}

/** Капитан соперника видит входящий результат: «Подтвердить» / «Открыть спор» */
function IncomingResult({ r }: { r: MyMatches["incoming"] }) {
  const [state, setState] = useState<"new" | "confirmed" | "dispute">("new");
  const [ask, setAsk] = useState(false);
  if (state !== "new") return null;
  return (
    <Card tone="gold" className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <span className="mono-label text-gold!">Входящий результат · {r.code}</span>
        <span className="mono text-[11px] text-text-2">
          Осталось <Countdown to={r.expiresAt} />
        </span>
      </div>
      <p className="text-[15px]">
        {r.from} указали счёт <b className="font-display text-[22px]">{r.score}</b>. Проверьте и подтвердите.
      </p>
      <div className="flex gap-3">
        <Button
          variant="primary"
          icon={Check}
          onClick={async () => {
            await api.confirmResult(r.code, true);
            setState("confirmed");
            toast.success("Результат подтверждён");
          }}
        >
          Подтвердить
        </Button>
        <Button icon={Flag} onClick={() => setAsk(true)}>
          Открыть спор
        </Button>
      </div>
      <ConfirmModal
        open={ask}
        onClose={() => setAsk(false)}
        title="Открыть спор?"
        text="Судья рассмотрит спор в течение 24 часов. Приложите скриншот или клип с итогом матча."
        confirmLabel="Открыть спор"
        onConfirm={async () => {
          await api.confirmResult(r.code, false);
          setAsk(false);
          setState("dispute");
          toast.info("Спор открыт", "Добавьте доказательства в блоке «Спор по результату»");
        }}
      />
    </Card>
  );
}

function DisputeCard({ d }: { d: MyMatches["dispute"] }) {
  const [comment, setComment] = useState("Скриншот табло прикреплён, счёт 13 : 11 в нашу пользу.");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <CardHeader title="Спор по результату">
        <Badge tone="muted">Судья: {d.judge}</Badge>
      </CardHeader>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="accent" dot>
            Открыт
          </Badge>
          <span className="mono text-[11px] tracking-[0.14em] text-text-2 uppercase">
            {d.code} · {d.tournament} · {d.date}
          </span>
        </div>
        <p className="text-[15px]">{d.text}</p>
        <Field label="Комментарий судье" htmlFor="judge-comment">
          <Textarea id="judge-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        {file && <span className="text-[13px] text-success-text">Прикреплено: {file.name}</span>}
        <div className="flex flex-wrap gap-3">
          <label className="btn-text inline-flex h-11 cursor-pointer items-center gap-2 border border-line-strong px-5 text-[14px] hover:border-accent">
            <Paperclip size={16} aria-hidden /> Прикрепить файл
            <input type="file" accept="image/*,video/mp4" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button
            variant="primary"
            icon={Flag}
            loading={busy}
            disabled={comment.trim().length < 5}
            onClick={async () => {
              const form = new FormData();
              form.append("comment", comment);
              if (file) form.append("file", file);
              setBusy(true);
              await api.sendDispute(d.code, form);
              setBusy(false);
              toast.success("Отправлено судье", "Решение придёт уведомлением");
            }}
          >
            Отправить судье
          </Button>
        </div>
        <Link href="/legal/rules" className="text-[13px] text-text-3 underline underline-offset-2 hover:text-text">
          Регламент споров
        </Link>
      </div>
    </Card>
  );
}
