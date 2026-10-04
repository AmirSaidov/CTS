import type { Metadata } from "next";
import { CabinetShell, NextMatchWidget } from "@/shared/layouts/cabinet-shell";

export const metadata: Metadata = { title: { default: "Кабинет игрока", template: "%s · Кабинет · CTS" }, robots: { index: false } };

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CabinetShell kind="player" widget={<NextMatchWidget />}>
      {children}
    </CabinetShell>
  );
}
