import { redirect } from "next/navigation";
import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { can } from "@/shared/lib/permissions";
import { WizardProvider } from "@/features/org/wizard/context";
import { draftFrom } from "@/features/org/wizard/model";

/** Layout держит состояние мастера между шагами (layout не перемонтируется при смене [step]) */
export default async function SetupLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!can(user, "tournaments.manage")) redirect(`/org/tournaments/${id}/applications`);
  const t = await api.orgTournament(id);
  return <WizardProvider initial={draftFrom(t)}>{children}</WizardProvider>;
}
