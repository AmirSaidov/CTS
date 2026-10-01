import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { ManageHeader } from "@/features/org/manage/manage-header";

export default async function ManageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, apps, matches] = await Promise.all([orNotFound(api.orgTournament(id)), api.applications(id), api.orgMatches(id)]);
  const counts = { applications: apps.filter((a) => a.status === "pending").length, matches: matches.filter((m) => m.status === "dispute").length };
  return (
    <div className="flex flex-col gap-8">
      <ManageHeader t={t} counts={counts} />
      {children}
    </div>
  );
}
