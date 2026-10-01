import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { Badge } from "@/shared/ui/badge";
import { Container } from "@/shared/ui/page";
import { MatchLive } from "@/features/match/match-live";

type Props = { params: Promise<{ slug: string; code: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, code } = await params;
  const m = await api.match(slug, code).catch(() => null);
  if (!m) return { title: "Матч не найден" };
  const title = `${m.a.team?.name ?? "TBD"} vs ${m.b.team?.name ?? "TBD"} · ${m.code}`;
  return { title, description: `${m.tournamentName} · ${m.stage} · BO${m.bo}`, alternates: { canonical: `/tournaments/${slug}/matches/${code}` }, openGraph: { title } };
}

export default async function MatchPage({ params, searchParams }: Props) {
  const { slug, code } = await params;
  const { tab } = await searchParams;
  const [m, stats] = await Promise.all([orNotFound(api.match(slug, code)), api.matchStats(slug, code)]);
  const live = m.status === "live";

  return (
    <Container className="flex flex-col gap-8 pt-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Хлебные крошки" className="mono flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase">
          <Link href={`/tournaments/${slug}`} className="flex items-center gap-2 text-text hover:text-accent-hover">
            <ArrowLeft size={14} aria-hidden /> {m.tournamentName}
          </Link>
          <span className="text-text-4">/</span>
          <span className="text-text-3">Плей-офф</span>
          <span className="text-text-4">/</span>
          <span className="text-text-3" aria-current="page">
            {m.code}
          </span>
        </nav>
        <div className="flex flex-wrap gap-2">
          {live && (
            <Badge tone="accent" dot>
              Live · Карта {m.currentMap}
            </Badge>
          )}
          <Badge>BO{m.bo}</Badge>
          <Badge>{m.stage}</Badge>
        </div>
      </div>
      <MatchLive slug={slug} initial={m} stats={stats} initialTab={tab} />
    </Container>
  );
}
