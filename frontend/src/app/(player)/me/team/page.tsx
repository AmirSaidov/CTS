import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/misc";
import { TeamScreen } from "@/features/player/team-screen";

export const metadata = { title: "Моя команда" };

export default async function MyTeamPage() {
  const user = await getSession();
  const team = user?.team ? await api.myTeam() : null;
  if (!team)
    return (
      <div className="flex flex-col gap-8">
        <PageHeader eyebrow="Кабинет игрока // Команда" title="Моя команда" />
        <EmptyState kind="team" />
      </div>
    );
  return <TeamScreen team={team} />;
}
