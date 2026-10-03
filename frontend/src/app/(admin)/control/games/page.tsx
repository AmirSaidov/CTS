import { api } from "@/shared/api/endpoints";
import { GamesScreen } from "@/features/control/games";

export const metadata = { title: "Игры и форматы" };

export default async function ControlGamesPage() {
  return <GamesScreen initial={await api.games()} />;
}
