import { api } from "@/shared/api/endpoints";
import { NotificationsScreen } from "@/features/notifications/notifications-screen";

export const metadata = { title: "Уведомления" };

export default async function OrgNotificationsPage() {
  const list = await api.myNotifications();
  return <NotificationsScreen initial={list} audience="org" />;
}
