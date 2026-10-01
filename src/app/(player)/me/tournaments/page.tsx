import Link from "next/link";
import { Search } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { FORMAT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { PageHeader, StatTile, TeamLogo } from "@/shared/ui/misc";
import { Segmented, Tabs } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata = { title: "Мои турниры" };

type SP = { tab?: "all" | "active" | "applications" | "past"; game?: string };

const ACTION = {
  open: { label: "Открыть", primary: false },
  application: { label: "Заявка", primary: false },
  answer: { label: "Ответить", primary: true },
  results: { label: "Итоги", primary: false },
} as const;

export default async function MyTournamentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { tab = "all", game = "all" } = await searchParams;
  const rows = await api.myTournaments();
  const groups = {
    all: rows,
    active: rows.filter((r) => r.action === "open" || r.action === "answer"),
    applications: rows.filter((r) => r.action === "application"),
    past: rows.filter((r) => r.action === "results"),
  };
  const list = groups[tab].filter((r) => game === "all" || r.t.game === game);
  const q = (p: Partial<SP>) => `/me/tournaments?${new URLSearchParams(Object.entries({ tab, game, ...p }).filter(([, v]) => v && v !== "all") as [string, string][])}`;

  const href = (r: (typeof rows)[number]) =>
    r.action === "application" ? `/tournaments/${r.t.slug}/apply` : r.action === "answer" ? "/me/invites" : r.action === "results" ? `/tournaments/${r.t.slug}?tab=results` : `/tournaments/${r.t.slug}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Кабинет игрока // Турниры"
        title="Мои турниры"
        sub="Активные, прошедшие и поданные заявки"
        actions={
          <Button variant="primary" icon={Search} href="/tournaments">
            Найти турнир
          </Button>
        }
      />
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="Сыграно" value="10" />
        <StatTile label="Активных" value="02" tone="accent" />
        <StatTile label="Заявки" value="01" />
        <StatTile label="Трофеи" value="02" tone="gold" />
      </div>
      <Card>
        <CardHeader title="Турниры">
          <Segmented
            label="Игра"
            active={game}
            items={[
              { key: "all", label: "Все игры", href: q({ game: "all" }) },
              { key: "valorant", label: "Valorant", href: q({ game: "valorant" }) },
              { key: "cs2", label: "CS2", href: q({ game: "cs2" }) },
            ]}
          />
        </CardHeader>
        <Tabs
          className="px-6 pt-5"
          size="lg"
          active={tab}
          items={[
            { key: "all", label: `Все · ${groups.all.length}`, href: q({ tab: "all" }) },
            { key: "active", label: `Активные · ${groups.active.length}`, href: q({ tab: "active" }) },
            { key: "applications", label: `Заявки · ${groups.applications.length}`, href: q({ tab: "applications" }) },
            { key: "past", label: `Прошедшие · ${groups.past.length}`, href: q({ tab: "past" }) },
          ]}
        />
        {list.length === 0 ? (
          <EmptyState kind="matches" compact className="m-6" />
        ) : (
          <Table minWidth={760} label="Мои турниры">
            <THead>
              <Th sticky>Турнир</Th>
              <Th>Команда</Th>
              <Th>Статус</Th>
              <Th>Дата</Th>
              <Th align="right" />
            </THead>
            <tbody>
              {list.map((r) => (
                <Tr key={r.t.slug}>
                  <Td sticky>
                    <Link href={`/tournaments/${r.t.slug}`} className="flex items-center gap-3 hover:text-accent-hover">
                      <TeamLogo tag={r.t.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} size={32} />
                      <span className="flex flex-col">
                        <span className="font-semibold">{r.t.name}</span>
                        <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">
                          {GAME_NAMES[r.t.game]} · {FORMAT_LABELS[r.t.format]}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td>{r.team}</Td>
                  <Td>
                    <Badge tone={r.tone === "gold" ? "gold" : r.tone === "accent" ? "accent" : "neutral"} dot={r.tone === "accent"}>
                      {r.status}
                    </Badge>
                  </Td>
                  <Td className="mono">{r.date}</Td>
                  <Td align="right">
                    {r.action === "results" ? (
                      <Button size="sm" variant="ghost" href={href(r)}>
                        Итоги
                      </Button>
                    ) : (
                      <Button size="sm" variant={ACTION[r.action].primary ? "primary" : "secondary"} href={href(r)} className="w-[140px]">
                        {ACTION[r.action].label}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
