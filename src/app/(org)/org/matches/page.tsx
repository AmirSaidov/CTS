import { redirect } from "next/navigation";
import { api } from "@/shared/api/endpoints";

/** Пункт «Матчи» в сайдбаре: отдельного экрана нет — ведём на результаты ближайшего активного турнира (экран 36) */
export default async function OrgMatchesIndex() {
  const list = await api.orgTournaments("active");
  const t = list.find((x) => x.status === "registration" || x.status === "running") ?? list[0];
  redirect(t ? `/org/tournaments/${t.id}/matches` : "/org/tournaments");
}
