"use client";

import { useEffect, useState } from "react";
import type { Bracket, Match } from "@/shared/api/types";
import { useLiveBracket } from "@/features/live/hooks";
import { cn } from "@/shared/lib/cn";
import { fmtDayTime, countdown } from "@/shared/lib/format";
import { now as clockNow } from "@/shared/lib/clock";
import { CornerMarkers } from "@/shared/ui/card";

/** Виджет CTS-LIVE в hero: мини-сетка демо-турнира, live-матч и «Сетка обновлена 00:12 назад» */
export function LiveWidget({ initial }: { initial: Bracket }) {
  const { data } = useLiveBracket(initial.tournamentSlug, initial);
  const sf = data.stages.find((s) => s.key === "sf")?.matches ?? [];
  const gf = data.stages.find((s) => s.key === "gf")?.matches[0];
  const [ago, setAgo] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setAgo(Math.max(0, clockNow() - new Date(data.updatedAt).getTime()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data.updatedAt]);

  return (
    <div className="relative border border-line bg-[color-mix(in_srgb,var(--bg-elev-1)_80%,transparent)] p-5 backdrop-blur" aria-label="Демо-турнир в реальном времени">
      <CornerMarkers offset={10} tone="silver" />
      <div className="mono mb-4 flex items-center justify-between text-[10px] tracking-[0.16em] uppercase">
        <span className="text-text-3">CTS-LIVE // Плей-офф</span>
        <span className="flex items-center gap-1.5 text-text">
          <span className="live-dot size-1.5 bg-current" aria-hidden /> Live
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {sf.map((m) => (
          <Mini key={m.code} m={m} />
        ))}
        {gf && <Mini m={gf} gold />}
      </div>
      <div className="mono mt-5 flex justify-between border-t border-line pt-3 text-[9px] tracking-[0.16em] text-text-4 uppercase">
        <span>Bishkek Cyber Cup</span>
        <span suppressHydrationWarning>Сетка обновлена {ago === null ? "—" : countdown(Math.min(ago, 3_599_000)).slice(3)} назад</span>
      </div>
    </div>
  );
}

function Mini({ m, gold }: { m: Match; gold?: boolean }) {
  const live = m.status === "live";
  const head = live ? `${m.code} · BO${m.bo} · Карта ${m.currentMap}` : gold ? `Гранд-финал · BO${m.bo} · ${m.startAt ? fmtDayTime(m.startAt) : ""}` : `${m.code} · BO${m.bo} · Завершён`;
  return (
    <div className={cn("border", live ? "border-accent bg-elev-2" : gold ? "border-gold" : "border-line")}>
      <div className={cn("mono border-b border-line px-3 py-1.5 text-[9px] tracking-[0.16em] uppercase", gold ? "text-gold" : "text-text-3")}>{head}</div>
      {[m.a, m.b].map((s, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-1.5 text-[13px]">
          <span className={cn("font-semibold uppercase", !s.team && "font-normal text-text-2 normal-case")}>{s.team?.name ?? s.placeholder}</span>
          <span className="font-display text-[16px] tabular-nums">{s.score ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}
