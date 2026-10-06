/*
 * Доменные типы. Временно написаны руками — после появления OpenAPI-схемы
 * (drf-spectacular) заменяются сгенерированными: `npm run api:types`.
 * Имена полей держим в camelCase; адаптер к snake_case — в client.ts.
 */

export type ISODate = string;

export type GameSlug = "valorant" | "cs2" | "dota2" | "mlbb" | "pubgm" | "eafc";
export type BracketFormat = "single" | "double" | "groups" | "swiss" | "league";
export type AccountKind = "riot" | "steam" | "discord" | "telegram";
export type Venue = "online" | "lan" | "mixed";
export type Plan = "free" | "pro" | "league";
export type OrgRole = "owner" | "admin" | "judge" | "moderator";

export interface Game {
  slug: GameSlug;
  name: string;
  short: string;
  publisher: string;
  teamSize: number;
  roster: { main: number; subs: number };
  accountCheck: AccountKind | "manual";
  formats: BracketFormat[];
  status: "active" | "beta";
}

export type TournamentStatus =
  | "draft"
  | "registration"
  | "groups"
  | "running"
  | "final"
  | "finished";

export interface OrgRef {
  slug: string;
  name: string;
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  game: GameSlug;
  format: BracketFormat;
  matchFormat: string; // «BO1 · финал BO3»
  teams: { current: number; max: number };
  startAt: ISODate;
  finalAt: ISODate;
  registrationClosesAt?: ISODate;
  prize: string;
  fee?: string;
  organizer: OrgRef;
  venue: Venue;
  venueLabel: string;
  city: string;
  status: TournamentStatus;
  stageLabel?: string;
  timezone: string;
  description?: string;
  liveMatches?: number;
  tier?: "major" | "league" | "local" | "open";
  visibility?: "public" | "link";
  rules?: { title: string; body: string }[];
  prizes?: { place: number; amount: string }[];
  branding?: { accent: string; logoUrl?: string; sponsors: string[] };
}

export interface TeamRef {
  slug: string;
  name: string;
  tag: string; // инициалы для логотипа-заглушки
}

export type MatchStatus =
  | "tbd"
  | "scheduled"
  | "checkin"
  | "live"
  | "awaiting"
  | "confirmed"
  | "dispute"
  | "finished";

export interface MatchSide {
  team: TeamRef | null; // null — «Победитель QF-01»
  placeholder?: string;
  score: number | null;
  seed?: number;
  group?: string;
}

export interface MapResult {
  name: string;
  a: number | null;
  b: number | null;
  status: "done" | "live" | "pending";
}

export interface Match {
  code: string; // QF-01
  tournamentSlug: string;
  tournamentName: string;
  stage: string; // «Полуфинал»
  stageKey: string; // qf / sf / gf / gr-b
  bo: number;
  startAt: ISODate | null;
  status: MatchStatus;
  a: MatchSide;
  b: MatchSide;
  currentMap?: number;
  maps?: MapResult[];
  nextMatch?: string;
  server?: string;
  judge?: string;
  stream?: { url: string; viewers?: number };
  venue?: string;
}

export interface BracketStage {
  key: string;
  title: string;
  bo: number;
  matches: Match[];
}

export interface Bracket {
  tournamentSlug: string;
  format: BracketFormat;
  stages: BracketStage[];
  completedStages?: { title: string; label: string }[];
  champion: TeamRef | null;
  championAt?: ISODate;
  /** посев в порядке #1…#N (для экрана 35) */
  seeds?: TeamRef[];
  updatedAt: ISODate;
}

export interface PlayerStatLine {
  nick: string;
  tag: string;
  role: string;
  k: number;
  d: number;
  a: number;
  acs: number;
  captain?: boolean;
}

export interface GameAccount {
  kind: AccountKind;
  value: string | null;
  verified: boolean;
}

export interface StatsSummary {
  tournaments: number;
  matches: number;
  wins: number;
  winrate: number;
  trophies: number;
  rank: number;
}

export interface HistoryRow {
  tournament: string;
  tournamentSlug: string;
  game: GameSlug;
  result: string;
  resultTone: "gold" | "bronze" | "violet" | "neutral";
  team: string;
  date: string;
}

export interface Player {
  nick: string;
  tag: string;
  fullName: string;
  city: string;
  team: TeamRef | null;
  role: string;
  game: GameSlug;
  captain: boolean;
  lookingForTeam: boolean;
  stats: StatsSummary;
  accounts: GameAccount[];
  about: string;
  achievements: { icon: "trophy" | "star" | "crown" | "flag"; title: string; meta: string; gold?: boolean }[];
  history: HistoryRow[];
  recentMatches: { code: string; bo: number; vs: string; score: string; map: string; kda: string; win: boolean }[];
  privacy: { showStats: boolean; showCity: boolean; invitesFromAll: boolean };
  socials: { twitch?: string; youtube?: string; telegram?: string; instagram?: string };
}

export interface TeamMember {
  nick: string;
  tag: string;
  fullName: string;
  role: string;
  status: "main" | "sub";
  captain: boolean;
  account: { kind: AccountKind; ok: boolean };
}

export interface Team extends TeamRef {
  game: GameSlug;
  city: string;
  founded: string;
  captainNick: string;
  recruiting: boolean;
  badges: string[];
  stats: StatsSummary;
  members: TeamMember[];
  maxMembers: number;
  trophies: { title: string; meta: string; tone: "gold" | "neutral" }[];
  history: HistoryRow[];
  upcoming: { date: string; title: string; meta: string }[];
}

export interface RankingRow {
  pos: number;
  team: TeamRef;
  game: GameSlug;
  city: string;
  tournaments: number;
  winrate: number;
  delta: number;
  points: number;
}

export interface NewsArticle {
  slug: string;
  title: string;
  rubric: "tournaments" | "platform" | "interview" | "guides" | "announce";
  date: ISODate;
  readMinutes: number;
  lead: string;
  author: string;
  status: "published" | "draft" | "scheduled";
  body?: string; // санитайзенный HTML из CMS
  relatedTournament?: string;
}

export interface PlanInfo {
  key: Plan;
  tier: string;
  name: string;
  tagline: string;
  priceMonth: string;
  priceYear: string;
  yearDiscount: string;
  features: string[];
  recommended?: boolean;
  cta: string;
}

export type NotificationKind = "match" | "tournament" | "team" | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  icon: "clock" | "mail" | "users" | "swords" | "check" | "trophy" | "calendar" | "alert" | "info";
  tone?: "gold" | "success";
  title: string;
  body: string;
  at: ISODate;
  read: boolean;
  action?: { label: string; href: string };
}

export interface Invite {
  id: string;
  kind: "tournament" | "scrim" | "team";
  direction: "in" | "out";
  from: TeamRef;
  title: string;
  body: string;
  meta: string;
  at: ISODate;
  leavesTeam?: string;
}

export interface Application {
  id: string;
  team: TeamRef;
  captain: string;
  roster: { main: number; subs: number };
  check: "ok" | "missing_account" | "incomplete";
  checkLabel: string;
  submittedAt: ISODate;
  status: "pending" | "approved" | "rejected";
  members: { nick: string; account: boolean }[];
}

export interface CheckinRow {
  team: TeamRef;
  ready: number;
  total: number;
  status: "ready" | "partial" | "none";
}

export interface Checkin {
  stage: string;
  closesAt: ISODate;
  rows: CheckinRow[];
}

export interface Dispute {
  matchCode: string;
  openedAt: ISODate;
  claims: { team: TeamRef; score: string; screenshot?: string }[];
  comment: string;
  commentBy: string;
}

export interface ScheduleSlot {
  matchCode: string | null;
  title: string;
  venue: string;
  start: string; // HH:mm
  end: string;
  bo?: number;
  kind: "match" | "show" | "stream" | "reserve" | "free";
}

export interface OrgDashboard {
  season: string;
  stats: { active: number; activeNote: string; teams: number; teamsDelta: number; matchesToday: number; nextAt: string; pending: number };
  tournaments: (Pick<Tournament, "id" | "slug" | "name" | "game" | "format" | "teams" | "status" | "startAt">)[];
  todayMatches: Match[];
  attention: { label: string; href: string }[];
}

export interface Participant {
  team: TeamRef;
  game: GameSlug;
  city: string;
  tournaments: number;
  winrate: number;
  label?: { text: string; tone: "gold" | "violet" | "neutral" };
  last: string;
  captain: string;
  captainContact: string;
  best: string;
  noShows: number;
  disputes: number;
  since: string;
  note: string;
}

export interface Mailing {
  id: string;
  title: string;
  audience: string;
  status: "sent" | "scheduled" | "draft";
  at: ISODate;
  readRate: number | null;
}

export interface StaffMember {
  nick: string;
  tag: string;
  contact: string;
  role: OrgRole;
  activity: string;
  pending?: boolean;
  you?: boolean;
}

export interface SessionUser {
  id: string;
  nick: string;
  tag: string;
  email: string;
  phone: string;
  fullName: string;
  emailVerified: boolean;
  isPlayer: boolean;
  isOrganizer: boolean;
  isPlatformAdmin: boolean;
  captainOf: string | null; // slug команды
  team: TeamRef | null;
  city?: string;
  avatar?: string | null;
  /** permissions — права роли от бэкенда (имена как в shared/lib/permissions.ts). Лимиты staff и mailings — только в моках (экраны 42, 47 — v2/v3) */
  org: { slug: string; name: string; role: OrgRole; plan: Plan; permissions?: string[]; limits: { tournaments: [number, number | null]; staff?: [number, number]; mailings?: [number, number] } } | null;
  defaultCabinet: "player" | "org";
  locale: "ru" | "ky" | "en";
  unread: { notifications: number; invites: number };
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  requestId?: string;
}

export interface Paged<T> {
  results: T[];
  count: number;
  page: number;
  pages: number;
}

export interface AuthSession {
  id: string;
  device: string;
  meta: string;
  age: string;
  current: boolean;
}
