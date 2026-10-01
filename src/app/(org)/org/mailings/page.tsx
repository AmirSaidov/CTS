import { redirect } from "next/navigation";
import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { can } from "@/shared/lib/permissions";
import { MailingsScreen } from "@/features/org/crm/mailings";

export const metadata = { title: "Рассылки" };

export default async function MailingsPage() {
  if (!can(await getSession(), "mailings.send")) redirect("/org");
  const list = await api.mailings();
  return <MailingsScreen initial={list} />;
}
