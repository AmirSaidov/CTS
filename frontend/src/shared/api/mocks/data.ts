/*
 * Моковая БД для разработки без бэкенда (NEXT_PUBLIC_API_MOCKS=1).
 * Данные повторяют макет: сезон 2026, «сегодня» — 24.09.2026, Бишкек UTC+6.
 * В продакшене не используется.
 */
import type {
  Application,
  Bracket,
  Checkin,
  Dispute,
  Game,
  Invite,
  Mailing,
  Match,
  NewsArticle,
  Notification,
  Participant,
  Player,
  PlanInfo,
  RankingRow,
  ScheduleSlot,
  StaffMember,
  Team,
  TeamRef,
  Tournament,
} from "../types";

import { MOCK_NOW } from "@/shared/lib/clock";
export { MOCK_NOW };

/** Время относительно «сейчас» в моковом мире: таймеры в моках всегда в будущем */
const fromNow = (min: number) => new Date(Date.parse(MOCK_NOW) + min * 60_000).toISOString();

const t = (slug: string, name: string, tag: string): TeamRef => ({ slug, name, tag });

export const TEAMS_REF = {
  tengri: t("tengri", "TENGRI", "TG"),
  samurai: t("samurai-kg", "Samurai KG", "SK"),
  issyk: t("issyk-kul", "Issyk-Kul", "IK"),
  alatoo: t("ala-too-esports", "Ala-Too Esports", "AE"),
  kgz: t("kgz-titans", "KGZ Titans", "KT"),
  wolves: t("bishkek-wolves", "Bishkek Wolves", "BW"),
  nomad: t("nomad-five", "Nomad Five", "NF"),
  iron: t("iron-snow", "Iron Snow", "IS"),
  steppe: t("steppe-rush", "Steppe Rush", "SR"),
  kokboru: t("kok-boru", "Kok-Boru", "KB"),
  ordo: t("ordo", "Ordo", "OR"),
  manas: t("manas-five", "Manas Five", "M5"),
  blackyak: t("black-yak", "Black Yak", "BY"),
  next: t("next-level", "Next Level", "NL"),
} as const;

const T = TEAMS_REF;

export const GAMES: Game[] = [
  { slug: "valorant", name: "Valorant", short: "VL", publisher: "Riot Games", teamSize: 5, roster: { main: 5, subs: 2 }, accountCheck: "riot", formats: ["single", "double", "groups", "swiss"], status: "active" },
  { slug: "cs2", name: "Counter-Strike 2", short: "CS", publisher: "Valve", teamSize: 5, roster: { main: 5, subs: 2 }, accountCheck: "steam", formats: ["single", "double", "groups", "swiss"], status: "active" },
  { slug: "dota2", name: "Dota 2", short: "D2", publisher: "Valve", teamSize: 5, roster: { main: 5, subs: 2 }, accountCheck: "steam", formats: ["single", "double", "groups"], status: "active" },
  { slug: "mlbb", name: "Mobile Legends", short: "ML", publisher: "Moonton", teamSize: 5, roster: { main: 5, subs: 1 }, accountCheck: "manual", formats: ["single", "double"], status: "active" },
  { slug: "pubgm", name: "PUBG Mobile", short: "PU", publisher: "Krafton", teamSize: 4, roster: { main: 4, subs: 1 }, accountCheck: "manual", formats: ["single", "groups"], status: "active" },
  { slug: "eafc", name: "EA FC", short: "FC", publisher: "EA", teamSize: 1, roster: { main: 1, subs: 0 }, accountCheck: "manual", formats: ["single", "groups", "league"], status: "beta" },
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: "t1", slug: "bishkek-cyber-cup", name: "Bishkek Cyber Cup", game: "valorant", format: "groups",
    matchFormat: "BO1 · полуфинал BO3 · финал BO5", teams: { current: 16, max: 16 },
    startAt: "2026-09-15T16:00:00+06:00", finalAt: "2026-09-27T19:00:00+06:00", prize: "[СУММА]",
    organizer: { slug: "cyber-arena", name: "[Клуб] Cyber Arena" }, venue: "mixed", venueLabel: "Online / LAN",
    city: "Бишкек", status: "final", stageLabel: "Гранд-финал 27.09", timezone: "Asia/Bishkek", liveMatches: 1, tier: "major",
    description: "Главный турнир сезона по Valorant в Бишкеке. Групповой этап онлайн, плей-офф — LAN.",
    rules: [
      { title: "1. Общие положения", body: "Турнир проводится по правилам Riot Games. Опоздание более 10 минут — техническое поражение." },
      { title: "2. Споры", body: "Споры решает главный судья на основании скриншотов и демо." },
    ],
    prizes: [{ place: 1, amount: "[СУММА] + кубок" }, { place: 2, amount: "[СУММА]" }, { place: 3, amount: "[СУММА]" }],
  },
  {
    id: "t2", slug: "weekend-clash-14", name: "Weekend Clash #14", game: "dota2", format: "single",
    matchFormat: "BO1", teams: { current: 8, max: 8 }, startAt: "2026-09-20T16:00:00+06:00", finalAt: "2026-09-28T19:00:00+06:00",
    prize: "[СУММА]", organizer: { slug: "cyber-arena", name: "[Клуб]" }, venue: "online", venueLabel: "Online",
    city: "Бишкек", status: "running", stageLabel: "Четвертьфинал", timezone: "Asia/Bishkek", tier: "local",
  },
  {
    id: "t3", slug: "osh-open", name: "Osh Open", game: "valorant", format: "single",
    matchFormat: "BO1 · финал BO3", teams: { current: 5, max: 16 }, startAt: "2026-10-10T16:00:00+06:00", finalAt: "2026-10-20T19:00:00+06:00",
    registrationClosesAt: "2026-10-08T23:59:00+06:00", prize: "[СУММА]", fee: "[СУММА] / Бесплатно",
    organizer: { slug: "osh-gaming-hub", name: "[Клуб]" }, venue: "lan", venueLabel: "LAN · [АДРЕС]",
    city: "Ош", status: "registration", stageLabel: "Регистрация", timezone: "Asia/Bishkek", tier: "open",
    description: "Открытый турнир по Valorant для команд Оша и области. LAN-финал в [КЛУБ].",
  },
  {
    id: "t4", slug: "ala-too-student-league", name: "Ala-Too Student League", game: "cs2", format: "groups",
    matchFormat: "BO1 · плей-офф BO3", teams: { current: 12, max: 16 }, startAt: "2026-09-15T16:00:00+06:00", finalAt: "2026-10-30T19:00:00+06:00",
    prize: "[СУММА]", organizer: { slug: "ala-too-league", name: "[Лига]" }, venue: "online", venueLabel: "Online",
    city: "Бишкек", status: "groups", stageLabel: "Групповой этап", timezone: "Asia/Bishkek", tier: "league",
  },
  {
    id: "t5", slug: "chui-valley-masters", name: "Chui Valley Masters", game: "cs2", format: "double",
    matchFormat: "BO3", teams: { current: 9, max: 16 }, startAt: "2026-10-18T16:00:00+06:00", finalAt: "2026-10-26T19:00:00+06:00",
    prize: "[СУММА]", organizer: { slug: "cyber-arena", name: "[Клуб]" }, venue: "lan", venueLabel: "LAN",
    city: "Токмок", status: "registration", stageLabel: "Регистрация", timezone: "Asia/Bishkek", tier: "open",
  },
  {
    id: "t6", slug: "club-night-series", name: "Club Night Series", game: "cs2", format: "single",
    matchFormat: "BO1", teams: { current: 8, max: 8 }, startAt: "2026-09-01T18:00:00+06:00", finalAt: "2026-09-12T19:00:00+06:00",
    prize: "[СУММА]", organizer: { slug: "cyber-arena", name: "[Клуб]" }, venue: "lan", venueLabel: "LAN",
    city: "Бишкек", status: "finished", stageLabel: "Завершён", timezone: "Asia/Bishkek", tier: "local",
  },
];

function m(p: Partial<Match> & Pick<Match, "code" | "a" | "b">): Match {
  return {
    tournamentSlug: "bishkek-cyber-cup",
    tournamentName: "Bishkek Cyber Cup",
    stage: "Четвертьфинал",
    stageKey: "qf",
    bo: 1,
    startAt: null,
    status: "finished",
    ...p,
  };
}

const side = (team: TeamRef | null, score: number | null, extra: Partial<Match["a"]> = {}) => ({ team, score, ...extra });

export const BCC_MATCHES: Match[] = [
  m({ code: "QF-01", startAt: "2026-09-20T16:00:00+06:00", a: side(T.tengri, 13), b: side(T.nomad, 9) }),
  m({ code: "QF-02", startAt: "2026-09-20T18:00:00+06:00", a: side(T.alatoo, 13), b: side(T.iron, 11) }),
  m({ code: "QF-03", startAt: "2026-09-21T16:00:00+06:00", a: side(T.wolves, 7), b: side(T.samurai, 13) }),
  m({ code: "QF-04", startAt: "2026-09-21T18:00:00+06:00", a: side(T.issyk, 13), b: side(T.next, 5) }),
  m({ code: "SF-01", stage: "Полуфинал", stageKey: "sf", bo: 3, startAt: "2026-09-23T18:00:00+06:00", a: side(T.tengri, 2), b: side(T.alatoo, 1) }),
  m({
    code: "SF-02", stage: "Полуфинал", stageKey: "sf", bo: 3, startAt: "2026-09-24T16:00:00+06:00", status: "live", currentMap: 3,
    a: side(T.samurai, 1, { seed: 3, group: "A" }), b: side(T.issyk, 1, { seed: 2, group: "B" }),
    maps: [
      { name: "Ascent", a: 13, b: 9, status: "done" },
      { name: "Bind", a: 11, b: 13, status: "done" },
      { name: "Lotus", a: 8, b: 6, status: "live" },
    ],
    nextMatch: "Гранд-финал GF-01", server: "[РЕГИОН]", judge: "[ИМЯ СУДЬИ]",
    stream: { url: "https://twitch.tv/", viewers: 1240 },
  }),
  m({
    code: "GF-01", stage: "Гранд-финал", stageKey: "gf", bo: 5, startAt: "2026-09-27T19:00:00+06:00", status: "scheduled",
    a: side(T.tengri, null), b: side(null, null, { placeholder: "Победитель SF-02" }),
  }),
];

export const BRACKETS: Record<string, Bracket> = {
  "bishkek-cyber-cup": {
    tournamentSlug: "bishkek-cyber-cup",
    format: "groups",
    completedStages: [{ title: "Stage 01 · Группы", label: "Завершён" }],
    stages: [
      { key: "qf", title: "Четвертьфинал", bo: 1, matches: BCC_MATCHES.slice(0, 4) },
      { key: "sf", title: "Полуфинал", bo: 3, matches: BCC_MATCHES.slice(4, 6) },
      { key: "gf", title: "Гранд-финал", bo: 5, matches: BCC_MATCHES.slice(6) },
    ],
    champion: null,
    championAt: "2026-09-27T19:00:00+06:00",
    updatedAt: MOCK_NOW,
  },
};

const ph = (label: string) => side(null, null, { placeholder: label });

export const OSH_SEED: TeamRef[] = [T.tengri, T.issyk, T.samurai, T.alatoo, T.kgz, T.wolves, T.nomad, T.iron];

export function buildSingleElim(slug: string, name: string, seeds: TeamRef[], dates: string[]): Bracket {
  // посев 1–8, 2–7 … как в макете: #1 vs #8, #4 vs #5, #3 vs #6, #2 vs #7 — бэкенд делает то же
  const pairs: [number, number][] = [[0, 7], [3, 4], [2, 5], [1, 6]];
  const qf = pairs.map(([x, y], i) =>
    m({ code: `QF-0${i + 1}`, tournamentSlug: slug, tournamentName: name, status: "scheduled", startAt: dates[i] ?? null, a: side(seeds[x] ?? null, null), b: side(seeds[y] ?? null, null) }),
  );
  const sf = [0, 1].map((i) =>
    m({ code: `SF-0${i + 1}`, tournamentSlug: slug, tournamentName: name, stage: "Полуфинал", stageKey: "sf", status: "tbd", startAt: "2026-10-15T16:00:00+06:00", a: ph(`Победитель QF-0${i * 2 + 1}`), b: ph(`Победитель QF-0${i * 2 + 2}`) }),
  );
  const gf = m({ code: "GF", tournamentSlug: slug, tournamentName: name, stage: "Финал", stageKey: "gf", bo: 3, status: "tbd", startAt: "2026-10-20T19:00:00+06:00", a: ph("Победитель SF-01"), b: ph("Победитель SF-02") });
  return {
    tournamentSlug: slug,
    format: "single",
    stages: [
      { key: "qf", title: "Четвертьфинал", bo: 1, matches: qf },
      { key: "sf", title: "Полуфинал", bo: 1, matches: sf },
      { key: "gf", title: "Финал", bo: 3, matches: [gf] },
    ],
    champion: null,
    updatedAt: MOCK_NOW,
    seeds,
  };
}

BRACKETS["osh-open"] = buildSingleElim("osh-open", "Osh Open", [T.tengri, T.issyk, T.samurai, T.alatoo, T.kgz, T.wolves, T.nomad, T.iron], [
  "2026-10-10T16:00:00+06:00", "2026-10-10T18:00:00+06:00", "2026-10-11T16:00:00+06:00", "2026-10-11T18:00:00+06:00",
]);

// Расписание /schedule (экран 04)
export const SCHEDULE_MATCHES: Match[] = [
  BCC_MATCHES[5],
  m({ code: "QF-03", tournamentSlug: "weekend-clash-14", tournamentName: "Weekend Clash #14", startAt: "2026-09-24T18:00:00+06:00", status: "scheduled", a: side(T.steppe, null), b: side(T.kokboru, null) }),
  m({ code: "QF-04", tournamentSlug: "weekend-clash-14", tournamentName: "Weekend Clash #14", startAt: "2026-09-24T19:30:00+06:00", status: "scheduled", a: side(T.ordo, null), b: side(T.manas, null) }),
  m({ code: "GR-B", tournamentSlug: "ala-too-student-league", tournamentName: "Ala-Too Student League", stage: "Группа B", stageKey: "gr-b", startAt: "2026-09-25T16:00:00+06:00", status: "scheduled", a: side(T.kgz, null), b: side(T.blackyak, null) }),
  m({ code: "GR-B", tournamentSlug: "ala-too-student-league", tournamentName: "Ala-Too Student League", stage: "Группа B", stageKey: "gr-b", startAt: "2026-09-25T18:00:00+06:00", status: "scheduled", a: side(T.wolves, null), b: side(T.next, null) }),
];

export const PLAYERS: Record<string, Player> = {
  aktan: {
    nick: "Aktan", tag: "AK", fullName: "Aktan Sydykov", city: "Бишкек", team: T.tengri, role: "Дуэлянт", game: "valorant",
    captain: true, lookingForTeam: false,
    stats: { tournaments: 10, matches: 46, wins: 31, winrate: 67, trophies: 2, rank: 4 },
    accounts: [
      { kind: "riot", value: "Aktan#KGZ", verified: true },
      { kind: "steam", value: "aktan_kg", verified: true },
      { kind: "discord", value: "aktan", verified: false },
      { kind: "telegram", value: "@aktan_kg", verified: true },
    ],
    about: "Играю в Valorant с 2021 года, основная роль — дуэлянт. Капитан TENGRI. Открыт к LAN-турнирам в Бишкеке и Оше.",
    achievements: [
      { icon: "trophy", title: "Чемпион Club Night Series", meta: "12.09.2026", gold: true },
      { icon: "star", title: "MVP финала", meta: "Club Night Series", gold: true },
      { icon: "crown", title: "Капитан команды", meta: "с 06.2026" },
      { icon: "flag", title: "10 турниров сыграно", meta: "Сезон 2026" },
    ],
    history: [
      { tournament: "Bishkek Cyber Cup", tournamentSlug: "bishkek-cyber-cup", game: "valorant", result: "Финал", resultTone: "gold", team: "TENGRI", date: "15.09.2026" },
      { tournament: "Club Night Series", tournamentSlug: "club-night-series", game: "cs2", result: "1 место", resultTone: "gold", team: "TENGRI", date: "12.09.2026" },
      { tournament: "Summer Clash", tournamentSlug: "summer-clash", game: "valorant", result: "3–4 место", resultTone: "neutral", team: "TENGRI", date: "08.2026" },
      { tournament: "Ala-Too Student League S1", tournamentSlug: "ala-too-s1", game: "valorant", result: "Группы", resultTone: "violet", team: "NOMAD FIVE", date: "05.2026" },
      { tournament: "Osh Open 2025", tournamentSlug: "osh-open-2025", game: "valorant", result: "2 место", resultTone: "neutral", team: "NOMAD FIVE", date: "10.2025" },
    ],
    recentMatches: [
      { code: "SF-01", bo: 3, vs: "TENGRI vs ALA-TOO", score: "2 : 1", map: "Ascent", kda: "24 / 15 / 6", win: true },
      { code: "QF-01", bo: 3, vs: "TENGRI vs NOMAD FIVE", score: "13 : 9", map: "Bind", kda: "21 / 14 / 4", win: true },
      { code: "GR-A", bo: 1, vs: "TENGRI vs IRON SNOW", score: "10 : 13", map: "Lotus", kda: "17 / 16 / 8", win: false },
    ],
    privacy: { showStats: true, showCity: true, invitesFromAll: false },
    socials: { telegram: "@aktan_kg" },
  },
};

export const SF02_STATS: { a: import("../types").PlayerStatLine[]; b: import("../types").PlayerStatLine[] } = {
  a: [
    { nick: "Aktan", tag: "AK", role: "Дуэлянт", k: 41, d: 30, a: 9, acs: 268, captain: true },
    { nick: "Nurs", tag: "NU", role: "Инициатор", k: 33, d: 31, a: 18, acs: 221 },
    { nick: "Timur", tag: "TI", role: "Контроллер", k: 28, d: 29, a: 21, acs: 198 },
    { nick: "Beka", tag: "BE", role: "Страж", k: 30, d: 27, a: 12, acs: 205 },
    { nick: "Erlan", tag: "ER", role: "Флекс", k: 25, d: 33, a: 15, acs: 176 },
  ],
  b: [
    { nick: "Dastan", tag: "DA", role: "Дуэлянт", k: 44, d: 32, a: 7, acs: 281 },
    { nick: "Azamat", tag: "AZ", role: "Инициатор", k: 31, d: 30, a: 22, acs: 214, captain: true },
    { nick: "Ruslan", tag: "RU", role: "Контроллер", k: 26, d: 31, a: 19, acs: 187 },
    { nick: "Adil", tag: "AD", role: "Страж", k: 29, d: 30, a: 10, acs: 193 },
    { nick: "Kanat", tag: "KA", role: "Флекс", k: 27, d: 30, a: 14, acs: 182 },
  ],
};

const tengriMembers: Team["members"] = [
  { nick: "Aktan", tag: "AK", fullName: "Aktan S.", role: "Дуэлянт", status: "main", captain: true, account: { kind: "riot", ok: true } },
  { nick: "Bolot", tag: "BO", fullName: "Bolot K.", role: "Инициатор", status: "main", captain: false, account: { kind: "riot", ok: true } },
  { nick: "Chyngyz", tag: "CH", fullName: "Chyngyz A.", role: "Контроллер", status: "main", captain: false, account: { kind: "riot", ok: true } },
  { nick: "Daniyar", tag: "DA", fullName: "Daniyar M.", role: "Страж", status: "main", captain: false, account: { kind: "riot", ok: true } },
  { nick: "Emir", tag: "EM", fullName: "Emir T.", role: "Флекс", status: "main", captain: false, account: { kind: "riot", ok: true } },
  { nick: "Farid", tag: "FA", fullName: "Farid N.", role: "Флекс", status: "sub", captain: false, account: { kind: "riot", ok: true } },
];

export const TEAMS: Record<string, Team> = {
  tengri: {
    ...T.tengri, game: "valorant", city: "Бишкек", founded: "2025", captainNick: "Aktan", recruiting: true,
    badges: ["Финалист BCC"],
    stats: { tournaments: 12, matches: 58, wins: 40, winrate: 69, trophies: 2, rank: 1 },
    members: tengriMembers, maxMembers: 7,
    trophies: [
      { title: "Club Night Series", meta: "1 место · 09.2026", tone: "gold" },
      { title: "Bishkek Cyber Cup", meta: "Финалист · 09.2026", tone: "gold" },
      { title: "Summer Clash", meta: "3–4 место · 08.2026", tone: "neutral" },
      { title: "Osh Open 2025", meta: "2 место · 10.2025", tone: "neutral" },
    ],
    history: PLAYERS.aktan.history,
    upcoming: [
      { date: "27.09", title: "TENGRI vs TBD", meta: "Bishkek Cyber Cup · Гранд-финал" },
      { date: "10.10", title: "TENGRI vs Регистрация", meta: "Osh Open · Заявка подана" },
    ],
  },
};

const rankingData: [TeamRef, string, number, number, number, number][] = [
  [T.tengri, "Бишкек", 12, 69, 2, 1240],
  [T.samurai, "Бишкек", 10, 64, 1, 1105],
  [T.issyk, "Бишкек", 11, 61, -1, 980],
  [T.alatoo, "Бишкек", 9, 58, 0, 940],
  [T.kgz, "Бишкек", 8, 55, 3, 870],
  [T.wolves, "Бишкек", 10, 52, -2, 815],
  [T.nomad, "Бишкек", 7, 54, 0, 790],
  [T.iron, "Бишкек", 9, 50, 1, 760],
  [T.steppe, "Бишкек", 6, 50, -1, 720],
  [T.kokboru, "Бишкек", 8, 47, 0, 695],
];

export const RANKINGS: RankingRow[] = rankingData.map(([team, city, tournaments, winrate, delta, points], i) => ({
  pos: i + 1, team, game: "valorant", city, tournaments, winrate, delta, points,
}));

const articleBody = `
<p>Плей-офф Bishkek Cyber Cup стартует 20 сентября. Восемь команд, прошедших групповой этап, сыграют по системе single elimination: четвертьфиналы в формате BO1, полуфиналы — BO3, гранд-финал — BO5.</p>
<h2>Расписание плей-офф</h2>
<p>Четвертьфиналы пройдут 20–21 сентября, полуфиналы — 23–24 сентября. Гранд-финал запланирован на 27 сентября, начало в 19:00 по Бишкеку. Все матчи транслируются на странице турнира.</p>
<blockquote><p>«Мы готовились к этому финалу весь сезон»</p><cite>Aktan · капитан TENGRI</cite></blockquote>
<h2>Как следить за матчами</h2>
<p>Включите уведомления в профиле, чтобы получать напоминания за час до матча любимой команды. Сетка и счёт обновляются в реальном времени.</p>
<figure data-placeholder="Иллюстрация к статье"></figure>
<p>Полные правила турнира и регламент споров — во вкладке «Правила» на странице турнира.</p>
`;

export const NEWS: NewsArticle[] = [
  { slug: "bishkek-cyber-cup-playoff", title: "Bishkek Cyber Cup: всё, что нужно знать о плей-офф", rubric: "tournaments", date: "2026-09-23T10:00:00+06:00", readMinutes: 4, lead: "Восемь команд, три стадии, гранд-финал 27 сентября.", author: "Редакция", status: "published", body: articleBody, relatedTournament: "bishkek-cyber-cup" },
  { slug: "group-stage-results", title: "Итоги группового этапа: 8 команд в плей-офф", rubric: "tournaments", date: "2026-09-19T10:00:00+06:00", readMinutes: 3, lead: "Кто прошёл дальше и кто удивил.", author: "Редакция", status: "published", body: articleBody },
  { slug: "osh-open-registration", title: "Osh Open: открыта регистрация команд", rubric: "announce", date: "2026-09-16T10:00:00+06:00", readMinutes: 2, lead: "16 слотов, LAN-финал в Оше.", author: "Редакция", status: "published", body: articleBody, relatedTournament: "osh-open" },
  { slug: "first-tournament-guide", title: "Как провести первый турнир в клубе за вечер", rubric: "guides", date: "2026-09-12T10:00:00+06:00", readMinutes: 6, lead: "Пошаговый гайд: от создания турнира до награждения за один вечер.", author: "[ИМЯ]", status: "draft", body: articleBody },
  { slug: "cts-update-checkin", title: "Обновление CTS: чек-ин и авто-сетка", rubric: "platform", date: "2026-09-05T10:00:00+06:00", readMinutes: 3, lead: "Чек-ин в один клик и напоминания в Telegram.", author: "Команда CTS", status: "published", body: articleBody },
  { slug: "tengri-captain-interview", title: "Капитан TENGRI о подготовке к финалу", rubric: "interview", date: "2026-09-01T10:00:00+06:00", readMinutes: 5, lead: "Aktan рассказал, как команда готовится к финалу.", author: "Редакция", status: "published", body: articleBody },
];

export const PLANS: PlanInfo[] = [
  { key: "free", tier: "Tier-00", name: "Free", tagline: "Для первого турнира и небольших клубов.", priceMonth: "0", priceYear: "0", yearDiscount: "[N]", cta: "Начать бесплатно", features: ["До 3 активных турниров", "Авто-сетка и расписание", "Регистрация команд", "Публичная страница турнира"] },
  { key: "pro", tier: "Tier-01", name: "Pro", tagline: "Для клубов и комьюнити с регулярными турнирами.", priceMonth: "[ЦЕНА]", priceYear: "[ЦЕНА]", yearDiscount: "[N]", recommended: true, cta: "Перейти на Pro", features: ["Безлимит турниров", "Свой логотип и цвета", "Уведомления игрокам в Telegram", "Статистика команд и игроков", "Экспорт базы участников"] },
  { key: "league", tier: "Tier-02", name: "Лига", tagline: "Для лиг, вузов и ивент-агентств.", priceMonth: "[ЦЕНА]", priceYear: "[ЦЕНА]", yearDiscount: "[N]", cta: "Связаться", features: ["Всё из Pro", "Сезоны и рейтинги лиги", "До 10 организаторов с ролями", "Приоритетная поддержка", "Свой домен [ОПЦИЯ]"] },
];

export const PLAN_COMPARISON: [string, string, string, string][] = [
  ["Активные турниры", "3", "Безлимит", "Безлимит"],
  ["Форматы сетки", "Single / Double / Группы", "Все", "Все + сезоны"],
  ["Регистрация и чек-ин", "✓", "✓", "✓"],
  ["Брендирование страницы", "—", "✓", "✓"],
  ["Уведомления в Telegram", "—", "✓", "✓"],
  ["Аналитика", "Базовая", "Расширенная", "Расширенная"],
  ["Организаторов в команде", "1", "3", "10"],
  ["Экспорт базы участников", "—", "✓", "✓"],
  ["Поддержка", "Почта", "Почта + чат", "Приоритет"],
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "match", icon: "clock", title: "Чек-ин открыт", body: "QF-03 TENGRI vs KOK-BORU начнётся в 18:00. Отметьтесь до 17:50.", at: "2026-09-24T13:58:00+06:00", read: false, action: { label: "К матчу", href: "/me/matches" } },
  { id: "n2", kind: "tournament", icon: "mail", title: "Приглашение на турнир", body: "Chui Valley Masters приглашает TENGRI.", at: "2026-09-24T12:08:00+06:00", read: false },
  { id: "n3", kind: "team", icon: "users", title: "Новая заявка в команду", body: "Nurlan хочет вступить в TENGRI.", at: "2026-09-24T10:08:00+06:00", read: false },
  { id: "n4", kind: "match", icon: "swords", title: "Предложение скрима", body: "Samurai KG · 26.09 · 20:00", at: "2026-09-24T09:08:00+06:00", read: false },
  { id: "n5", kind: "match", icon: "check", tone: "success", title: "Результат подтверждён", body: "SF-01: TENGRI 2 : 1 ALA-TOO ESPORTS. Вы проходите в гранд-финал.", at: "2026-09-23T20:30:00+06:00", read: true },
  { id: "n6", kind: "tournament", icon: "trophy", tone: "gold", title: "Вы в гранд-финале", body: "Bishkek Cyber Cup · 27.09 · 19:00 · BO5", at: "2026-09-23T20:31:00+06:00", read: true },
  { id: "n7", kind: "tournament", icon: "calendar", title: "Изменено время матча", body: "Гранд-финал перенесён с 18:00 на 19:00.", at: "2026-09-23T12:00:00+06:00", read: true },
  { id: "n8", kind: "match", icon: "alert", title: "Спор открыт", body: "Club Night · QF-02 — судья рассмотрит спор в течение 24 часов.", at: "2026-09-12T21:00:00+06:00", read: true },
  { id: "n9", kind: "system", icon: "info", title: "Обновление CTS", body: "Появился чек-ин в один клик и напоминания в Telegram.", at: "2026-09-05T10:00:00+06:00", read: true },
];

export const INVITES: Invite[] = [
  { id: "i1", kind: "tournament", direction: "in", from: t("chui-valley-masters", "Chui Valley Masters", "CH"), title: "Chui Valley Masters", body: "Организатор приглашает TENGRI участвовать в турнире без отбора.", meta: "Организатор: [Клуб] · CS2 · Старт 18.10", at: "2026-09-24T12:08:00+06:00" },
  { id: "i2", kind: "scrim", direction: "in", from: T.samurai, title: "Samurai KG", body: "Товарищеская игра перед финалом.", meta: "26.09 · 20:00 · BO1 · Ascent", at: "2026-09-24T09:08:00+06:00" },
  { id: "i3", kind: "team", direction: "in", from: T.nomad, title: "Nomad Five", body: "Приглашение в состав на роль «Флекс».", meta: "Капитан: Nurs · Valorant", at: "2026-09-23T14:08:00+06:00", leavesTeam: "TENGRI" },
  { id: "i4", kind: "team", direction: "out", from: t("gulnara", "Gulnara", "GU"), title: "Gulnara", body: "Вы пригласили игрока в TENGRI.", meta: "Роль: запасной", at: "2026-09-26T10:00:00+06:00" },
  { id: "i5", kind: "scrim", direction: "out", from: T.kgz, title: "KGZ Titans", body: "Ожидаем подтверждения капитана.", meta: "27.09 · 18:00 · BO1", at: "2026-09-25T10:00:00+06:00" },
];

export const APPLICATIONS: Application[] = [
  { id: "a1", team: T.samurai, captain: "Aibek", roster: { main: 5, subs: 1 }, check: "ok", checkLabel: "Аккаунты OK", submittedAt: "2026-09-26T14:20:00+06:00", status: "pending", members: [] },
  { id: "a2", team: T.nomad, captain: "Nurs", roster: { main: 5, subs: 0 }, check: "ok", checkLabel: "Аккаунты OK", submittedAt: "2026-09-26T11:02:00+06:00", status: "pending", members: [] },
  { id: "a3", team: T.blackyak, captain: "Tilek", roster: { main: 5, subs: 2 }, check: "missing_account", checkLabel: "1 игрок без Riot ID", submittedAt: "2026-09-25T22:47:00+06:00", status: "pending", members: [] },
  { id: "a4", team: T.ordo, captain: "Marat", roster: { main: 5, subs: 1 }, check: "ok", checkLabel: "Аккаунты OK", submittedAt: "2026-09-25T18:15:00+06:00", status: "pending", members: [] },
  { id: "a5", team: T.manas, captain: "Ulan", roster: { main: 4, subs: 0 }, check: "incomplete", checkLabel: "Неполный состав", submittedAt: "2026-09-25T10:09:00+06:00", status: "pending", members: [] },
  { id: "a6", team: T.tengri, captain: "Aktan", roster: { main: 5, subs: 1 }, check: "ok", checkLabel: "Аккаунты OK", submittedAt: "2026-09-24T09:30:00+06:00", status: "approved", members: [] },
  { id: "a7", team: T.issyk, captain: "Azamat", roster: { main: 5, subs: 1 }, check: "ok", checkLabel: "Аккаунты OK", submittedAt: "2026-09-23T16:44:00+06:00", status: "approved", members: [] },
].map((a) => ({
  ...a,
  members: Array.from({ length: a.roster.main + a.roster.subs }, (_, i) => ({
    nick: `${a.team.name.split(" ")[0]} ${i + 1}`,
    account: !(a.check === "missing_account" && i === 4),
  })),
})) as Application[];

export const CHECKIN: Checkin = {
  stage: "QF",
  closesAt: fromNow(7.7),
  rows: [
    { team: T.tengri, ready: 5, total: 5, status: "ready" },
    { team: T.iron, ready: 5, total: 5, status: "ready" },
    { team: T.alatoo, ready: 4, total: 5, status: "partial" },
    { team: T.kgz, ready: 5, total: 5, status: "ready" },
    { team: T.samurai, ready: 5, total: 5, status: "ready" },
    { team: T.wolves, ready: 0, total: 5, status: "none" },
    { team: T.issyk, ready: 5, total: 5, status: "ready" },
    { team: T.nomad, ready: 3, total: 5, status: "partial" },
  ],
};

export const ORG_MATCHES: Match[] = [
  m({ code: "QF-01", tournamentSlug: "osh-open", tournamentName: "Osh Open", status: "confirmed", a: side(T.tengri, 13), b: side(T.iron, 9) }),
  m({ code: "QF-02", tournamentSlug: "osh-open", tournamentName: "Osh Open", status: "awaiting", a: side(T.alatoo, 13), b: side(T.kgz, 11) }),
  m({ code: "QF-03", tournamentSlug: "osh-open", tournamentName: "Osh Open", status: "dispute", a: side(T.samurai, null), b: side(T.wolves, null) }),
  m({ code: "QF-04", tournamentSlug: "osh-open", tournamentName: "Osh Open", status: "live", a: side(T.issyk, null), b: side(T.nomad, null) }),
  m({ code: "SF-01", tournamentSlug: "osh-open", tournamentName: "Osh Open", stage: "Полуфинал", stageKey: "sf", status: "tbd", a: ph("TBD"), b: ph("TBD") }),
];

export const DISPUTES: Record<string, Dispute> = {
  "QF-03": {
    matchCode: "QF-03",
    openedAt: "2026-09-24T13:56:00+06:00",
    claims: [
      { team: T.samurai, score: "13 : 10" },
      { team: T.wolves, score: "11 : 13" },
    ],
    comment: "Последний раунд переигрывали из-за вылета сервера, счёт на скрине до переигровки",
    commentBy: "капитан Bishkek Wolves",
  },
};

export const SCHEDULE_VENUES = [
  { name: "Площадка A · Зал 1", short: "Площадка A", meta: "10 ПК" },
  { name: "Площадка B · Зал 2", short: "Площадка B", meta: "10 ПК" },
  { name: "Сцена · Стрим", short: "Сцена", meta: "Стрим" },
  { name: "Онлайн · Сервер", short: "Онлайн", meta: "Сервер" },
];

export const SCHEDULE_SLOTS: ScheduleSlot[] = [
  { matchCode: null, title: "Шоу-матч открытия", venue: "Сцена · Стрим", start: "15:00", end: "16:00", kind: "show" },
  { matchCode: "QF-01", title: "QF-01 · Tengri vs Iron Snow", venue: "Площадка A · Зал 1", start: "16:00", end: "17:00", bo: 1, kind: "match" },
  { matchCode: "QF-03", title: "QF-03 · Samurai vs Wolves", venue: "Площадка B · Зал 2", start: "16:00", end: "17:00", bo: 1, kind: "match" },
  { matchCode: null, title: "Трансляция QF-01", venue: "Сцена · Стрим", start: "16:00", end: "17:00", kind: "stream" },
  { matchCode: "QF-02", title: "QF-02 · Ala-Too vs Titans", venue: "Площадка A · Зал 1", start: "18:00", end: "19:00", bo: 1, kind: "match" },
  { matchCode: "QF-04", title: "QF-04 · Issyk-Kul vs Nomad", venue: "Площадка B · Зал 2", start: "18:00", end: "19:00", bo: 1, kind: "match" },
  { matchCode: null, title: "Резерв на переигровку", venue: "Онлайн · Сервер", start: "19:00", end: "20:00", kind: "reserve" },
  { matchCode: null, title: "Свободно · перетащите матч", venue: "Сцена · Стрим", start: "20:00", end: "21:00", kind: "free" },
];

export const UNSCHEDULED = [
  { code: "SF-01", title: "SF-01 · TBD vs TBD" },
  { code: "SF-02", title: "SF-02 · TBD vs TBD" },
  { code: "GF", title: "GF · TBD vs TBD" },
];

export const PARTICIPANTS: Participant[] = [
  { team: T.tengri, game: "valorant", city: "Бишкек", tournaments: 12, winrate: 69, label: { text: "VIP", tone: "gold" }, last: "24.09", captain: "Aktan", captainContact: "@aktan_kg", best: "1 место · Club Night", noShows: 0, disputes: 1, since: "03.2025", note: "Надёжная команда, всегда вовремя. Приглашать на закрытые турниры." },
  { team: T.samurai, game: "valorant", city: "Бишкек", tournaments: 10, winrate: 64, last: "24.09", captain: "Aibek", captainContact: "@aibek", best: "Полуфинал · BCC", noShows: 0, disputes: 1, since: "04.2025", note: "" },
  { team: T.issyk, game: "valorant", city: "Каракол", tournaments: 11, winrate: 61, last: "24.09", captain: "Azamat", captainContact: "@azamat", best: "2 место · Summer Clash", noShows: 1, disputes: 0, since: "02.2025", note: "" },
  { team: T.alatoo, game: "valorant", city: "Бишкек", tournaments: 9, winrate: 58, label: { text: "Студенты", tone: "violet" }, last: "23.09", captain: "Nurbek", captainContact: "@nurbek", best: "Полуфинал · BCC", noShows: 0, disputes: 0, since: "05.2025", note: "" },
  { team: T.kgz, game: "valorant", city: "Ош", tournaments: 8, winrate: 55, last: "21.09", captain: "Bakyt", captainContact: "@bakyt", best: "1/4 · BCC", noShows: 0, disputes: 0, since: "06.2025", note: "" },
  { team: T.wolves, game: "valorant", city: "Бишкек", tournaments: 10, winrate: 52, label: { text: "Предупреждение", tone: "neutral" }, last: "21.09", captain: "Erzhan", captainContact: "@erzhan", best: "1/4 · BCC", noShows: 2, disputes: 3, since: "01.2025", note: "Два раза не пришли на чек-ин." },
  { team: T.nomad, game: "valorant", city: "Токмок", tournaments: 7, winrate: 54, last: "20.09", captain: "Nurs", captainContact: "@nurs", best: "2 место · Osh Open 2025", noShows: 0, disputes: 0, since: "09.2025", note: "" },
  { team: T.iron, game: "valorant", city: "Нарын", tournaments: 9, winrate: 50, last: "20.09", captain: "Asan", captainContact: "@asan", best: "1/4 · BCC", noShows: 1, disputes: 0, since: "03.2025", note: "" },
];

export const MAILINGS: Mailing[] = [
  { id: "ml1", title: "Регистрация на Osh Open открыта", audience: "Все команды · 48", status: "sent", at: "2026-09-20T12:00:00+06:00", readRate: 71 },
  { id: "ml2", title: "Изменение времени гранд-финала", audience: "Bishkek Cyber Cup · 16", status: "sent", at: "2026-09-23T09:15:00+06:00", readRate: 94 },
  { id: "ml3", title: "Напоминание о чек-ине", audience: "Weekend Clash · 8", status: "scheduled", at: "2026-09-24T17:00:00+06:00", readRate: null },
];

export const MAIL_TEMPLATES = ["Регистрация открыта", "Напоминание о матче", "Чек-ин открыт", "Итоги турнира"];

export const STAFF: StaffMember[] = [
  { nick: "Aibek A.", tag: "AA", contact: "Владелец", role: "owner", activity: "Сейчас", you: true },
  { nick: "Nurlan K.", tag: "НК", contact: "nurlan@club.kg", role: "admin", activity: "2 ч назад" },
  { nick: "Gulnara S.", tag: "ГС", contact: "gulnara@club.kg", role: "judge", activity: "Вчера" },
  { nick: "Timur M.", tag: "ТМ", contact: "Приглашение отправлено", role: "moderator", activity: "—", pending: true },
];

export const ANALYTICS = {
  kpi: { applications: 112, applicationsDelta: "+38% к августу", attendance: 94, attendanceNote: "6 неявок из 96", newPlayers: 41, avgDuration: "3,2 дня" },
  weekly: [6, 9, 7, 12, 10, 15, 18, 14, 21].map((v, i) => ({ week: `W${31 + i}`, value: v })),
  games: [{ name: "Valorant", share: 46 }, { name: "CS2", share: 28 }, { name: "Dota 2", share: 16 }, { name: "Mobile Legends", share: 10 }],
  funnel: [
    { step: "Просмотры страницы", value: 1240 },
    { step: "Начали заявку", value: 186 },
    { step: "Подали заявку", value: 64 },
    { step: "Одобрены", value: 48 },
    { step: "Пришли на чек-ин", value: 45 },
  ],
  byTournament: [
    { name: "Bishkek Cyber Cup", teams: 16, attendance: 100, disputes: 1 },
    { name: "Weekend Clash #14", teams: 8, attendance: 94, disputes: 0 },
    { name: "Ala-Too League", teams: 12, attendance: 91, disputes: 2 },
    { name: "Club Night Series", teams: 8, attendance: 88, disputes: 1 },
  ],
};

export const ADMIN_USERS: { tag: string; name: string; sub: string; type: "org" | "player" | "organizer"; plan: "free" | "pro" | "league"; since: string; status: "active" | "blocked" | "review" }[] = [
  { tag: "КЛ", name: "[Клуб] Cyber Arena", sub: "ORG · 3 админа", type: "org", plan: "pro", since: "02.2026", status: "active" },
  { tag: "AA", name: "Aktan", sub: "aktan@mail.kg", type: "player", plan: "free", since: "03.2025", status: "active" },
  { tag: "AS", name: "Ala-Too Student League", sub: "ORG · 5 админов", type: "org", plan: "league", since: "01.2026", status: "active" },
  { tag: "XX", name: "xX_smurf_Xx", sub: "temp@mail.ru", type: "player", plan: "free", since: "27.09.2026", status: "blocked" },
  { tag: "OS", name: "Osh Gaming Hub", sub: "ORG · 1 админ", type: "org", plan: "free", since: "08.2026", status: "review" },
  { tag: "NK", name: "Nurlan K.", sub: "nurlan@club.kg", type: "organizer", plan: "pro", since: "02.2026", status: "active" },
];

export const MODERATION_QUEUE: { id: string; kind: "complaint" | "tournament" | "verification"; icon: "flag" | "alert" | "message" | "building"; title: string; meta: string; age: string; unread: boolean; warn?: boolean }[] = [
  { id: "4812", kind: "complaint", icon: "flag", title: "Жалоба на игрока · читы", meta: "xX_smurf_Xx · Weekend Clash #14 · 3 жалобы", age: "10 мин", unread: true },
  { id: "4811", kind: "tournament", icon: "alert", title: "Подозрительный турнир", meta: "«Free Skins Cup» · призы без описания, ссылка на сторонний сайт", age: "1 ч", unread: true, warn: true },
  { id: "4809", kind: "complaint", icon: "message", title: "Оскорбления в названии команды", meta: "Команда «[СКРЫТО]» · Osh Open", age: "3 ч", unread: true },
  { id: "4805", kind: "verification", icon: "building", title: "Верификация организации", meta: "Osh Gaming Hub · загружены документы", age: "5 ч", unread: false },
];

export const TRANSACTIONS: { at: string; client: string; plan: string; amount: string; status: "success" | "failed" | "refund"; method: string }[] = [
  { at: "28.09 · 13:02", client: "[Клуб] Cyber Arena", plan: "Pro · месяц", amount: "[ЦЕНА]", status: "success", method: "•••• 4417" },
  { at: "28.09 · 11:47", client: "Ala-Too Student League", plan: "Лига · год", amount: "[ЦЕНА]", status: "success", method: "Счёт" },
  { at: "27.09 · 22:15", client: "Osh Gaming Hub", plan: "Pro · месяц", amount: "[ЦЕНА]", status: "failed", method: "•••• 0932" },
  { at: "27.09 · 18:30", client: "Nurlan K.", plan: "Pro · месяц", amount: "[ЦЕНА]", status: "refund", method: "•••• 1120" },
  { at: "26.09 · 09:05", client: "Steppe Esports", plan: "Pro · месяц", amount: "[ЦЕНА]", status: "success", method: "•••• 7781" },
];

export const PROMOCODES = [
  { code: "STUDENT2026", value: "-20%", meta: "Лига · до 31.12 · 14 активаций", active: true },
  { code: "CLUBSTART", value: "1 мес", meta: "Pro · 1 месяц бесплатно · 37", active: true },
];

export const SESSIONS = [
  { id: "s1", device: "Chrome · Windows · Бишкек", meta: "Это устройство", age: "Сейчас", current: true },
  { id: "s2", device: "Safari · iPhone · Бишкек", meta: "Последний вход 26.09", age: "2 д", current: false },
  { id: "s3", device: "Telegram Web · Ош", meta: "Последний вход 19.09", age: "9 д", current: false },
];

export const PAYMENTS_HISTORY: { date: string; desc: string; amount: string; status: "paid" | "refund" }[] = [
  { date: "24.09.2026", desc: "Pro · месяц", amount: "[ЦЕНА]", status: "paid" },
  { date: "24.08.2026", desc: "Pro · месяц", amount: "[ЦЕНА]", status: "paid" },
  { date: "24.07.2026", desc: "Pro · месяц", amount: "[ЦЕНА]", status: "refund" },
];
