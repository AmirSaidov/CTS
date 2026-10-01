import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/shared/api/endpoints";
import type { RankingRow } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { fmtDate, num } from "@/shared/lib/format";
import { CornerMarkers, type CornerTone } from "@/shared/ui/card";
import { Container, PublicHero } from "@/shared/ui/page";
import { TeamLogo } from "@/shared/ui/misc";
import { Pagination } from "@/shared/ui/pagination";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { RankingFilters } from "@/features/rankings/filters";

export const metadata: Metadata = { title: "Рейтинг команд и игроков", description: "Рейтинг CTS: очки за места на турнирах, винрейт и динамика за неделю.", alternates: { canonical: "/rankings" } };

type SP = { kind?: "teams" | "players"; game?: string; city?: string; page?: string };

export default async function RankingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const kind = sp.kind ?? "teams";
  const data = await api.rankings({ kind, game: sp.game ?? "valorant", city: sp.city, page: Number(sp.page ?? 1) });
  const [first, second, third] = data.results;
  const link = (patch: Partial<SP>) => `/rankings?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <>
      <PublicHero eyebrow="[ Рейтинг ] // Сезон 2026" title="Рейтинг" aside="Очки начисляются за места на турнирах CTS. Обновляется после каждого завершённого турнира.">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Что показать" active={kind} items={[{ key: "teams", label: "Команды", href: link({ kind: "teams", page: undefined }) }, { key: "players", label: "Игроки", href: link({ kind: "players", page: undefined }) }]} />
            <RankingFilters />
          </div>
          <span className="mono-label">Обновлено {fmtDate(data.updatedAt)}</span>
        </div>
      </PublicHero>
      <Container className="flex flex-col gap-10 pb-24">
        {/* Пьедестал: #1 по центру и выше (золото), #3 — бронза */}
        <ol className="grid items-end gap-4 desk:grid-cols-3 desk:gap-4">
          {[second, first, third].filter(Boolean).map((r) => (
            <Podium key={r.team.slug} r={r} />
          ))}
        </ol>
        <section className="border border-line">
          <Table minWidth={760} label="Таблица рейтинга">
            <THead>
              <Th className="w-[120px]">#</Th>
              <Th sticky>Команда</Th>
              <Th align="right">Турниров</Th>
              <Th align="right">Винрейт</Th>
              <Th align="right">Δ за неделю</Th>
              <Th align="right">Очки</Th>
            </THead>
            <tbody>
              {data.results.map((r) => (
                <Tr key={r.team.slug}>
                  <Td className={cn("font-display text-[24px]", r.pos === 1 && "text-gold")}>{String(r.pos).padStart(2, "0")}</Td>
                  <Td sticky>
                    <Link href={`/t/${r.team.slug}`} className="flex items-center gap-3 hover:text-accent-hover">
                      <TeamLogo tag={r.team.tag} size={32} />
                      <span className="flex flex-col">
                        <span className="font-semibold">{r.team.name}</span>
                        <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">Valorant · {r.city}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td align="right" className="mono">{r.tournaments}</Td>
                  <Td align="right" className="mono">{r.winrate}%</Td>
                  <Td align="right" className={cn("mono", r.delta > 0 ? "text-success-text" : r.delta < 0 ? "text-danger" : "text-text-3")}>
                    {r.delta > 0 ? `+${r.delta}` : r.delta < 0 ? `−${-r.delta}` : "0"}
                    <span className="sr-only">{r.delta > 0 ? " вверх" : r.delta < 0 ? " вниз" : " без изменений"}</span>
                  </Td>
                  <Td align="right" className="font-display text-[24px]">{num(r.points)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </section>
        <Pagination page={data.page} pages={data.pages} hrefFor={(p) => link({ page: String(p) })} />
      </Container>
    </>
  );
}

function Podium({ r }: { r: RankingRow }) {
  const tone: CornerTone = r.pos === 1 ? "gold" : r.pos === 3 ? "bronze" : "silver";
  return (
    <li className={cn("relative flex flex-col items-center gap-5 border bg-elev-1 px-6 text-center", r.pos === 1 ? "order-first border-gold py-14 desk:order-none" : r.pos === 3 ? "border-bronze py-10" : "border-line-strong py-10")}>
      <CornerMarkers tone={tone} />
      <span className={cn("font-display text-[64px] leading-none", r.pos === 1 ? "text-gold" : r.pos === 3 ? "text-bronze" : "text-text-2")}>#{r.pos}</span>
      <TeamLogo tag={r.team.tag} size={72} />
      <Link href={`/t/${r.team.slug}`} className="font-display text-[34px] hover:text-accent-hover">
        {r.team.name}
      </Link>
      <span className="mono-label">{num(r.points)} pts</span>
    </li>
  );
}
