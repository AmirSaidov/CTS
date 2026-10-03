import { redirect } from "next/navigation";
import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { can } from "@/shared/lib/permissions";
import { StaffScreen } from "@/features/org/crm/staff";

export const metadata = { title: "Команда организаторов" };

export default async function StaffPage() {
  if (!can(await getSession(), "staff.manage")) redirect("/org");
  return <StaffScreen initial={await api.staff()} />;
}
