import { api } from "@/shared/api/endpoints";
import { SlotsScreen } from "@/features/org/manage/slots";

export const metadata = { title: "Слоты и площадки" };

export default async function SlotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await api.slots(id, 1);
  return <SlotsScreen id={id} venues={[...d.venues]} slots={[...d.slots]} unscheduled={[...d.unscheduled]} date={d.date} />;
}
