import { api } from "@/shared/api/endpoints";
import { SeedingScreen } from "@/features/org/manage/seeding";

export const metadata = { title: "Сетка и посев" };

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await api.orgTournament(id);
  const [bracket, ranking] = await Promise.all([api.bracket(t.slug), api.rankings({ kind: "teams", game: t.game })]);
  const seeds = bracket.seeds ?? bracket.stages[0]?.matches.flatMap((m) => [m.a.team, m.b.team]).filter((x) => x !== null) ?? [];
  const rankOrder = ranking.results.map((r) => r.team.slug);
  return <SeedingScreen id={id} initialSeeds={seeds} initialBracket={bracket} rankOrder={rankOrder} />;
}
