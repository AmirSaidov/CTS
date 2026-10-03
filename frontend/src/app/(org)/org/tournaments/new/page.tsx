import { redirect } from "next/navigation";
import { getSession } from "@/shared/auth/session";
import { can } from "@/shared/lib/permissions";
import { WizardProvider } from "@/features/org/wizard/context";
import { WizardScreen } from "@/features/org/wizard/wizard";
import { EMPTY_DRAFT } from "@/features/org/wizard/model";

export const metadata = { title: "Новый турнир" };

/** Шаг 1 без id: черновик создаётся на сервере при переходе на шаг 2 */
export default async function NewTournamentPage() {
  const user = await getSession();
  if (!can(user, "tournaments.manage")) redirect("/org");
  return (
    <WizardProvider initial={EMPTY_DRAFT}>
      <WizardScreen step={1} />
    </WizardProvider>
  );
}
