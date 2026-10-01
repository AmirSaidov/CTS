import { CheckinScreen } from "@/features/org/manage/checkin";

export const metadata = { title: "Чек-ин" };

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CheckinScreen id={id} />;
}
