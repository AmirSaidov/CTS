import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { GAME_NAMES } from "@/shared/lib/labels";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader } from "@/shared/ui/card";
import { Container } from "@/shared/ui/page";
import { Tabs } from "@/shared/ui/tabs";
import { Placeholder } from "@/shared/ui/misc";
import { ProfileHeader } from "@/features/profile/profile-header";
import { ProfileActions } from "@/features/profile/profile-actions";
import { HistoryTable } from "@/features/profile/history-table";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await api.team(slug).catch(() => null);
  if (!t) return { title: "Команда не найдена" };
  return { title: `${t.name} — команда`, description: `${GAME_NAMES[t.game]} · ${t.city} · капитан ${t.captainNick}`, alternates: { canonical: `/t/${slug}` } };
}

export default async function TeamPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = "roster" } = await searchParams;
  const t = await orNotFound(api.team(slug));
  const base = `/t/${slug}`;
  const mains = t.members.filter((m) => m.status === "main").length;

  return (
    <>
      <ProfileHeader
        kind="team"
        tag={t.tag}
        name={t.name}
        sub={`Основана в ${t.founded} · ${t.city} · ${GAME_NAMES[t.game]} · Капитан ${t.captainNick}`}
        badges={
          <>
            <Badge>{GAME_NAMES[t.game]}</Badge>
            {t.badges.map((b) => (
              <Badge key={b} tone="gold">
                {b}
              </Badge>
            ))}
            {t.recruiting && <Badge tone="success">Набор открыт</Badge>}
          </>
        }
        actions={<ProfileActions primary="Подать заявку в команду" message="Написать капитану" path={base} />}
        stats={t.stats}
      />
      <Container className="flex flex-col gap-12 pt-10 pb-20">
        <Tabs
          active={tab}
          items={[
            { key: "roster", label: "Состав", href: `${base}?tab=roster` },
            { key: "tournaments", label: "Турниры", href: `${base}?tab=tournaments` },
            { key: "matches", label: "Матчи", href: `${base}?tab=matches` },
            { key: "trophies", label: "Трофеи", href: `${base}?tab=trophies` },
            { key: "stats", label: "Статистика", href: `${base}?tab=stats` },
          ]}
        />

        {tab === "roster" && (
          <section className="flex flex-col gap-6" aria-labelledby="roster-h">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="roster-h" className="font-display text-[44px]">
                Состав
              </h2>
              <span className="mono-label">
                {t.members.length} игроков · {mains} основных + {t.members.length - mains} запасной
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 tab:grid-cols-3 desk:grid-cols-6">
              {t.members.map((m) => (
                <Link key={m.nick} href={`/p/${m.nick.toLowerCase()}`} className={cn("flex flex-col border bg-elev-1 transition-colors hover:border-line-strong", m.captain ? "border-gold" : "border-line")}>
                  <Placeholder label="Фото игрока" className="aspect-square border-b border-line" />
                  <div className="flex flex-col gap-1.5 p-5">
                    <div className="flex items-center justify-between">
                      <span className={cn("mono-label", m.captain && "text-gold!")}>{m.status === "sub" ? "Запасной" : m.role}</span>
                      {m.captain && <Badge tone="gold">Кап</Badge>}
                    </div>
                    <span className="font-display text-[26px]">{m.nick}</span>
                    <span className="text-[13px] text-text-3">{m.fullName}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {["roster", "trophies"].includes(tab) && (
          <section className="flex flex-col gap-6" aria-labelledby="trophies-h">
            <div className="flex items-end justify-between">
              <h2 id="trophies-h" className="font-display text-[44px]">
                Трофеи
              </h2>
              <Link href={`${base}?tab=trophies`} className="btn-text text-[14px] hover:text-accent-hover">
                Все достижения
              </Link>
            </div>
            <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
              {t.trophies.map((tr) => (
                <article key={tr.title} className={cn("flex flex-col gap-3 border bg-elev-1 p-5", tr.tone === "gold" ? "border-gold" : "border-line-strong")}>
                  <Trophy size={24} strokeWidth={1.5} className={tr.tone === "gold" ? "text-gold" : "text-text-2"} aria-hidden />
                  <h3 className="t-h3">{tr.title}</h3>
                  <span className={cn("mono text-[10px] tracking-[0.14em] uppercase", tr.tone === "gold" ? "text-gold" : "text-text-3")}>{tr.meta}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {["roster", "tournaments", "matches", "stats"].includes(tab) && (
          <div className="grid gap-6 desk:grid-cols-[1fr_420px]">
            <Card>
              <CardHeader title="История выступлений" />
              <HistoryTable rows={t.history} withTeam={false} />
            </Card>
            <Card>
              <CardHeader title="Ближайшие матчи" />
              {t.upcoming.map((u) => (
                <div key={u.title} className="flex gap-6 border-b border-line px-6 py-4 last:border-b-0">
                  <span className={cn("mono text-[12px]", u.date === "27.09" ? "text-gold" : "text-text-2")}>{u.date}</span>
                  <span className="flex flex-col gap-1">
                    <span className="font-semibold">{u.title}</span>
                    <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{u.meta}</span>
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Container>
    </>
  );
}
