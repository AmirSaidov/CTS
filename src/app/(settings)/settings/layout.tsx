import type { Metadata } from "next";
import { CabinetShell } from "@/shared/layouts/cabinet-shell";

export const metadata: Metadata = { title: { default: "Настройки", template: "%s · Настройки · CTS" }, robots: { index: false } };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <CabinetShell kind="settings">{children}</CabinetShell>;
}
