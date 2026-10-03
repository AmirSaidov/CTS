import Link from "next/link";
import type { Tournament } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { Placeholder } from "@/shared/ui/misc";
import { FORMAT_LABELS, GAME_NAMES, TOURNAMENT_STATUS } from "@/shared/lib/labels";
import { fmtDay } from "@/shared/lib/format";

/** CTA зависит от статуса: «Подать заявку» (регистрация), «Смотреть» (идёт), «Итоги» (завершён) */
function cta(t: Tournament) {
  if (t.status === "registration") return { label: "Подать заявку", href: `/tournaments/${t.slug}/apply`, primary: true };
  if (t.status === "finished") return { label: "Итоги", href: `/tournaments/${t.slug}?tab=results`, primary: false };
  return { label: "Смотреть", href: `/tournaments/${t.slug}`, primary: false };
}

export function TournamentCard({ t, preview }: { t: Tournament; preview?: boolean }) {
  const st = TOURNAMENT_STATUS[t.status];
  const c = cta(t);
  return (
    <article className="group relative flex flex-col border border-line bg-elev-1 transition-colors hover:border-line-strong">
      <CornerMarkers only="tl" />
      <Link href={`/tournaments/${t.slug}`} tabIndex={-1} aria-hidden>
        <Placeholder label="Арт турнира" className="h-[180px] border-b border-line" />
      </Link>
      <div className="flex flex-1 flex-col gap-5 p-5 tab:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={st.tone} dot={st.dot}>
            {t.status === "final" ? "Гранд-финал" : st.label}
          </Badge>
          <Badge tone="muted">{GAME_NAMES[t.game]}</Badge>
        </div>
        <h3 className="t-h3 text-[28px]">
          <Link href={`/tournaments/${t.slug}`} className="hover:text-accent-hover">
            {t.name}
          </Link>
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            ["Формат", FORMAT_LABELS[t.format]],
            ["Команды", `${t.teams.current} / ${t.teams.max}`],
            ["Старт", fmtDay(t.startAt)],
            ["Призовой", t.prize],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="mono-label">{k}</dt>
              <dd className="text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>
        {!preview && (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-5">
            <span className="truncate text-[14px] text-text-3">Организатор: {t.organizer.name.replace(/\]\s.*$/, "]")}</span>
            <Button href={c.href} variant={c.primary ? "primary" : "secondary"} size="sm">
              {c.label}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
