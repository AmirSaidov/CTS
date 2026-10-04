import type { Metadata } from "next";
import { CabinetShell, CreateTournamentButton, PlanWidget } from "@/shared/layouts/cabinet-shell";

export const metadata: Metadata = { title: { default: "Панель организатора", template: "%s · Организатор · CTS" }, robots: { index: false } };

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <CabinetShell kind="org" widget={<PlanWidget />} topAction={<CreateTournamentButton />} topActionOn="/org">
      {children}
    </CabinetShell>
  );
}
