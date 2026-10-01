import { Suspense } from "react";
import { api } from "@/shared/api/endpoints";
import { MatchesScreen, type MyMatches } from "@/features/player/matches-screen";

export const metadata = { title: "Мои матчи" };

export default async function MyMatchesPage() {
  const data = (await api.myMatches()) as unknown as MyMatches;
  return (
    <Suspense>
      <MatchesScreen data={data} />
    </Suspense>
  );
}
