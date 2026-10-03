import { api } from "@/shared/api/endpoints";
import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/misc";
import { CreateTournamentButton } from "@/shared/layouts/cabinet-shell";
import { OrgTournamentsTable } from "@/features/org/tournaments-table";

export const metadata = { title: "Турниры" };

/** Отдельного экрана в макете нет — таблица с дашборда на всю ширину */
export default async function OrgTournamentsPage() {
  const list = await api.orgTournaments("all");
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Организатор // Турниры" title="Турниры" sub="Все турниры организации" actions={<CreateTournamentButton size="md" />} />
      <Card>
        <OrgTournamentsTable initial={list} title="Все турниры" />
      </Card>
    </div>
  );
}
