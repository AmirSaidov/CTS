import { redirect } from "next/navigation";
import { getSession } from "@/shared/auth/session";
import { can } from "@/shared/lib/permissions";
import { BrandingScreen } from "@/features/org/crm/branding";

export const metadata = { title: "Брендирование" };

export default async function BrandingPage() {
  if (!can(await getSession(), "staff.manage")) redirect("/org");
  return <BrandingScreen />;
}
