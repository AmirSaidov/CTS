import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { Container } from "@/shared/ui/page";
import { Eyebrow, Placeholder, TeamLogo } from "@/shared/ui/misc";
import { Tabs } from "@/shared/ui/tabs";
import { BlockBoundary } from "@/shared/ui/feedback";
import { FORMAT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { fmtDay, tzLabel } from "@/shared/lib/format";
import { LiveBracket } from "@/features/bracket/live-bracket";
import { LiveCounter, TournamentSchedule } from "@/features/tournament/live-parts";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await api.tournament(slug).catch(() => null);
  if (!t) return { title: "Турнир не найден" };
  return {
    title: t.name,
    description: `${GAME_NAMES[t.game]} · ${FORMAT_LABELS[t.format]} · ${t.teams.max} команд · ${t.city}. ${t.description ?? ""}`.trim(),
    alternates: { canonical: `/tournaments/${slug}` },
    openGraph: { title: t.name, type: "website" },
    // турнир «по ссылке» — доступен по прямому URL, но не индексируется
    robots: t.visibility === "link" ? { index: false, follow: false } : undefined,
  };
}

const TABS = [
  { key: "bracket", label: "Сетка" },
  { key: "schedule", label: "Расписание" },
  { key: "teams", label: "Команды" },
  { key: "results", label: "Результаты" },
  { key: "rules", label: "Правила" },
];

export default async function TournamentPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = "bracket" } = await searchParams;
  const [t, bracket, schedule] = await Promise.all([orNotFound(api.tournament(slug)), api.bracket(slug), api.tournamentSchedule(slug)]);
  const teams = [...new Map(bracket.stages.flatMap((s) => s.matches).flatMap((m) => [m.a.team, m.b.team]).filter(Boolean).map((x) => [x!.slug, x!])).values()];
  const branded = t.branding;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: t.name,
    startDate: t.startAt,
    endDate: t.finalAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: t.venue === "online" ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/MixedEventAttendanceMode",
    location: { "@type": "Place", name: t.venueLabel, address: t.city },
    organizer: { "@type": "Organization", name: t.organizer.name },
    sport: GAME_NAMES[t.game],
  };

  return (
    <div style={branded ? ({ "--accent": branded.accent } as React.CSSProperties) : undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ───── Шапка ───── */}
      <section className="glow border-b border-line [--glow-x:85%] [--glow-y:20%]">
        <Container className="grid gap-10 pt-12 pb-10 desk:grid-cols-[1fr_470px] desk:items-start">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-2">
              <Badge>{GAME_NAMES[t.game]} · 5v5</Badge>
              <Badge>{FORMAT_LABELS[t.format]}</Badge>
              {t.status === "final" ? <Badge tone="gold">Гранд-финал {fmtDay(t.finalAt)}</Badge> : t.stageLabel && <Badge tone="accent">{t.stageLabel}</Badge>}
            </div>
            <h1 className="font-display text-[clamp(56px,8vw,112px)] leading-[0.92] break-words">{t.name}</h1>
            <dl className="flex flex-wrap gap-x-12 gap-y-5">
              {[
                ["Призовой фонд", t.prize],
                ["Команд", t.teams.max],
                ["Организатор", t.organizer.name.replace(/\]\s.*$/, "]").replace("[Клуб]", "[Организатор]")],
                ["Площадка", t.venueLabel],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-2">
                  <dt className="mono-label">{k}</dt>
                  <dd className="font-display text-[26px] normal-case">{v}</dd>
                </div>
              ))}
            </dl>
            {t.status === "registration" && (
              <div className="flex flex-wrap gap-3">
                <Button href={`/tournaments/${slug}/apply`} variant="primary" size="lg">
                  Подать заявку
                </Button>
                <Button href={`/tournaments/${slug}?tab=rules`} size="lg">
                  Правила
                </Button>
              </div>
            )}
          </div>
          <div className="relative">
            <CornerMarkers tone="silver" only="tl-br" offset={9} />
            <Placeholder label="Арт турнира 16:9" aspect="16 / 9" className="border border-line" />
          </div>
        </Container>
        <Container>
          <div className="flex items-end justify-between gap-6">
            <Tabs className="flex-1 border-b-0" active={tab} items={TABS.map((x) => ({ ...x, href: `/tournaments/${slug}?tab=${x.key}` }))} />
            <div className="hidden pb-3.5 tab:block">
              <LiveCounter slug={slug} initial={bracket} />
            </div>
          </div>
        </Container>
      </section>

      {tab === "bracket" && (
        <>
          <Container as="section" className="py-14">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-3">
                <Eyebrow tone="muted">Stage 02 // Плей-офф</Eyebrow>
                <h2 className="font-display text-[clamp(36px,4vw,56px)]">Турнирная сетка</h2>
              </div>
              {bracket.completedStages?.map((s) => (
                <Badge key={s.title} tone="violet-solid">
                  {s.title} — {s.label}
                </Badge>
              ))}
            </div>
            <BlockBoundary title="Сетка не загрузилась">
              <LiveBracket slug={slug} initial={bracket} />
            </BlockBoundary>
          </Container>
          <section className="border-t border-line">
            <Container className="grid gap-10 py-14 desk:grid-cols-[300px_1fr]">
              <div className="flex flex-col gap-4">
                <Eyebrow tone="muted">Schedule // Ближайшие</Eyebrow>
                <h2 className="font-display text-[clamp(36px,4vw,56px)]">Расписание</h2>
                <p className="text-[15px] text-text-2">
                  Время указано по Бишкеку ({tzLabel(t.timezone)}). Капитаны получают напоминание за час до матча.
                </p>
              </div>
              <TournamentSchedule slug={slug} initial={schedule} limit={4} />
            </Container>
          </section>
        </>
      )}

      {tab === "schedule" && (
        <Container as="section" className="flex flex-col gap-6 py-14">
          <p className="mono-label">Время — {tzLabel(t.timezone)} (часовой пояс турнира). В кабинете время показывается в вашем поясе.</p>
          <TournamentSchedule slug={slug} initial={schedule} />
        </Container>
      )}

      {tab === "teams" && (
        <Container as="section" className="py-14">
          <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
            {teams.map((team) => (
              <Link key={team.slug} href={`/t/${team.slug}`} className="flex items-center gap-4 border border-line bg-elev-1 p-5 transition-colors hover:border-line-strong">
                <TeamLogo tag={team.tag} size={48} />
                <span className="font-display text-[22px]">{team.name}</span>
              </Link>
            ))}
          </div>
        </Container>
      )}

      {tab === "results" && (
        <Container as="section" className="py-14">
          <TournamentSchedule slug={slug} initial={schedule.filter((m) => ["finished", "confirmed"].includes(m.status))} />
        </Container>
      )}

      {tab === "rules" && (
        <Container as="section" className="grid gap-10 py-14 desk:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-8">
            {(t.rules ?? [{ title: "Регламент", body: "Регламент опубликует организатор." }]).map((r) => (
              <article key={r.title} className="flex flex-col gap-3">
                <h2 className="t-h2">{r.title}</h2>
                <p className="max-w-[720px] text-[16px] text-text-2">{r.body}</p>
              </article>
            ))}
          </div>
          {t.prizes && (
            <aside className="flex flex-col border border-line">
              <h2 className="t-h3 border-b border-line px-6 py-4">Призовой фонд</h2>
              {t.prizes.map((p) => (
                <div key={p.place} className="flex items-center justify-between border-b border-line px-6 py-4 last:border-b-0">
                  <span className={p.place === 1 ? "font-display text-[22px] text-gold" : p.place === 3 ? "font-display text-[22px] text-bronze" : "font-display text-[22px]"}>{p.place} место</span>
                  <span className="font-semibold">{p.amount}</span>
                </div>
              ))}
            </aside>
          )}
        </Container>
      )}

      {branded && (
        <Container className="flex items-center justify-between border-t border-line py-6">
          <div className="flex items-center gap-3">
            <span className="mono-label">Спонсоры</span>
            {branded.sponsors.map((s) => (
              <Placeholder key={s} label="лого" className="h-10 w-24 border border-line" />
            ))}
          </div>
          <span className="mono-label">Powered by CTS</span>
        </Container>
      )}
    </div>
  );
}
