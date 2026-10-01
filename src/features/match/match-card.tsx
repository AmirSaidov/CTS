import Link from "next/link";
import type { Match, MatchSide } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { fmtDayTime } from "@/shared/lib/format";
import { TeamLogo } from "@/shared/ui/misc";

function winnerOf(m: Match): "a" | "b" | null {
  if (!["finished", "confirmed"].includes(m.status)) return null;
  if (m.a.score === null || m.b.score === null) return null;
  return m.a.score > m.b.score ? "a" : m.b.score > m.a.score ? "b" : null;
}

function SideRow({ side, win, lose, live, logos }: { side: MatchSide; win: boolean; lose: boolean; live: boolean; logos?: boolean }) {
  const name = side.team?.name ?? side.placeholder ?? "TBD";
  return (
    <div className="flex h-[38px] items-center justify-between gap-3 px-3">
      <span className={cn("flex min-w-0 items-center gap-2.5 text-[14px]", side.team ? "font-semibold uppercase" : "text-text-2", lose && "font-medium text-text-2")}>
        {logos && <TeamLogo tag={side.team?.tag ?? "?"} size={22} />}
        <span className="truncate">{side.team ? name : name}</span>
      </span>
      <span className={cn("font-display text-[20px] tabular-nums", win || live ? "text-text" : "text-text-2", side.score === null && "text-text-3")}>{side.score ?? "—"}</span>
    </div>
  );
}

/** Карточка матча в сетке: код, время/статус, две команды со счётом, победитель выделен, Live — рамка accent */
export function MatchCard({ m, href, final, logos, className }: { m: Match; href?: string; final?: boolean; logos?: boolean; className?: string }) {
  const w = winnerOf(m);
  const live = m.status === "live";
  const right = live ? (
    <span className="flex items-center gap-1.5 text-accent-hover">
      <span className="live-dot size-1.5 bg-current" aria-hidden />
      LIVE{m.currentMap ? ` · КАРТА ${m.currentMap}` : ""}
    </span>
  ) : ["finished", "confirmed"].includes(m.status) && m.stageKey !== "qf" ? (
    "Завершён"
  ) : m.startAt ? (
    fmtDayTime(m.startAt)
  ) : (
    "TBD"
  );

  const body = (
    <div
      className={cn(
        "relative w-full border bg-elev-1 transition-colors",
        live ? "border-accent bg-elev-2" : final ? "border-gold" : "border-line",
        href && "hover:border-line-strong",
        className,
      )}
    >
      {live && <span className="absolute -top-2 -left-2 size-3 border-t-2 border-l-2 border-text-2" aria-hidden />}
      <div className={cn("mono flex h-6 items-center justify-between border-b border-line px-3 text-[10px] tracking-[0.14em] uppercase", final ? "text-gold" : "text-text-3")}>
        <span>{m.code}</span>
        <span>{right}</span>
      </div>
      <SideRow side={m.a} win={w === "a"} lose={w === "b"} live={live} logos={logos} />
      <SideRow side={m.b} win={w === "b"} lose={w === "a"} live={live} logos={logos} />
    </div>
  );

  return href ? (
    <Link href={href} className="block w-full" aria-label={`${m.code}: ${m.a.team?.name ?? m.a.placeholder} против ${m.b.team?.name ?? m.b.placeholder}`}>
      {body}
    </Link>
  ) : (
    body
  );
}
