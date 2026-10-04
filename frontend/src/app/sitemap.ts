import type { MetadataRoute } from "next";
import { api } from "@/shared/api/endpoints";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Индексируются статические страницы и турниры. Профили и новости — v2/v3. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tournaments = await api.tournaments({}, { revalidate: 3600 });
  const statics = ["", "/tournaments", "/pricing", "/legal/privacy", "/legal/terms", "/legal/rules"];
  return [
    ...statics.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "daily" as const, priority: p ? 0.7 : 1 })),
    ...tournaments.results.map((t) => ({ url: `${SITE}/tournaments/${t.slug}`, lastModified: t.startAt, changeFrequency: "hourly" as const, priority: 0.9 })),
  ];
}
