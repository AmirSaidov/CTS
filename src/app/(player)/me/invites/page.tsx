import { api } from "@/shared/api/endpoints";
import { PageHeader } from "@/shared/ui/misc";
import { Segmented } from "@/shared/ui/tabs";
import { InvitesScreen } from "@/features/player/invite-list";

export const metadata = { title: "Приглашения" };

export default async function InvitesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active = tab === "out" ? "out" : "in";
  const invites = await api.myInvites();
  const nIn = invites.filter((i) => i.direction === "in").length;
  const nOut = invites.filter((i) => i.direction === "out").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Кабинет игрока // Приглашения"
        title="Приглашения"
        sub="В команды, на турниры и скримы"
        actions={
          <Segmented
            label="Направление"
            active={active}
            items={[
              { key: "in", label: `Входящие · ${nIn}`, href: "/me/invites" },
              { key: "out", label: `Отправленные · ${nOut}`, href: "/me/invites?tab=out" },
            ]}
          />
        }
      />
      <InvitesScreen initial={invites} tab={active} />
    </div>
  );
}
