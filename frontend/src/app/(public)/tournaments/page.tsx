import type { Metadata } from "next";
import { Suspense } from "react";
import { api, type TournamentFilters } from "@/shared/api/endpoints";
import { Container, PublicHero } from "@/shared/ui/page";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { TournamentCard } from "@/features/tournament/tournament-card";
import { CatalogFilters } from "@/features/tournament/catalog-filters";

export const metadata: Metadata = {
  title: "Турниры",
  description: "Каталог киберспортивных турниров: Valorant, CS2, Dota 2 и другие. Фильтр по игре, городу и статусу.",
  alternates: { canonical: "/tournaments" },
};

type SP = Record<string, string | undefined>;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters: TournamentFilters = {
    search: sp.search,
    game: sp.game,
    city: sp.city,
    status: sp.status as TournamentFilters["status"],
    ordering: sp.ordering as TournamentFilters["ordering"],
    page: Number(sp.page ?? 1),
  };
  const [list, games] = await Promise.all([api.tournaments(filters), api.games()]);

  const hrefFor = (p: number) => {
    const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    q.set("page", String(p));
    return `/tournaments?${q}`;
  };

  return (
    <>
      <PublicHero eyebrow="[ Каталог ] // Сезон 2026" title="Турниры" aside="Найдите турнир по игре, городу и статусу. Подайте заявку командой в пару кликов.">
        <Suspense>
          <CatalogFilters games={games.map((g) => ({ value: g.slug, label: g.name }))} cities={["Бишкек", "Ош", "Каракол", "Токмок", "Нарын"]} found={list.count} />
        </Suspense>
      </PublicHero>
      <Container className="pb-24">
        {list.results.length === 0 ? (
          <EmptyState kind="search" ctaHref="/tournaments" />
        ) : (
          <>
            <div className="grid gap-6 tab:grid-cols-2 desk:grid-cols-3">
              {list.results.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
            <Pagination className="mt-12" page={list.page} pages={list.pages} hrefFor={hrefFor} />
          </>
        )}
      </Container>
    </>
  );
}
