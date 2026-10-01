import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/shared/auth/session";
import { CabinetShell, SuperadminWidget } from "@/shared/layouts/cabinet-shell";

export const metadata: Metadata = { title: { default: "Админка", template: "%s · Админка · CTS" }, robots: { index: false, follow: false } };

/** /control, а не /admin — чтобы не конфликтовать со встроенной админкой Django */
export default async function ControlLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user?.isPlatformAdmin) notFound();
  return (
    <CabinetShell kind="control" widget={<SuperadminWidget />}>
      {children}
    </CabinetShell>
  );
}
