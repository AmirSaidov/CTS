import type { Metadata } from "next";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight, ArrowUpRight, SlidersHorizontal, Trophy } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { nowIso } from "@/shared/lib/clock";
import type { Match } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { fmtDay, fmtLong, fmtTime, fmtWeekday, fmtWeekdayLong, inTz, num, tzLabel } from "@/shared/lib/format";
import { IconButton } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { Placeholder, TeamLogo } from "@/shared/ui/misc";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata: Metadata = { title: "Расписание матчей", description: "Матчи киберспортивных турниров по дням: время, команды, счёт и live.", alternates: { canonical: "/schedule" } };

type SP = { date?: string; t?: string };

const TIER: Record<string, string> = { major: "Мажор", league: "Лига", local: "Локальный", open: "Открытый" };
const short = (name?: string) => (name ?? "TBD").replace(/[^A-Za-zА-Яа-я]/g, "").slice(0, 3).toUpperCase();

export default async function SchedulePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const today = format(inTz(nowIso()), "yyyy-MM-dd");
  const date = sp.date ?? today;
  const [matches, tournaments, ranking, news] = await Promise.all([api.schedule(date, sp.t), api.tournaments({}), api.rankings({ kind: "teams", game: "valorant" }), api.news({})]);

  const byDay = new Map<string, Match[]>();
  for (const m of matches) {
    const key = m.startAt ? format(inTz(m.startAt), "yyyy-MM-dd") : "tbd";
    byDay.set(key, [...(byDay.get(key) ?? []), m]);
  }
  const shift = (d: number) => format(addDays(new Date(`${date}T12:00:00`), d), "yyyy-MM-dd");
  const q = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/schedule?${p}`;
  };
  const dayIso = `${date}T12:00:00+06:00`;

  return (
    <div className="grid desk:grid-cols-[320px_1fr_340px]">
      {/* Турниры сезона */}
      <aside className="border-line px-[var(--page-pad)] py-10 desk:border-r desk:px-8" aria-label="Турниры сезона">
        <p className="mono-label mb-3">Season 2026 // Events</p>
        <h2 className="font-display mb-8 text-[44px] leading-[0.95] text-accent">Турниры сезона</h2>
        <ul className="no-scrollbar flex gap-3 overflow-x-auto desk:flex-col desk:gap-2">
          {tournaments.results.map((t) => {
            const on = sp.t === t.slug;
            return (
              <li key={t.slug} className="shrink-0">
                <Link href={q({ t: on ? undefined : t.slug })} aria-current={on ? "true" : undefined} className={cn("relative flex flex-col gap-1.5 border px-4 py-3.5 transition-colors", on ? "border-line-strong bg-elev-1" : "border-transparent hover:bg-elev-1")}>
                  {on && <CornerMarkers only="tl-br" offset={4} />}
                  <span className="mono-label">{TIER[t.tier ?? "open"]}</span>
                  <span className={cn("font-display text-[24px] leading-tight", on && "text-accent")}>{t.name}</span>
                  <span className="text-[13px] text-text-2">
                    {fmtDay(t.startAt)} — {fmtDay(t.finalAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Лента матчей */}
      <section className="flex min-w-0 flex-col gap-10 px-[var(--page-pad)] py-10 desk:px-8">
        <div className="relative flex flex-wrap items-center justify-between gap-6 border border-line bg-elev-1 p-7">
          <CornerMarkers only="tl" />
          <div className="flex flex-col gap-2">
            <span className="mono-label">
              {fmtWeekdayLong(dayIso)} · {tzLabel()}
            </span>
            <h1 className="font-display text-[clamp(44px,5vw,64px)] leading-[0.95]">{fmtLong(dayIso)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border border-line">
              <Link href={q({ date: shift(-1) })} className="flex size-12 items-center justify-center hover:bg-elev-2" aria-label="Предыдущий день">
                <ArrowLeft size={16} />
              </Link>
              <Link href={q({ date: undefined })} className="btn-text flex h-12 items-center border-x border-line px-5 text-[15px] hover:bg-elev-2">
                Сегодня
              </Link>
              <Link href={q({ date: shift(1) })} className="flex size-12 items-center justify-center hover:bg-elev-2" aria-label="Следующий день">
                <ArrowRight size={16} />
              </Link>
            </div>
            <Link href={q({ t: undefined })} className="btn-text hidden h-12 items-center border border-line px-5 text-[14px] hover:bg-elev-2 tab:flex">
              {sp.t ? "Сбросить турнир" : "Все турниры"}
            </Link>
            <IconButton icon={SlidersHorizontal} label="Фильтры" href="/tournaments" />
          </div>
        </div>

        {matches.length === 0 && <EmptyState kind="matches" />}
        {[...byDay.entries()].map(([day, list]) => {
          const iso = `${day}T12:00:00+06:00`;
          const label = day === today ? "Сегодня" : day === shift(1) && date === today ? "Завтра" : fmtLong(iso);
          return (
            <div key={day} className="flex flex-col gap-4">
              <h2 className="flex items-center gap-4">
                <span className="font-display text-[32px]">{label}</span>
                <span className="mono-label">
                  {fmtWeekday(iso)} · {fmtDay(iso)}
                </span>
                <span className="h-px flex-1 bg-line" aria-hidden />
              </h2>
              {list.map((m) => (
                <MatchRow key={`${m.tournamentSlug}-${m.code}-${m.startAt}`} m={m} />
              ))}
            </div>
          );
        })}
      </section>

      {/* Рейтинг и новости */}
      <aside className="flex flex-col gap-12 border-line px-[var(--page-pad)] py-10 desk:border-l desk:px-8">
        <section className="flex flex-col">
          <h2 className="t-h2">Рейтинг команд</h2>
          <p className="mono-label mt-1 mb-4">Сезон 2026 · Valorant</p>
          {ranking.results.slice(0, 3).map((r) => (
            <Link key={r.team.slug} href={`/t/${r.team.slug}`} className="flex items-center gap-4 border-b border-line py-4 hover:bg-elev-1">
              <span className={cn("font-display w-6 text-[24px]", r.pos === 1 && "text-gold")}>{r.pos}</span>
              <TeamLogo tag={r.team.tag} size={36} />
              <span className="font-display flex-1 text-[22px]">{r.team.name}</span>
              <span className="mono text-[11px] text-text-3">{num(r.points)}</span>
            </Link>
          ))}
          <Link href="/rankings" className="btn-text flex items-center justify-between py-4 text-[14px] text-text-2 hover:text-text">
            Весь рейтинг <ArrowRight size={16} />
          </Link>
        </section>
        <section className="flex flex-col">
          <h2 className="t-h2 mb-4">Новости</h2>
          {news.results.slice(0, 3).map((n) => (
            <Link key={n.slug} href={`/news/${n.slug}`} className="flex gap-4 border-t border-line py-4 hover:bg-elev-1">
              <Placeholder label="img" className="size-[76px] shrink-0 border border-line" />
              <span className="flex flex-col gap-2">
                <span className="text-[15px] leading-snug font-semibold">{n.title}</span>
                <span className="mono-label">{fmtDay(n.date)}.2026</span>
              </span>
            </Link>
          ))}
        </section>
      </aside>
    </div>
  );
}

function MatchRow({ m }: { m: Match }) {
  const live = m.status === "live";
  return (
    <Link href={`/tournaments/${m.tournamentSlug}/matches/${m.code}`} className={cn("group flex flex-col border transition-colors hover:border-line-strong", live ? "border-accent bg-elev-2" : "border-line bg-elev-1")}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 tab:grid-cols-[140px_1fr_auto]">
        <span className="col-span-2 tab:col-span-1">
          {live ? (
            <span className="mono flex items-center gap-2 text-[12px] tracking-[0.16em] whitespace-nowrap uppercase">
              <span className="live-dot size-2 bg-text" aria-hidden /> Live · Карта {m.currentMap}
            </span>
          ) : (
            <span className="font-display text-[36px] leading-none">{m.startAt ? fmtTime(m.startAt) : "TBD"}</span>
          )}
        </span>
        <span className="flex items-center justify-center gap-3 tab:gap-5">
          <span className="font-display w-14 text-right text-[26px]">{short(m.a.team?.name)}</span>
          <TeamLogo tag={m.a.team?.tag ?? "?"} size={44} />
          {m.a.score !== null && m.b.score !== null ? (
            <span className={cn("font-display w-16 text-center text-[30px]", live && "text-accent")}>
              {m.a.score}:{m.b.score}
            </span>
          ) : (
            <span className="w-16 text-center text-[28px] text-text-4" aria-label="против">
              /
            </span>
          )}
          <TeamLogo tag={m.b.team?.tag ?? "?"} size={44} />
          <span className="font-display w-14 text-[26px]">{short(m.b.team?.name)}</span>
        </span>
        <span className="mono-label flex items-center gap-1 justify-self-end">
          {m.code} <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-line px-6 py-3 text-[13px] text-text-2">
        <Trophy size={15} className="text-text-3" aria-hidden />
        <span>
          {m.tournamentName} · {m.stage}
        </span>
        <span className="mono text-[11px] text-text">BO{m.bo}</span>
      </div>
    </Link>
  );
}
