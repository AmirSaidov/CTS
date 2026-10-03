import { api } from "@/shared/api/endpoints";
import { AnalyticsScreen } from "@/features/org/crm/analytics";

export const metadata = { title: "Аналитика" };

export default async function AnalyticsPage() {
  const data = await api.analytics("7d");
  return <AnalyticsScreen initial={data} />;
}
