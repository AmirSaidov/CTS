"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Play, Tv } from "lucide-react";
import type { Match, PlayerStatLine } from "@/shared/api/types";
import { useLiveMatch } from "@/features/live/hooks";
import { cn } from "@/shared/lib/cn";
import { fmtDate, fmtTime, num, tzLabel } from "@/shared/lib/format";
import { useUser } from "@/shared/lib/stores";
import { isCaptain } from "@/shared/lib/permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers, KeyRow } from "@/shared/ui/card";
import { Avatar, Placeholder, TeamLogo } from "@/shared/ui/misc";
import { Tabs } from "@/shared/ui/tabs";

/** Составы команд. Статистики игроков (K/D/A, ACS) в MVP нет — источника данных нет. */
type Rosters = { a: PlayerStatLine[]; b: PlayerStatLine[] };

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "maps", label: "Карты" },
  { key: "rosters", label: "Составы" },
  { key: "stream", label: "Трансляция" },
];

export function MatchLive({ slug, initial, rosters, initialTab = "overview" }: { slug: string; initial: Match; rosters: Rosters; initialTab?: string }) {
  const { data: m } = useLiveMatch(slug, initial.code, initial);
  const [tab, setTab] = useState(initialTab);
  const live = m.status === "live";

  return (
    <div className="flex flex-col gap-10">
      <Scoreboard m={m} />
      <Tabs
        items={TABS}
        active={tab}
        onChange={(k) => {
          setTab(k);
          const url = new URL(window.location.href);
          url.searchParams.set("tab", k);
          window.history.replaceState(null, "", url);
        }}
      />
      <div className="grid gap-6 desk:grid-cols-[1fr_420px]">
        <div className="flex min-w-0 flex-col gap-6">
          {(tab === "overview" || tab === "maps") && <MapCards m={m} />}
          {(tab === "overview" || tab === "rosters") && (
            <div className="grid gap-6 tab:grid-cols-2">
              {[
                [m.a.team, rosters.a],
                [m.b.team, rosters.b],
              ].map(([team, rows], i) => (
                <Card key={i}>
                  <CardHeader title={(team as Match["a"]["team"])?.name ?? "TBD"} />
                  <ul>
                    {(rows as PlayerStatLine[]).map((p) => (
                      <li key={p.nick} className="flex items-center gap-3 border-b border-line px-6 py-3.5 last:border-b-0">
                        <Avatar tag={p.tag} size={32} />
                        <span className="font-semibold">{p.nick}</span>
                        {p.captain && <Badge tone="gold">Кап</Badge>}
                        <span className="ml-auto text-[14px] text-text-2">{p.role}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
          {tab === "stream" && <StreamCard m={m} big />}
        </div>
        <aside className="flex flex-col gap-6">
          {tab !== "stream" && <StreamCard m={m} />}
          <Card>
            <CardHeader title="Детали матча" />
            <KeyRow k="Турнир" v={<Link href={`/tournaments/${slug}`} className="hover:text-accent-hover">{m.tournamentName}</Link>} />
            <KeyRow k="Этап" v={`Плей-офф · ${m.code}`} />
            <KeyRow k="Формат" v={`BO${m.bo}`} />
            <KeyRow k="Сервер" v={m.server ?? "—"} />
            <KeyRow k="Судья" v={m.judge ?? "—"} />
            <KeyRow k="Победитель проходит в" v={m.nextMatch ?? "—"} />
          </Card>
          <CaptainsBlock m={m} live={live} />
        </aside>
      </div>
    </div>
  );
}

function Scoreboard({ m }: { m: Match }) {
  const side = (s: Match["a"], align: "left" | "right") => (
    <div className={cn("flex items-center gap-6", align === "right" && "flex-row-reverse text-right")}>
      <TeamLogo tag={s.team?.tag ?? "?"} size={120} className="hidden tab:inline-flex" />
      <div className="flex min-w-0 flex-col gap-2">
        <span className="font-display text-[clamp(28px,4vw,64px)] leading-none break-words">{s.team?.name ?? s.placeholder ?? "TBD"}</span>
        <span className="mono-label">
          {s.seed ? `Посев #${s.seed}` : ""}
          {s.group ? ` · Группа ${s.group}` : ""}
        </span>
      </div>
    </div>
  );
  return (
    <section className="relative border border-line bg-elev-1 px-5 py-10 tab:px-14 tab:py-14" aria-label="Табло">
      <CornerMarkers tone="silver" offset={8} />
      <div className="grid items-center gap-8 desk:grid-cols-[1fr_auto_1fr]">
        {side(m.a, "left")}
        <div className="flex flex-col items-center gap-3">
          <span className="mono-label">Счёт по картам</span>
          <span className="font-display flex items-center gap-6 text-[clamp(72px,9vw,128px)] leading-none tabular-nums" aria-live="polite" aria-label={`Счёт ${m.a.score ?? 0} : ${m.b.score ?? 0}`}>
            {m.a.score ?? "–"}
            <span className="flex flex-col gap-3" aria-hidden>
              <span className="size-4 bg-line-strong" />
              <span className="size-4 bg-line-strong" />
            </span>
            {m.b.score ?? "–"}
          </span>
          {m.startAt && (
            <span className="mono text-[11px] tracking-[0.16em] text-text-2">
              {fmtDate(m.startAt)} · {fmtTime(m.startAt)} {tzLabel()}
            </span>
          )}
        </div>
        {side(m.b, "right")}
      </div>
    </section>
  );
}

function MapCards({ m }: { m: Match }) {
  const maps = m.maps ?? [];
  if (!maps.length) return <p className="text-text-2">Карты появятся после пиков.</p>;
  return (
    <div className="grid gap-4 tab:grid-cols-3">
      {maps.map((map, i) => {
        const live = map.status === "live";
        return (
          <article key={map.name} className={cn("flex flex-col border", live ? "border-accent bg-elev-2" : "border-line bg-elev-1")}>
            <Placeholder label={`Карта ${map.name}`} className="h-[120px] border-b border-line" />
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="mono-label">Карта 0{i + 1}</span>
                <Badge tone={live ? "accent" : "muted"} dot={live}>
                  {live ? "Live" : map.status === "done" ? "Завершена" : "Ожидает"}
                </Badge>
              </div>
              <h3 className="font-display text-[30px]">{map.name}</h3>
              {[
                [m.a.team?.name, map.a],
                [m.b.team?.name, map.b],
              ].map(([name, score], j) => (
                <div key={j} className="flex items-center justify-between">
                  <span className={cn("text-[15px]", j === 0 ? "font-semibold" : "text-text-2")}>{name}</span>
                  <span className="font-display text-[26px] tabular-nums">{score ?? "—"}</span>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Эмбед Twitch/YouTube грузится только по клику — не тянем тяжёлый iframe при открытии страницы */
function StreamCard({ m, big }: { m: Match; big?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const live = m.status === "live";
  if (!m.stream) return null;
  const embed = m.stream.url.includes("twitch") ? `https://player.twitch.tv/?channel=cts_gg&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}` : m.stream.url;
  return (
    <Card>
      <CardHeader title="Трансляция">{live && <Badge tone="accent" dot>Live</Badge>}</CardHeader>
      {loaded ? (
        <iframe src={embed} title="Трансляция матча" className={cn("w-full border-b border-line", big ? "aspect-video" : "aspect-video")} allowFullScreen />
      ) : (
        <button type="button" onClick={() => setLoaded(true)} className="group block w-full border-b border-line" aria-label="Загрузить трансляцию">
          <Placeholder label="Эмбед Twitch / YouTube" aspect="16 / 9">
            <span className="absolute flex size-14 items-center justify-center border border-line-strong bg-bg/80 opacity-0 transition-opacity group-hover:opacity-100">
              <Play size={22} aria-hidden />
            </span>
          </Placeholder>
        </button>
      )}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="mono-label">Смотрят сейчас{m.stream.viewers ? ` · ${num(m.stream.viewers)}` : ""}</span>
        <Button size="sm" icon={Tv} iconRight={ExternalLink} href={m.stream.url}>
          Открыть
        </Button>
      </div>
    </Card>
  );
}

/** «Капитанам» — виден только капитанам участвующих команд */
function CaptainsBlock({ m, live }: { m: Match; live: boolean }) {
  const user = useUser();
  const teams = [m.a.team?.slug, m.b.team?.slug].filter(Boolean) as string[];
  if (!teams.some((t) => isCaptain(user, t))) return null;
  return (
    <Card tone="raised" corners="accent" cornersOnly="tl" padded className="flex flex-col gap-4">
      <span className="mono-label">Капитанам</span>
      <p className="text-[14px] text-text-2">Счёт вносит капитан победившей команды. Соперник подтверждает результат или открывает спор в течение 15 минут.</p>
      <Button variant="primary" block href={`/me/matches?report=${m.code}`} disabled={!live && m.status !== "awaiting"}>
        Внести результат
      </Button>
    </Card>
  );
}
