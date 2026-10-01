import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Flag, Star, Trophy } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { ACCOUNT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader } from "@/shared/ui/card";
import { Container } from "@/shared/ui/page";
import { Segmented, Tabs } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { TeamLogo } from "@/shared/ui/misc";
import { ProfileHeader } from "@/features/profile/profile-header";
import { ProfileActions } from "@/features/profile/profile-actions";
import { HistoryTable } from "@/features/profile/history-table";

type Props = { params: Promise<{ nick: string }>; searchParams: Promise<{ tab?: string; game?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nick } = await params;
  const p = await api.player(nick).catch(() => null);
  if (!p) return { title: "Игрок не найден" };
  return { title: `${p.nick} — профиль игрока`, description: `${p.role} · ${p.team?.name ?? "без команды"} · ${GAME_NAMES[p.game]}`, alternates: { canonical: `/p/${nick.toLowerCase()}` } };
}

const ICONS = { trophy: Trophy, star: Star, crown: Crown, flag: Flag };

export default async function PlayerPage({ params, searchParams }: Props) {
  const { nick } = await params;
  const { tab = "overview", game = "all" } = await searchParams;
  const p = await orNotFound(api.player(nick));
  const base = `/p/${nick.toLowerCase()}`;
  const history = p.history.filter((h) => game === "all" || h.game === game);
  // скрытые настройками приватности поля не выводим
  const city = p.privacy.showCity ? p.city : null;

  return (
    <>
      <ProfileHeader
        kind="player"
        tag={p.tag}
        name={p.nick}
        sub={[p.fullName, city, p.team?.name, p.role].filter(Boolean).join(" · ")}
        badges={
          <>
            <Badge>{GAME_NAMES[p.game]}</Badge>
            {p.captain && <Badge tone="gold">Капитан</Badge>}
            <Badge tone={p.lookingForTeam ? "success" : "muted"}>В поиске команды: {p.lookingForTeam ? "да" : "нет"}</Badge>
          </>
        }
        actions={<ProfileActions primary="Пригласить в команду" message="Написать" path={base} />}
        stats={p.privacy.showStats ? p.stats : null}
      />
      <Container className="flex flex-col gap-8 pt-10 pb-20">
        <Tabs
          active={tab}
          items={[
            { key: "overview", label: "Обзор", href: `${base}?tab=overview` },
            { key: "tournaments", label: "Турниры", href: `${base}?tab=tournaments` },
            { key: "matches", label: "Матчи", href: `${base}?tab=matches` },
            { key: "stats", label: "Статистика", href: `${base}?tab=stats` },
            { key: "achievements", label: "Достижения", href: `${base}?tab=achievements` },
          ]}
        />
        <div className="grid gap-6 desk:grid-cols-[1fr_420px]">
          <div className="flex min-w-0 flex-col gap-6">
            {["overview", "tournaments"].includes(tab) && (
              <Card>
                <CardHeader title="История турниров">
                  <Segmented
                    label="Игра"
                    active={game}
                    items={[
                      { key: "all", label: "Все", href: `${base}?tab=${tab}` },
                      { key: "valorant", label: "Valorant", href: `${base}?tab=${tab}&game=valorant` },
                      { key: "cs2", label: "CS2", href: `${base}?tab=${tab}&game=cs2` },
                    ]}
                  />
                </CardHeader>
                <HistoryTable rows={history} />
              </Card>
            )}
            {["overview", "matches", "stats"].includes(tab) && (
              <Card>
                <CardHeader title="Последние матчи">
                  <Link href={`${base}?tab=matches`} className="btn-text text-[14px] hover:text-accent-hover">
                    Все матчи
                  </Link>
                </CardHeader>
                <Table minWidth={620} label="Последние матчи">
                  <THead>
                    <Th sticky>Матч</Th>
                    <Th>Счёт</Th>
                    <Th>Карта</Th>
                    <Th>K / D / A</Th>
                    <Th align="right">Итог</Th>
                  </THead>
                  <tbody>
                    {p.recentMatches.map((m) => (
                      <Tr key={m.code + m.vs}>
                        <Td sticky>
                          <span className="flex items-center gap-3">
                            <TeamLogo tag="TG" size={32} />
                            <span className="flex flex-col">
                              <span className="font-semibold">{m.vs}</span>
                              <span className="mono text-[10px] tracking-[0.14em] text-text-3">
                                {m.code} · BO{m.bo}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td className="font-display text-[22px]">{m.score}</Td>
                        <Td>{m.map}</Td>
                        <Td className="mono">{m.kda}</Td>
                        <Td align="right">
                          <Badge tone={m.win ? "success" : "muted"}>{m.win ? "Победа" : "Поражение"}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            )}
          </div>
          <aside className="flex flex-col gap-6">
            {["overview", "achievements"].includes(tab) && (
              <Card>
                <CardHeader title="Достижения" />
                <ul>
                  {p.achievements.map((a) => {
                    const Icon = ICONS[a.icon];
                    return (
                      <li key={a.title} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
                        <span className={cn("flex size-11 shrink-0 items-center justify-center border", a.gold ? "border-gold text-gold" : "border-line-strong text-text-2")}>
                          <Icon size={18} strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-[16px] font-semibold">{a.title}</span>
                          <span className="mono-label">{a.meta}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
            <Card>
              <CardHeader title="Игровые аккаунты" />
              {p.accounts.map((acc) => (
                <div key={acc.kind} className="flex items-center justify-between border-b border-line px-6 py-4 last:border-b-0">
                  <span className="flex flex-col gap-1">
                    <span className="mono-label">{ACCOUNT_LABELS[acc.kind]}</span>
                    <span className="text-[17px] font-semibold">{acc.value ?? "—"}</span>
                  </span>
                  <Badge tone={acc.verified ? "success" : "muted"}>{acc.verified ? "Подтверждён" : "Привязан"}</Badge>
                </div>
              ))}
            </Card>
            <Card>
              <CardHeader title="Об игроке" />
              <p className="px-6 py-5 text-[15px] text-text-2">{p.about}</p>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
