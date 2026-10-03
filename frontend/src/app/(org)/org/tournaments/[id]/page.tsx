import { redirect } from "next/navigation";

export default async function TournamentManageIndex({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/org/tournaments/${(await params).id}/applications`);
}
