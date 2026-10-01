import Link from "next/link";
import { api } from "@/shared/api/endpoints";
import { fmtTime } from "@/shared/lib/format";
import { Card, CardHeader } from "@/shared/ui/card";
import { StatTile } from "@/shared/ui/misc";
import { BlockBoundary } from "@/shared/ui/feedback";
import { OrgTournamentsTable } from "@/features/org/tournaments-table";

export const metadata = { title: "Обзор" };

export default async function OrgDashboard() {
  const d = await api.orgDashboard();
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="t-h1">Обзор</h1>
        <span className="mono text-[11px] tracking-[0.16em] text-text-2 uppercase">{d.season}</span>
      </header>
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="Активные турниры" value={String(d.stats.active).padStart(2, "0")} sub={d.stats.activeNote} />
        <StatTile label="Команд в системе" value={d.stats.teams} sub={`+${d.stats.teamsDelta} за неделю`} />
        <StatTile label="Матчей сегодня" value={String(d.stats.matchesToday).padStart(2, "0")} sub={`Ближайший в ${d.stats.nextAt}`} />
        <StatTile label="Заявки на проверке" value={String(d.stats.pending).padStart(2, "0")} sub="Рассмотреть заявки" subHref="/org/tournaments/t3/applications" tone="accent" />
      </div>
      <div className="grid gap-6 desk:grid-cols-[1fr_360px]">
        <Card className="min-w-0">
          <BlockBoundary>
            <OrgTournamentsTable initial={d.tournaments} />
          </BlockBoundary>
        </Card>
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Матчи сегодня">
              <span className="mono-label">24.09</span>
            </CardHeader>
            <ul>
              {d.todayMatches.map((m) => {
                const live = m.status === "live";
                return (
                  <li key={m.tournamentSlug + m.code}>
                    <Link href={`/tournaments/${m.tournamentSlug}/matches/${m.code}`} className="flex items-center gap-5 border-b border-line px-6 py-4 hover:bg-elev-1">
                      <span className="mono w-11 text-[12px] text-text-2">{live ? "LIVE" : m.startAt ? fmtTime(m.startAt) : "—"}</span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] font-semibold uppercase">
                          {m.a.team?.name} {live ? `${m.a.score} : ${m.b.score}` : "vs"} {m.b.team?.name}
                        </span>
                        <span className="mono truncate text-[10px] tracking-[0.14em] text-text-3 uppercase">
                          {m.tournamentName} · {m.code}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card tone="raised" corners="accent" cornersOnly="tl" className="flex flex-col gap-1 p-6">
            <h2 className="t-h3 mb-3">Требует внимания</h2>
            {d.attention.map((a) => (
              <div key={a.label} className="flex items-center justify-between gap-4 py-2">
                <span className="text-[15px] text-text-2">{a.label}</span>
                <Link href={a.href} className="btn-text text-[13px] hover:text-accent-hover">
                  Открыть
                </Link>
              </div>
            ))}
          </Card>
        </aside>
      </div>
    </div>
  );
}
