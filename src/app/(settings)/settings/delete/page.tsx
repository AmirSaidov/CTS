import { redirect } from "next/navigation";
import { getSession } from "@/shared/auth/session";
import { DeleteAccount } from "@/features/settings/delete-account";

export const metadata = { title: "Удаление аккаунта" };

export default async function DeletePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return <DeleteAccount user={user} />;
}
