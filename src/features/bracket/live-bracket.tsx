"use client";

import type { Bracket } from "@/shared/api/types";
import { useLiveBracket } from "@/features/live/hooks";
import { BracketView } from "./bracket-view";

/** Сетка поверх SSR-данных с обновлением по WebSocket (канал tournament:{slug}) */
export function LiveBracket({ slug, initial }: { slug: string; initial: Bracket }) {
  const { data } = useLiveBracket(slug, initial);
  return <BracketView bracket={data} matchHref={(code) => `/tournaments/${slug}/matches/${code}`} />;
}
