import { Trophy } from "lucide-react";
import type { Bracket } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { fmtDay } from "@/shared/lib/format";
import { MatchCard } from "@/features/match/match-card";

const COL_W = 256;
const GAP = 64; // половина — «скобка», половина — подводка к следующему матчу
const SLOT_H = 120;

/**
 * Сетка плей-офф: этапы колонками, соединительные линии, Чемпион золотом.
 * Структуру считает бэкенд — компонент только рисует то, что пришло.
 * На мобильном — горизонтальный скролл, названия этапов прилипают к верху колонки.
 */
export function BracketView({ bracket, matchHref, logos, compact }: { bracket: Bracket; matchHref?: (code: string) => string; logos?: boolean; compact?: boolean }) {
  const first = bracket.stages[0]?.matches.length ?? 1;
  const height = Math.max(first, 1) * (compact ? 112 : SLOT_H);
  const last = bracket.stages.length - 1;
  const showChampion = !compact;

  return (
    <div className={cn("overflow-x-auto", !compact && "no-scrollbar -mx-[var(--page-pad)] px-[var(--page-pad)]")} role="region" aria-label="Турнирная сетка" tabIndex={0}>
      <div className="flex w-max">
        {bracket.stages.map((stage, si) => {
          const isFinal = si === last;
          const groupSize = stage.matches.length > 1 ? 2 : 1;
          const groups: typeof stage.matches[] = [];
          for (let i = 0; i < stage.matches.length; i += groupSize) groups.push(stage.matches.slice(i, i + groupSize));
          const hasNext = si < last || showChampion;
          return (
            <div key={stage.key} className="flex shrink-0 flex-col" style={{ width: COL_W, marginRight: hasNext ? GAP : 0 }}>
              <div className={cn("mono sticky top-0 mb-6 border-b border-line pb-3 text-[10px] tracking-[0.16em] uppercase", isFinal && !compact ? "text-gold" : "text-text-3")}>
                {stage.title} · BO{stage.bo}
              </div>
              <div className="flex flex-col" style={{ height }}>
                {groups.map((g, gi) => (
                  <div key={gi} className="relative flex flex-1 flex-col justify-around">
                    {g.map((m) => (
                      <div key={m.code} className="relative">
                        {si > 0 && <span className="absolute top-1/2 h-px bg-line-strong" style={{ left: -GAP / 2, width: GAP / 2 }} aria-hidden />}
                        <MatchCard m={m} href={matchHref?.(m.code)} final={isFinal && !compact} logos={logos} />
                      </div>
                    ))}
                    {hasNext && g.length === 2 && (
                      <span className="absolute top-1/4 bottom-1/4 border-y border-r border-line-strong" style={{ left: "100%", width: GAP / 2 }} aria-hidden />
                    )}
                    {hasNext && g.length === 1 && (si < last || showChampion) && (
                      <span className="absolute top-1/2 h-px bg-line-strong" style={{ left: "100%", width: GAP / 2 }} aria-hidden />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {showChampion && (
          <div className="flex shrink-0 flex-col" style={{ width: COL_W }}>
            <div className="mono mb-6 border-b border-line pb-3 text-[10px] tracking-[0.16em] text-gold uppercase">Чемпион</div>
            <div className="relative flex items-center" style={{ height }}>
              <span className="absolute top-1/2 h-px bg-line-strong" style={{ left: -GAP / 2, width: GAP / 2 }} aria-hidden />
              <div className="flex w-full flex-col items-center gap-3 border border-dashed border-gold bg-[color-mix(in_srgb,var(--gold)_6%,var(--bg))] px-5 py-6 text-center">
                <Trophy size={30} strokeWidth={1.5} className="text-gold" aria-hidden />
                <span className="font-display text-[26px] text-gold">{bracket.champion?.name ?? "Будет определён"}</span>
                {bracket.championAt && <span className="mono-label">{fmtDay(bracket.championAt)} · Гранд-финал</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
