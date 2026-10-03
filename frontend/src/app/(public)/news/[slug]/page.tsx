import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { RUBRICS } from "@/shared/lib/labels";
import { fmtDate, fmtDayTime } from "@/shared/lib/format";
import { sanitize } from "@/shared/lib/sanitize";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { Container } from "@/shared/ui/page";
import { Placeholder } from "@/shared/ui/misc";
import { ShareButtons } from "@/features/news/share";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await api.article(slug).catch(() => null);
  if (!a) return { title: "Статья не найдена" };
  return { title: a.title, description: a.lead, alternates: { canonical: `/news/${slug}` }, openGraph: { type: "article", title: a.title, description: a.lead, publishedTime: a.date } };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = await orNotFound(api.article(slug));
  const [related, more] = await Promise.all([a.relatedTournament ? api.tournament(a.relatedTournament).catch(() => null) : null, api.news({})]);
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: a.title, datePublished: a.date, author: { "@type": "Organization", name: a.author }, publisher: { "@type": "Organization", name: "CTS" } };

  return (
    <article className="glow [--glow-x:90%] [--glow-y:0%]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="flex flex-col gap-8 pt-12 pb-24">
        <Link href="/news" className="mono flex items-center gap-2 text-[11px] tracking-[0.16em] text-text-2 uppercase hover:text-text">
          <ArrowLeft size={14} aria-hidden /> Все новости
        </Link>
        <div className="flex items-center gap-3">
          <Badge tone="muted">{RUBRICS[a.rubric]}</Badge>
          <span className="mono-label">
            {fmtDate(a.date)} · {a.readMinutes} мин чтения
          </span>
        </div>
        <h1 className="font-display max-w-[1000px] text-[clamp(40px,5.6vw,80px)] leading-[0.95]">{a.title}</h1>
        <Placeholder label="Обложка статьи 21:9" aspect="21 / 9" className="border border-line" />
        <div className="mt-6 grid gap-12 desk:grid-cols-[1fr_400px]">
          <div className="prose-cts max-w-[720px]" dangerouslySetInnerHTML={{ __html: sanitize(a.body ?? "") }} />
          <aside className="flex flex-col gap-6">
            {related && (
              <Card tone="raised" corners="accent" cornersOnly="tl" padded className="flex flex-col gap-3">
                <span className="mono-label">Турнир</span>
                <h2 className="t-h2">{related.name}</h2>
                <span className="text-[14px] text-text-2">Гранд-финал {fmtDayTime(related.finalAt)}</span>
                <Button variant="primary" href={`/tournaments/${related.slug}`} block className="mt-2">
                  Открыть турнир
                </Button>
              </Card>
            )}
            <Card>
              <CardHeader title="Читайте также" />
              {more.results
                .filter((n) => n.slug !== a.slug)
                .slice(0, 3)
                .map((n) => (
                  <Link key={n.slug} href={`/news/${n.slug}`} className="flex flex-col gap-1.5 border-b border-line px-6 py-4 last:border-b-0 hover:bg-elev-1">
                    <span className="text-[15px] font-semibold">{n.title}</span>
                    <span className="mono-label">{fmtDate(n.date)}</span>
                  </Link>
                ))}
            </Card>
            <ShareButtons title={a.title} />
          </aside>
        </div>
      </Container>
    </article>
  );
}
