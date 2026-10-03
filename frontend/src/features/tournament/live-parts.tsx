"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BellRing, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Bracket, Match } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { useLiveTournamentSchedule } from "@/features/live/hooks";
import { cn } from "@/shared/lib/cn";
import { fmtDayTime } from "@/shared/lib/format";
import { toast, useUser } from "@/shared/lib/stores";
import { Button } from "@/shared/ui/button";

/** «■ 1 МАТЧ В ЭФИРЕ» — считается из кэша сетки, который обновляет сокет */
export function LiveCounter({ slug, initial }: { slug: string; initial: Bracket }) {
  const { data } = useQuery({ queryKey: qk.bracket(slug), queryFn: () => api.bracket(slug), initialData: initial });
  const live = data.stages.flatMap((s) => s.matches).filter((m) => m.status === "live").length;
  if (!live) return null;
  const word = live === 1 ? "матч" : live < 5 ? "матча" : "матчей";
  return (
    <span className="mono flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase" aria-live="polite">
      <span className="live-dot size-1.5 bg-text" aria-hidden /> {live} {word} в эфире
    </span>
  );
}

export function RemindButton({ slug, code }: { slug: string; code: string }) {
  const user = useUser();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <Button
      size="sm"
      icon={done ? Check : BellRing}
      loading={loading}
      disabled={done}
      onClick={async () => {
        if (!user) return router.push(`/login?next=/tournaments/${slug}`);
        setLoading(true);
        try {
          await api.remind(slug, code);
          setDone(true);
          toast.success("Напомним за час до матча", "В Telegram и в уведомлениях CTS");
        } catch {
          toast.error("Не получилось включить напоминание");
        } finally {
          setLoading(false);
        }
      }}
    >
      {done ? "Напомним" : "Напомнить"}
    </Button>
  );
}

/** Расписание турнира: «СЕЙЧАС» с live-матчем, ближайшие с «Напомнить», прошедшие с итогом */
export function TournamentSchedule({ slug, initial, limit }: { slug: string; initial: Match[]; limit?: number }) {
  const { data } = useLiveTournamentSchedule(slug, initial);
  const live = data.filter((m) => m.status === "live");
  const upcoming = data.filter((m) => ["scheduled", "tbd", "checkin"].includes(m.status)).sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""));
  const past = data.filter((m) => ["finished", "confirmed"].includes(m.status)).sort((a, b) => (b.startAt ?? "").localeCompare(a.startAt ?? ""));
  const rows = [...live, ...upcoming, ...past].slice(0, limit);

  return (
    <ol className="border border-line">
      {rows.map((m) => {
        const isLive = m.status === "live";
        const done = ["finished", "confirmed"].includes(m.status);
        const isFinal = m.stageKey === "gf";
        return (
          <li key={m.code} className={cn("grid items-center gap-x-6 gap-y-2 border-b border-line px-6 py-5 last:border-b-0 tab:grid-cols-[130px_170px_1fr_auto]", isLive && "bg-elev-2")}>
            <span className={cn("mono text-[12px] tracking-[0.1em] uppercase", isLive ? "font-medium text-text" : "text-text-2")}>{isLive ? "Сейчас" : m.startAt ? fmtDayTime(m.startAt) : "TBD"}</span>
            <span className={cn("mono text-[10px] tracking-[0.16em] uppercase", isFinal ? "text-gold" : "text-text-3")}>
              {m.stage} · {m.code}
            </span>
            <Link href={`/tournaments/${slug}/matches/${m.code}`} className={cn("font-display text-[22px] hover:text-accent-hover tab:text-[26px]", done && "text-text-2")}>
              {m.a.team?.name ?? m.a.placeholder ?? "TBD"}{" "}
              {m.a.score !== null && m.b.score !== null ? (
                <span className={isLive ? "text-accent" : undefined}>
                  {m.a.score} : {m.b.score}
                </span>
              ) : (
                <span className="text-text-3">vs</span>
              )}{" "}
              {m.b.team?.name ?? (m.b.placeholder?.startsWith("Победитель") ? "TBD" : m.b.placeholder) ?? "TBD"}
            </Link>
            <span className="tab:justify-self-end">
              {isLive ? (
                <Button href={`/tournaments/${slug}/matches/${m.code}?tab=stream`} variant="primary" size="sm">
                  Смотреть
                </Button>
              ) : done ? (
                <span className="mono-label">Завершён</span>
              ) : (
                <RemindButton slug={slug} code={m.code} />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
