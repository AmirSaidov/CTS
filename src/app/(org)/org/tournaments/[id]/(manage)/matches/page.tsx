import { api } from "@/shared/api/endpoints";
import { ResultsScreen } from "@/features/org/manage/results";

export const metadata = { title: "Результаты и споры" };

export default async function OrgMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matches = await api.orgMatches(id);
  return <ResultsScreen id={id} initial={matches} />;
}
