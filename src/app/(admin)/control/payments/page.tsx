import { api } from "@/shared/api/endpoints";
import { PaymentsScreen } from "@/features/control/payments";

export const metadata = { title: "Подписки и платежи" };

export default async function ControlPaymentsPage() {
  return <PaymentsScreen initial={await api.payments()} />;
}
