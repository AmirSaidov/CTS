import type { BracketFormat, GameSlug, MatchStatus, TournamentStatus } from "@/shared/api/types";

/* Подписи статусов/форматов. TODO(i18n): перенести в messages/*.json, когда появятся KY/EN. */

export const GAME_NAMES: Record<GameSlug, string> = {
  valorant: "Valorant",
  cs2: "CS2",
  dota2: "Dota 2",
  mlbb: "Mobile Legends",
  pubgm: "PUBG Mobile",
  eafc: "EA FC",
};

export const FORMAT_LABELS: Record<BracketFormat, string> = {
  single: "Single Elim",
  double: "Double Elim",
  groups: "Группы + плей-офф",
  swiss: "Швейцарка",
  league: "Лига",
};

export type Tone = "neutral" | "accent" | "gold" | "bronze" | "violet" | "violet-solid" | "success" | "danger" | "muted";

export const TOURNAMENT_STATUS: Record<TournamentStatus, { label: string; tone: Tone; dot?: boolean }> = {
  draft: { label: "Черновик", tone: "muted" },
  registration: { label: "Регистрация", tone: "neutral" },
  groups: { label: "Групповой этап", tone: "violet-solid" },
  running: { label: "Идёт", tone: "accent", dot: true },
  final: { label: "Гранд-финал", tone: "gold" },
  finished: { label: "Завершён", tone: "muted" },
};

export const MATCH_STATUS: Record<MatchStatus, { label: string; tone: Tone; dot?: boolean }> = {
  tbd: { label: "Ожидает", tone: "muted" },
  scheduled: { label: "По расписанию", tone: "muted" },
  checkin: { label: "Чек-ин", tone: "accent", dot: true },
  live: { label: "Идёт", tone: "accent", dot: true },
  awaiting: { label: "Ждёт подтверждения", tone: "gold" },
  confirmed: { label: "Подтверждён", tone: "success" },
  dispute: { label: "Спор", tone: "accent", dot: true },
  finished: { label: "Завершён", tone: "muted" },
};

export const RUBRICS: Record<string, string> = {
  tournaments: "Турниры",
  platform: "Платформа",
  interview: "Интервью",
  guides: "Гайд",
  announce: "Анонс",
};

export const ACCOUNT_LABELS = { riot: "Riot ID", steam: "Steam", discord: "Discord", telegram: "Telegram", manual: "Вручную" } as const;
export const ACCOUNT_TAGS = { riot: "RI", steam: "ST", discord: "DC", telegram: "TG" } as const;
