import { api } from "@/shared/api/endpoints";
import { ApplicationsScreen } from "@/features/org/manage/applications";

export const metadata = { title: "Заявки" };

export default async function ApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [apps, t] = await Promise.all([api.applications(id), api.orgTournament(id)]);
  return <ApplicationsScreen id={id} initial={apps} max={t.teams.max} />;
}
