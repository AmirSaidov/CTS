import { api } from "@/shared/api/endpoints";
import { UsersScreen } from "@/features/control/users";

export const metadata = { title: "Пользователи" };

export default async function ControlUsersPage() {
  return <UsersScreen initial={await api.adminUsers({})} />;
}
