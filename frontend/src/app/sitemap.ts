import type { MetadataRoute } from "next";
import { api } from "@/shared/api/endpoints";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Индексируются турниры, профили и статьи. Турниры «по ссылке» бэкенд в список не отдаёт. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, news, ranking] = await Promise.all([api.tournaments({}, { revalidate: 3600 }), api.news({}, { revalidate: 3600 }), api.rankings({ kind: "teams" }, { revalidate: 3600 })]);
  const statics = ["", "/tournaments", "/schedule", "/rankings", "/news", "/pricing", "/about", "/legal/privacy", "/legal/terms", "/legal/rules"];
  return [
    ...statics.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "daily" as const, priority: p ? 0.7 : 1 })),
    ...tournaments.results.map((t) => ({ url: `${SITE}/tournaments/${t.slug}`, lastModified: t.startAt, changeFrequency: "hourly" as const, priority: 0.9 })),
    ...news.results.map((n) => ({ url: `${SITE}/news/${n.slug}`, lastModified: n.date, priority: 0.6 })),
    ...ranking.results.map((r) => ({ url: `${SITE}/t/${r.team.slug}`, priority: 0.5 })),
  ];
}
