/*
 * Все обращения к Django REST API. Каждый эндпоинт: мок (dev без бэкенда) + реальный запрос.
 * Пути — предложение к бэкенду, сверить с OpenAPI-схемой после её появления.
 */
import { call, mockError, request, type RequestOptions } from "./client";
import { now } from "@/shared/lib/clock";
import * as db from "./mocks/data";
import type {
  Application,
  AuthSession,
  Bracket,
  Checkin,
  Dispute,
  Game,
  Invite,
  Mailing,
  Match,
  NewsArticle,
  Notification,
  Paged,
  Participant,
  Player,
  PlanInfo,
  RankingRow,
  SessionUser,
  StaffMember,
  Team,
  Tournament,
  OrgDashboard,
} from "./types";

type Srv = Pick<RequestOptions, "headers" | "revalidate">;

function page<T>(items: T[], p = 1, size = 6): Paged<T> {
  const pages = Math.max(1, Math.ceil(items.length / size));
  return { results: items.slice((p - 1) * size, p * size), count: items.length, page: p, pages: Math.max(pages, 12) };
}

export interface TournamentFilters {
  search?: string;
  game?: string;
  city?: string;
  status?: "open" | "live" | "finished" | "online" | "lan";
  ordering?: "start" | "-start" | "prize";
  page?: number;
}

function filterTournaments(f: TournamentFilters) {
  return db.TOURNAMENTS.filter((t) => {
    if (f.search && !`${t.name} ${t.organizer.name}`.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.game && t.game !== f.game) return false;
    if (f.city && t.city !== f.city) return false;
    switch (f.status) {
      case "open": return t.status === "registration";
      case "live": return ["running", "groups", "final"].includes(t.status);
      case "finished": return t.status === "finished";
      case "online": return t.venue === "online";
      case "lan": return t.venue !== "online";
    }
    return true;
  });
}

export const api = {
  // ───── справочники ─────
  games: (o?: Srv) => call<Game[]>(() => db.GAMES, () => request("/games/", { revalidate: 3600, ...o }), "games"),
  plans: (o?: Srv) => call<PlanInfo[]>(() => db.PLANS, () => request("/plans/", { revalidate: 3600, ...o }), "plans"),

  // ───── публичная часть ─────
  tournaments: (f: TournamentFilters = {}, o?: Srv) =>
    call<Paged<Tournament>>(() => ({ ...page(filterTournaments(f), f.page), count: filterTournaments(f).length === db.TOURNAMENTS.length ? 24 : filterTournaments(f).length }), () =>
      request("/tournaments/", { query: { ...f }, revalidate: 30, ...o }),
    ),
  tournament: (slug: string, o?: Srv) =>
    call<Tournament>(
      () => db.TOURNAMENTS.find((t) => t.slug === slug) ?? mockError(404, "Турнир не найден"),
      () => request(`/tournaments/${slug}/`, { revalidate: 30, ...o }),
    ),
  bracket: (slug: string, o?: Srv) =>
    call<Bracket>(
      () => db.BRACKETS[slug] ?? db.buildSingleElim(slug, slug, db.OSH_SEED, []),
      () => request(`/tournaments/${slug}/bracket/`, { revalidate: 10, ...o }),
    ),
  tournamentSchedule: (slug: string, o?: Srv) =>
    call<Match[]>(() => (slug === "bishkek-cyber-cup" ? db.BCC_MATCHES : db.BRACKETS[slug]?.stages.flatMap((s) => s.matches) ?? []), () =>
      request(`/tournaments/${slug}/matches/`, { revalidate: 10, ...o }),
    ),
  match: (slug: string, code: string, o?: Srv) =>
    call<Match>(
      () => [...db.BCC_MATCHES, ...db.SCHEDULE_MATCHES].find((m) => m.tournamentSlug === slug && m.code === code) ?? mockError(404, "Матч не найден"),
      () => request(`/tournaments/${slug}/matches/${code}/`, { revalidate: 5, ...o }),
    ),
  matchStats: (slug: string, code: string, o?: Srv) =>
    call(() => db.SF02_STATS, () => request<typeof db.SF02_STATS>(`/tournaments/${slug}/matches/${code}/stats/`, { ...o })),
  schedule: (date: string, tournament?: string, o?: Srv) =>
    call<Match[]>(() => db.SCHEDULE_MATCHES.filter((m) => !tournament || m.tournamentSlug === tournament), () =>
      request("/matches/", { query: { date, tournament }, revalidate: 10, ...o }),
    ),
  player: (nick: string, o?: Srv) =>
    call<Player>(
      () => db.PLAYERS[nick.toLowerCase()] ?? mockError(404, "Игрок не найден"),
      () => request(`/players/${nick}/`, { revalidate: 60, ...o }),
    ),
  team: (slug: string, o?: Srv) =>
    call<Team>(() => db.TEAMS[slug] ?? mockError(404, "Команда не найдена"), () => request(`/teams/${slug}/`, { revalidate: 60, ...o })),
  rankings: (q: { kind: "teams" | "players"; game?: string; city?: string; page?: number }, o?: Srv) =>
    call<Paged<RankingRow> & { updatedAt: string }>(() => ({ ...page(db.RANKINGS, 1, 10), updatedAt: db.MOCK_NOW }), () =>
      request("/rankings/", { query: q, revalidate: 300, ...o }),
    ),
  news: (q: { rubric?: string; page?: number } = {}, o?: Srv) =>
    call<Paged<NewsArticle>>(() => page(db.NEWS.filter((n) => n.status === "published" && (!q.rubric || n.rubric === q.rubric)), q.page, 6), () =>
      request("/news/", { query: q, revalidate: 120, ...o }),
    ),
  article: (slug: string, o?: Srv) =>
    call<NewsArticle>(() => db.NEWS.find((n) => n.slug === slug) ?? mockError(404, "Статья не найдена"), () => request(`/news/${slug}/`, { revalidate: 120, ...o })),
  legal: (doc: "privacy" | "terms" | "rules", o?: Srv) =>
    call<{ title: string; version: string; edition: string; sections: { id: string; title: string; body: string }[] }>(
      () => legalMock(doc),
      () => request(`/content/legal/${doc}/`, { revalidate: 3600, ...o }),
    ),
  remind: (slug: string, code: string) =>
    call(() => ({ ok: true }), () => request<{ ok: true }>(`/tournaments/${slug}/matches/${code}/remind/`, { method: "POST" })),
  contact: (body: { name: string; contact: string; topic: string; message: string }) =>
    call(() => ({ ok: true }), () => request<{ ok: boolean }>("/contact/", { method: "POST", body })),

  // ───── авторизация ─────
  me: (o?: Srv) => call<SessionUser>(() => mockError(401, "Не авторизован"), () => request("/auth/me/", { ...o }), "me"),
  login: (body: { login: string; password: string; remember: boolean }) =>
    call(() => (body.password.length < 4 ? mockError(400, "Неверная почта/ник или пароль") : { ok: true }), () => request<{ ok: true }>("/auth/login/", { method: "POST", body }), "auth"),
  // terms обязателен: бэкенд сохраняет версию документов и время согласия
  register: (body: { role: "player" | "organizer"; nick: string; email: string; password: string; terms: true }) =>
    call(
      () => (body.nick.toLowerCase() === "aktan" ? mockError(400, "Проверьте поля", { nick: ["Ник уже занят"] }) : { ok: true }),
      () => request<{ ok: true }>("/auth/register/", { method: "POST", body }),
      "auth",
    ),
  verify: (code: string) =>
    call(() => (code === "000000" ? mockError(400, "Неверный код", { code: ["Неверный код"] }) : { ok: true }), () => request<{ ok: true }>("/auth/verify/", { method: "POST", body: { code } }), "auth"),
  resendCode: () => call(() => ({ ok: true }), () => request<{ ok: true }>("/auth/verify/resend/", { method: "POST" }), "auth"),
  forgot: (email: string) => call(() => ({ ok: true }), () => request<{ ok: true }>("/auth/password/forgot/", { method: "POST", body: { email } }), "auth"),
  reset: (token: string, password: string) =>
    call(() => (token === "expired" ? mockError(410, "Ссылка устарела") : { ok: true }), () => request<{ ok: true }>("/auth/password/reset/", { method: "POST", body: { token, password } }), "auth"),
  logout: () => call(() => ({ ok: true }), () => request<{ ok: true }>("/auth/logout/", { method: "POST" }), "auth"),
  checkNick: (nick: string) =>
    call(() => ({ available: !["aktan", "admin", "cts"].includes(nick.toLowerCase()) }), () => request<{ available: boolean }>("/auth/nick-available/", { query: { nick } }), "auth"),

  // ───── настройки аккаунта ─────
  sessions: () => call<AuthSession[]>(() => db.SESSIONS, () => request("/me/sessions/")),
  revokeSession: (id: string | "others") => call(() => ({ ok: true }), () => request<{ ok: true }>(`/me/sessions/${id}/`, { method: "DELETE" })),
  changePassword: (body: { current: string; next: string }) =>
    call(() => (body.current.length < 4 ? mockError(400, "Проверьте поля", { current: ["Неверный текущий пароль"] }) : { ok: true }), () => request<{ ok: true }>("/me/password/", { method: "POST", body })),
  saveAccount: (body: { email?: string; nick?: string; defaultCabinet?: string; code?: string }) =>
    call(() => ({ ok: true }), () => request<{ ok: true }>("/me/account/", { method: "PATCH", body })),
  setTwoFactor: (enabled: boolean) => call(() => ({ ok: true }), () => request<{ ok: true }>("/me/2fa/", { method: "PUT", body: { enabled } })),
  backupCodes: () => call(() => ({ codes: Array.from({ length: 8 }, (_, i) => `CTS${i}-${(1000 + i * 731).toString(36).toUpperCase()}`) }), () => request<{ codes: string[] }>("/me/2fa/backup-codes/", { method: "POST" })),
  saveNotificationPrefs: (body: object) => call(() => ({ ok: true }), () => request<{ ok: true }>("/me/notification-prefs/", { method: "PUT", body })),
  saveLocale: (body: { locale: string; timezone: string; autoTz: boolean; dateFormat: string; weekStart: string; currency: string }) =>
    call(() => ({ ok: true }), () => request<{ ok: true }>("/me/locale/", { method: "PUT", body })),
  billing: () => call(() => ({ history: db.PAYMENTS_HISTORY }), () => request<{ history: typeof db.PAYMENTS_HISTORY }>("/org/billing/")),
  cancelSubscription: () => call(() => ({ ok: true }), () => request<{ ok: true }>("/org/billing/cancel/", { method: "POST" })),
  exportMyData: () => call(() => ({ url: null as string | null }), () => request<{ url: string | null }>("/me/export/", { method: "POST" })),
  deleteAccount: (body: { reason: string; comment: string; nick: string; password: string }) =>
    call(() => (body.password.length < 4 ? mockError(400, "Проверьте поля", { password: ["Неверный пароль"] }) : { ok: true }), () => request<{ ok: true }>("/me/", { method: "DELETE", body })),

  // ───── кабинет игрока ─────
  myNotifications: (kind?: string) =>
    call<Notification[]>(() => db.NOTIFICATIONS.filter((n) => !kind || kind === "all" || n.kind === kind), () => request("/me/notifications/", { query: { kind } })),
  readNotifications: (ids: string[] | "all") =>
    call(() => {
      db.NOTIFICATIONS.forEach((n) => { if (ids === "all" || ids.includes(n.id)) n.read = true; });
      return { ok: true };
    }, () => request<{ ok: true }>("/me/notifications/read/", { method: "POST", body: { ids } })),
  // TODO: удалить вместе со страницами онбординга (экраны 19–20 убраны, на бэкенде 404)
  saveOnboarding: (body: { games?: string[]; city?: string }) => call(() => ({ ok: true }), () => request<{ ok: true }>("/me/onboarding/", { method: "PATCH", body })),
  myInvites: () => call<Invite[]>(() => db.INVITES, () => request("/me/invites/")),
  answerInvite: (id: string, accept: boolean) =>
    call(() => {
      const i = db.INVITES.findIndex((x) => x.id === id);
      if (i >= 0) db.INVITES.splice(i, 1);
      return { ok: true };
    }, () => request<{ ok: true }>(`/me/invites/${id}/`, { method: "POST", body: { accept } })),
  revokeInvite: (id: string) => api.answerInvite(id, false),
  myTournaments: () =>
    call(() => [
      { t: db.TOURNAMENTS[0], team: "TENGRI", status: "Финал", tone: "gold" as const, date: "27.09 · 19:00", action: "open" as const, stage: "Плей-офф", next: "27.09 · 19:00" },
      { t: db.TOURNAMENTS[2], team: "TENGRI", status: "Заявка на проверке", tone: "neutral" as const, date: "10.10", action: "application" as const, stage: "Регистрация", next: "—" },
      { t: db.TOURNAMENTS[4], team: "TENGRI", status: "Приглашение", tone: "accent" as const, date: "18.10", action: "answer" as const, stage: "Регистрация", next: "—" },
      { t: db.TOURNAMENTS[5], team: "TENGRI", status: "1 место", tone: "gold" as const, date: "12.09", action: "results" as const, stage: "Завершён", next: "—" },
      { t: { ...db.TOURNAMENTS[5], slug: "summer-clash", name: "Summer Clash", game: "valorant" as const, format: "double" as const }, team: "TENGRI", status: "3–4 место", tone: "neutral" as const, date: "08.2026", action: "results" as const, stage: "Завершён", next: "—" },
    ], () => request<{ t: Tournament; team: string; status: string; tone: "gold" | "neutral" | "accent"; date: string; action: "open" | "application" | "answer" | "results"; stage: string; next: string }[]>("/me/tournaments/")),
  myMatches: () =>
    call(() => ({
      checkin: { match: db.SCHEDULE_MATCHES[1].code, tournament: "Weekend Clash #14", bo: 1, at: "18:00", us: db.TEAMS_REF.tengri, them: db.TEAMS_REF.kokboru, usReady: 5, usTotal: 5, themReady: 2, themTotal: 5, closesAt: new Date(now() + 42 * 60_000).toISOString(), checkedIn: false },
      report: { code: "SF-01", bo: 3, us: "TENGRI", them: "ALA-TOO", maps: [{ name: "Ascent", a: 13, b: 7 }, { name: "Bind", a: 9, b: 13 }, { name: "Lotus", a: 13, b: 11 }] },
      upcoming: [
        { date: "27.09", gold: true, title: "TENGRI vs TBD", meta: "Bishkek Cyber Cup · Гранд-финал · BO5", href: "/tournaments/bishkek-cyber-cup/matches/GF-01", status: null },
        { date: "10.10", title: "TENGRI vs Жеребьёвка", meta: "Osh Open · 1/8 · BO1", href: null, status: "Ожидает сетку" },
        { date: "26.09", title: "TENGRI vs Samurai KG", meta: "Скрим · BO1", href: "#", status: null },
      ],
      incoming: { code: "QF-02", from: "Ala-Too", score: "13 : 11", expiresAt: new Date(now() + 12 * 60_000).toISOString() },
      dispute: { status: "open", code: "QF-02", tournament: "Club Night", date: "12.09", judge: "[ИМЯ]", text: "Соперник указал счёт 13 : 11 в свою пользу. Приложите доказательства — судья рассмотрит спор." },
    }), () => request<never>("/me/matches/")),
  checkIn: (code: string) => call(() => ({ ok: true }), () => request<{ ok: true }>(`/me/matches/${code}/checkin/`, { method: "POST" })),
  reportResult: (code: string, form: FormData) => call(() => ({ ok: true }), () => request<{ ok: true }>(`/me/matches/${code}/result/`, { method: "POST", body: form })),
  confirmResult: (code: string, accept: boolean) => call(() => ({ ok: true }), () => request<{ ok: true }>(`/me/matches/${code}/confirm/`, { method: "POST", body: { accept } })),
  sendDispute: (code: string, form: FormData) => call(() => ({ ok: true }), () => request<{ ok: true }>(`/me/matches/${code}/dispute/`, { method: "POST", body: form })),
  myProfile: () => call<Player>(() => db.PLAYERS.aktan, () => request("/me/profile/")),
  saveProfile: (body: Partial<Player>) => call(() => ({ ok: true }), () => request<{ ok: true }>("/me/profile/", { method: "PATCH", body })),
  myTeam: () => call<Team | null>(() => db.TEAMS.tengri, () => request("/me/team/")),
  teamInvite: (body: { who: string; role: string }) =>
    call(() => (body.who.length < 2 ? mockError(400, "Проверьте поле", { who: ["Игрок не найден"] }) : { ok: true }), () => request<{ ok: true }>("/me/team/invites/", { method: "POST", body })),
  teamAction: (action: "kick" | "captain" | "leave" | "disband", nick?: string) =>
    call(() => ({ ok: true }), () => request<{ ok: true }>(`/me/team/${action}/`, { method: "POST", body: { nick } })),
  apply: (slug: string, body: { team: string; players: string[]; telegram: string; phone: string; draft?: boolean }) =>
    call(() => ({ ok: true, payUrl: null as string | null }), () => request<{ ok: true; payUrl: string | null }>(`/tournaments/${slug}/applications/`, { method: "POST", body })),

  // ───── CRM организатора ─────
  orgDashboard: () =>
    call<OrgDashboard>(() => ({
      season: "Сезон 2026 · Неделя 39 · 24.09",
      stats: { active: 3, activeNote: "1 в плей-офф", teams: 48, teamsDelta: 6, matchesToday: 7, nextAt: "18:00", pending: 5 },
      tournaments: [...db.TOURNAMENTS.slice(0, 4), db.TOURNAMENTS[5]],
      todayMatches: [db.BCC_MATCHES[5], ...db.SCHEDULE_MATCHES.slice(1, 3), { ...db.SCHEDULE_MATCHES[3], startAt: "2026-09-24T21:00:00+06:00" }],
      attention: [
        { label: "5 заявок ждут проверки", href: "/org/tournaments/t3/applications" },
        { label: "QF-02 без подтверждённого счёта", href: "/org/tournaments/t3/matches" },
      ],
    }), () => request("/org/dashboard/")),
  orgTournaments: (tab: "all" | "active" | "archive" = "all") =>
    call<Tournament[]>(() => db.TOURNAMENTS.filter((t) => tab === "all" || (tab === "archive" ? t.status === "finished" : t.status !== "finished")), () => request("/org/tournaments/", { query: { tab } })),
  orgTournament: (id: string) =>
    call<Tournament>(() => db.TOURNAMENTS.find((t) => t.id === id) ?? db.TOURNAMENTS[2], () => request(`/org/tournaments/${id}/`)),
  saveDraft: (id: string | null, step: number, body: Record<string, unknown>) =>
    call(() => ({ id: id ?? "t3", savedAt: new Date().toISOString() }), () =>
      request<{ id: string; savedAt: string }>(id ? `/org/tournaments/${id}/` : "/org/tournaments/", { method: id ? "PATCH" : "POST", body: { ...body, step } }),
    ),
  // MVP: турнир всегда публичный — видимость и рассылка подписчикам не передаются
  publish: (id: string) => call(() => ({ ok: true }), () => request<{ ok: true }>(`/org/tournaments/${id}/publish/`, { method: "POST" })),
  applications: (id: string) => call<Application[]>(() => db.APPLICATIONS, () => request(`/org/tournaments/${id}/applications/`)),
  decideApplications: (id: string, ids: string[], approve: boolean, reason?: string) =>
    call(() => {
      db.APPLICATIONS.forEach((a) => { if (ids.includes(a.id)) a.status = approve ? "approved" : "rejected"; });
      return { ok: true };
    }, () => request<{ ok: true }>(`/org/tournaments/${id}/applications/decide/`, { method: "POST", body: { ids, approve, reason } })),
  saveSeeding: (id: string, body: { format: string; seeds: string[] }) =>
    call(() => db.buildSingleElim("osh-open", "Osh Open", body.seeds.map((s) => Object.values(db.TEAMS_REF).find((t) => t.slug === s)!), [
      "2026-10-10T16:00:00+06:00", "2026-10-10T18:00:00+06:00", "2026-10-11T16:00:00+06:00", "2026-10-11T18:00:00+06:00",
    ]), () => request<Bracket>(`/org/tournaments/${id}/bracket/`, { method: "PUT", body })),
  orgMatches: (id: string) => call<Match[]>(() => db.ORG_MATCHES, () => request(`/org/tournaments/${id}/matches/`)),
  dispute: (id: string, code: string) => call<Dispute>(() => db.DISPUTES[code] ?? mockError(404, "Спора нет"), () => request(`/org/tournaments/${id}/matches/${code}/dispute/`)),
  resolveDispute: (id: string, code: string, body: { decision: string; comment: string }) =>
    call(() => {
      const mm = db.ORG_MATCHES.find((x) => x.code === code);
      if (mm) mm.status = "confirmed";
      return { ok: true };
    }, () => request<{ ok: true }>(`/org/tournaments/${id}/matches/${code}/resolve/`, { method: "POST", body })),
  confirmMatch: (id: string, code: string) =>
    call(() => {
      const mm = db.ORG_MATCHES.find((x) => x.code === code);
      if (mm) mm.status = "confirmed";
      return { ok: true };
    }, () => request<{ ok: true }>(`/org/tournaments/${id}/matches/${code}/confirm/`, { method: "POST" })),
  // время матча — простое поле в карточке матча (слоты и площадки, экран 37, — v3)
  setMatchTime: (id: string, code: string, startAt: string) =>
    call(() => {
      const mm = db.ORG_MATCHES.find((x) => x.code === code);
      if (mm) mm.startAt = startAt;
      return { ok: true };
    }, () => request<{ ok: true }>(`/org/tournaments/${id}/matches/${code}/`, { method: "PATCH", body: { startAt } })),
  slots: (id: string, day: number) => call(() => ({ venues: db.SCHEDULE_VENUES, slots: db.SCHEDULE_SLOTS, unscheduled: db.UNSCHEDULED, day, date: "2026-10-10" }), () =>
    request<{ venues: typeof db.SCHEDULE_VENUES; slots: typeof db.SCHEDULE_SLOTS; unscheduled: typeof db.UNSCHEDULED; day: number; date: string }>(`/org/tournaments/${id}/slots/`, { query: { day } })),
  moveSlot: (id: string, body: { code: string; venue: string; start: string }) =>
    call(() => ({ ok: true }), () => request<{ ok: true }>(`/org/tournaments/${id}/slots/move/`, { method: "POST", body })),
  checkin: (id: string) => call<Checkin>(() => ({ ...db.CHECKIN, closesAt: new Date(now() + 7.7 * 60_000).toISOString() }), () => request(`/org/tournaments/${id}/checkin/`)),
  checkinAction: (id: string, action: "extend" | "close" | "remind" | "remind_all" | "unmark" | "disqualify", team?: string) =>
    call(() => ({ ok: true }), () => request<{ ok: true }>(`/org/tournaments/${id}/checkin/${action}/`, { method: "POST", body: { team } })),
  participants: (q: { kind: "teams" | "players"; search?: string; game?: string; label?: string }) =>
    call<Participant[]>(() => db.PARTICIPANTS.filter((p) => !q.search || p.team.name.toLowerCase().includes(q.search.toLowerCase())), () => request("/org/participants/", { query: q })),
  saveNote: (team: string, note: string) => call(() => ({ ok: true }), () => request<{ ok: true }>(`/org/participants/${team}/note/`, { method: "PUT", body: { note } })),
  mailings: () => call<Mailing[]>(() => db.MAILINGS, () => request("/org/mailings/")),
  sendMailing: (body: { audience: string; subject: string; text: string; channels: string[]; scheduleAt?: string }) =>
    call(() => ({ ok: true, recipients: 12 }), () => request<{ ok: true; recipients: number }>("/org/mailings/", { method: "POST", body })),
  analytics: (period: "7d" | "30d" | "season") => call(() => db.ANALYTICS, () => request<typeof db.ANALYTICS>("/org/analytics/", { query: { period } })),
  staff: () => call<StaffMember[]>(() => db.STAFF, () => request("/org/staff/")),
  inviteStaff: (body: { who: string; role: string }) => call(() => ({ ok: true }), () => request<{ ok: true }>("/org/staff/", { method: "POST", body })),
  saveBranding: (body: Record<string, unknown>) => call(() => ({ ok: true }), () => request<{ ok: true }>("/org/branding/", { method: "PUT", body })),

  // ───── админка ─────
  adminUsers: (q: { search?: string; filter?: string }) => call(() => db.ADMIN_USERS.filter((u) => !q.search || u.name.toLowerCase().includes(q.search.toLowerCase())), () => request<typeof db.ADMIN_USERS>("/control/users/", { query: q })),
  moderation: () => call(() => db.MODERATION_QUEUE, () => request<typeof db.MODERATION_QUEUE>("/control/moderation/")),
  payments: () => call(() => ({ transactions: db.TRANSACTIONS, promos: db.PROMOCODES }), () => request<{ transactions: typeof db.TRANSACTIONS; promos: typeof db.PROMOCODES }>("/control/payments/")),
  adminNews: () => call(() => db.NEWS, () => request<NewsArticle[]>("/control/news/")),
};

export const NEXT_MATCH_START = "2026-09-27T19:00:00+06:00";

function legalMock(doc: "privacy" | "terms" | "rules") {
  const titles = { privacy: "Политика конфиденциальности", terms: "Пользовательское соглашение", rules: "Правила турниров" };
  const sections = [
    ["Общие положения", "Настоящая политика описывает, как платформа CTS обрабатывает персональные данные пользователей. [ЮРИДИЧЕСКИЙ ТЕКСТ — ПОДГОТОВИТ ЗАКАЗЧИК]"],
    ["Какие данные мы собираем", "Данные аккаунта (ник, почта, телефон), привязанные игровые аккаунты, история участия в турнирах и технические данные устройства. [ЮРИДИЧЕСКИЙ ТЕКСТ]"],
    ["Как используем данные", "Для регистрации на турниры, построения сеток, отправки уведомлений и ведения статистики выступлений. [ЮРИДИЧЕСКИЙ ТЕКСТ]"],
    ["Передача третьим лицам", "Организатор турнира видит данные участников своих турниров. Другим третьим лицам данные не передаются без согласия. [ЮРИДИЧЕСКИЙ ТЕКСТ]"],
    ["Хранение и защита", "[ЮРИДИЧЕСКИЙ ТЕКСТ]"],
    ["Права пользователя", "Вы можете запросить выгрузку или удаление данных в настройках аккаунта. [ЮРИДИЧЕСКИЙ ТЕКСТ]"],
    ["Контакты", "[КОНТАКТЫ ОТВЕТСТВЕННОГО ЛИЦА]"],
  ];
  return {
    title: titles[doc],
    version: "1.0",
    edition: "[ДАТА]",
    sections: sections.map(([title, body], i) => ({ id: `s${i + 1}`, title: `${i + 1}. ${title}`, body })),
  };
}
