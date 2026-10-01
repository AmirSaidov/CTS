import Link from "next/link";
import { Calendar, Check, Search } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { ago } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { PageHeader, StatTile } from "@/shared/ui/misc";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { EmptyState } from "@/shared/ui/empty-state";
import { InviteMiniList } from "@/features/player/invite-list";
import { NextMatchCard } from "@/features/player/next-match-card";

export const metadata = { title: "Обзор" };

export default async function PlayerOverview() {
  const [user, tournaments, invites, notifications] = await Promise.all([getSession(), api.myTournaments(), api.myInvites(), api.myNotifications()]);
  const active = tournaments.filter((x) => x.action === "open" || x.action === "application");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Кабинет игрока // Обзор"
        title={`Привет, ${user?.nick ?? "игрок"}`}
        sub={user?.team ? `${user.captainOf ? "Капитан" : "Игрок"} ${user.team.name} · Valorant` : "Без команды"}
        actions={
          <Button variant="primary" icon={Search} href="/tournaments">
            Найти турнир
          </Button>
        }
      />
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="Активные турниры" value="02" sub="1 в плей-офф" />
        <StatTile label="Матчей до финала" value="01" sub="27.09 · 19:00" tone="gold" />
        <StatTile label="Винрейт сезона" value="67%" sub="31 победа из 46" />
        <StatTile label="Приглашения" value={String(user?.unread.invites ?? 0).padStart(2, "0")} sub="Ответьте до 30.09" tone="accent" href="/me/invites" />
      </div>
      <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
        <div className="flex min-w-0 flex-col gap-6">
          {user?.team ? <NextMatchCard /> : <EmptyState kind="team" compact />}
          <Card>
            <CardHeader title="Мои турниры">
              <Link href="/me/tournaments" className="btn-text text-[14px] hover:text-accent-hover">
                Все
              </Link>
            </CardHeader>
            {active.length === 0 ? (
              <EmptyState kind="matches" compact className="m-6" />
            ) : (
              <Table minWidth={560} label="Мои турниры">
                <THead>
                  <Th sticky>Турнир</Th>
                  <Th>Статус</Th>
                  <Th>Этап</Th>
                  <Th>Следующий матч</Th>
                </THead>
                <tbody>
                  {active.map((r) => (
                    <Tr key={r.t.slug}>
                      <Td sticky className="font-semibold">
                        <Link href={`/tournaments/${r.t.slug}`} className="hover:text-accent-hover">
                          {r.t.name}
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={r.tone === "gold" ? "gold" : "neutral"}>{r.status}</Badge>
                      </Td>
                      <Td>{r.stage}</Td>
                      <Td className="mono">{r.next}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Приглашения">
              <Link href="/me/invites" className="btn-text text-[14px] hover:text-accent-hover">
                Все
              </Link>
            </CardHeader>
            <InviteMiniList initial={invites} />
          </Card>
          <Card>
            <CardHeader title="Уведомления">
              <Link href="/me/notifications" className="btn-text text-[14px] hover:text-accent-hover">
                Все
              </Link>
            </CardHeader>
            <ul>
              {notifications
                .filter((n) => n.read)
                .slice(0, 2)
                .map((n) => (
                  <li key={n.id} className="flex gap-4 border-b border-line px-6 py-5 last:border-b-0">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center border", n.tone === "success" ? "border-success text-success-text" : "border-line-strong")}>
                      {n.tone === "success" ? <Check size={18} aria-hidden /> : <Calendar size={18} strokeWidth={1.5} aria-hidden />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">{n.title}</span>
                        <span className="mono text-[10px] text-text-3">{ago(n.at)}</span>
                      </div>
                      <span className="text-[14px] text-text-2">{n.body}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
