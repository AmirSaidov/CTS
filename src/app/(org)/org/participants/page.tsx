import { api } from "@/shared/api/endpoints";
import { ParticipantsScreen } from "@/features/org/crm/participants";

export const metadata = { title: "База участников" };

export default async function ParticipantsPage() {
  const list = await api.participants({ kind: "teams" });
  return <ParticipantsScreen initial={list} />;
}
