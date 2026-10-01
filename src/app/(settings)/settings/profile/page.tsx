import { redirect } from "next/navigation";
import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { SecurityScreen } from "@/features/settings/security";

export const metadata = { title: "Профиль и безопасность" };

export default async function SecurityPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/settings/profile");
  return <SecurityScreen user={user} sessions={await api.sessions()} />;
}
