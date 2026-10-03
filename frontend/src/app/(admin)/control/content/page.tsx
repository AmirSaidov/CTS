import { api } from "@/shared/api/endpoints";
import { ContentScreen } from "@/features/control/content";

export const metadata = { title: "Новости и контент" };

export default async function ControlContentPage() {
  return <ContentScreen initial={await api.adminNews()} />;
}
