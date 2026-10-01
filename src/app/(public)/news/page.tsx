import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/shared/api/endpoints";
import type { NewsArticle } from "@/shared/api/types";
import { RUBRICS } from "@/shared/lib/labels";
import { fmtDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Container } from "@/shared/ui/page";
import { Eyebrow, Placeholder } from "@/shared/ui/misc";
import { Chips } from "@/shared/ui/tabs";
import { Pagination } from "@/shared/ui/pagination";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata: Metadata = { title: "Новости", description: "Турниры, обновления платформы, интервью и гайды для организаторов.", alternates: { canonical: "/news" } };

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "tournaments", label: "Турниры" },
  { key: "platform", label: "Обновления платформы" },
  { key: "interview", label: "Интервью" },
  { key: "guides", label: "Гайды для организаторов" },
];

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ rubric?: string; page?: string }> }) {
  const sp = await searchParams;
  const rubric = sp.rubric ?? "all";
  const list = await api.news({ rubric: rubric === "all" ? undefined : rubric, page: Number(sp.page ?? 1) });
  const [lead, ...rest] = list.results;
  const side = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <Container className="flex flex-col gap-10 pt-16 pb-24">
      <div className="flex flex-col gap-5">
        <Eyebrow>[ Новости ]</Eyebrow>
        <h1 className="t-display">Новости</h1>
      </div>
      <Chips active={rubric} items={FILTERS.map((f) => ({ ...f, href: f.key === "all" ? "/news" : `/news?rubric=${f.key}` }))} />
      {!lead ? (
        <EmptyState kind="search" ctaHref="/news" />
      ) : (
        <>
          <div className="grid gap-8 desk:grid-cols-[1.6fr_1fr]">
            <NewsCard n={lead} big />
            <div className="flex flex-col gap-8">
              {side.map((n) => (
                <NewsCard key={n.slug} n={n} />
              ))}
            </div>
          </div>
          {grid.length > 0 && (
            <div className="grid gap-8 tab:grid-cols-2 desk:grid-cols-3">
              {grid.map((n) => (
                <NewsCard key={n.slug} n={n} />
              ))}
            </div>
          )}
          <Pagination page={list.page} pages={list.pages} hrefFor={(p) => `/news?${new URLSearchParams({ ...(rubric !== "all" && { rubric }), page: String(p) })}`} />
        </>
      )}
    </Container>
  );
}

function NewsCard({ n, big }: { n: NewsArticle; big?: boolean }) {
  return (
    <article className="group flex flex-col gap-4">
      <Link href={`/news/${n.slug}`} tabIndex={-1} aria-hidden>
        <Placeholder label="Обложка новости" className={cn("border border-line transition-colors group-hover:border-line-strong", big ? "h-[360px]" : "h-[200px]")} />
      </Link>
      <div className="flex items-center gap-3">
        <Badge tone="muted">{RUBRICS[n.rubric]}</Badge>
        <span className="mono-label">{fmtDate(n.date)}</span>
      </div>
      <h2 className={cn("font-display leading-[1.02]", big ? "text-[clamp(32px,3.4vw,48px)]" : "text-[28px]")}>
        <Link href={`/news/${n.slug}`} className="hover:text-accent-hover">
          {n.title}
        </Link>
      </h2>
    </article>
  );
}
