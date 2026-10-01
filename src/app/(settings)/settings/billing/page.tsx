import { api } from "@/shared/api/endpoints";
import { getSession } from "@/shared/auth/session";
import { can } from "@/shared/lib/permissions";
import { PageHeader } from "@/shared/ui/misc";
import { Button } from "@/shared/ui/button";
import { BillingScreen } from "@/features/settings/billing";

export const metadata = { title: "Подписка и оплата" };

export default async function BillingPage() {
  const user = await getSession();
  if (!user?.org || !can(user, "billing.manage"))
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Настройки // Биллинг" title="Подписка и оплата" />
        <p className="max-w-[560px] text-text-2">Подпиской управляет владелец организации. У игроков CTS бесплатен — платят только организаторы турниров.</p>
        <Button href="/pricing" className="self-start">
          Тарифы для организаторов
        </Button>
      </div>
    );
  const { history } = await api.billing();
  return <BillingScreen user={user} history={[...history]} />;
}
