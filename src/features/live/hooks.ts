"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import type { Bracket, Checkin, Match, MatchStatus, Notification } from "@/shared/api/types";
import { useChannel, useResync } from "@/shared/realtime/provider";
import { toast, useSession } from "@/shared/lib/stores";
import { nowIso } from "@/shared/lib/clock";

/*
 * Мост WebSocket → кэш TanStack Query. Обновления из сокета пишутся в кэш,
 * а не в отдельное состояние — экраны просто читают useQuery.
 */

interface ScorePayload {
  code: string;
  tournamentSlug: string;
  status: MatchStatus;
  a: { score: number | null };
  b: { score: number | null };
  currentMap?: number;
  map?: { index: number; a: number; b: number; status: "done" | "live" };
}

function applyScore(m: Match, p: ScorePayload): Match {
  if (m.code !== p.code) return m;
  const maps = m.maps ? [...m.maps] : undefined;
  if (maps && p.map && maps[p.map.index]) maps[p.map.index] = { ...maps[p.map.index], a: p.map.a, b: p.map.b, status: p.map.status };
  return { ...m, status: p.status, a: { ...m.a, score: p.a.score }, b: { ...m.b, score: p.b.score }, currentMap: p.currentMap ?? m.currentMap, maps };
}

export function useLiveMatch(slug: string, code: string, initialData: Match) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.match(slug, code), queryFn: () => api.match(slug, code), initialData });
  useChannel<ScorePayload>(`match:${slug}:${code}`, ({ event, data }) => {
    if (event === "match.score") qc.setQueryData<Match>(qk.match(slug, code), (m) => (m ? applyScore(m, data) : m));
    if (event === "match.finished") qc.invalidateQueries({ queryKey: qk.match(slug, code) });
  });
  useResync(() => qc.invalidateQueries({ queryKey: qk.match(slug, code) }));
  return query;
}

export function useLiveBracket(slug: string, initialData: Bracket) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.bracket(slug), queryFn: () => api.bracket(slug), initialData });
  useChannel<ScorePayload>(`tournament:${slug}`, ({ event, data }) => {
    if (event === "match.updated") {
      qc.setQueryData<Bracket>(qk.bracket(slug), (b) =>
        b && { ...b, updatedAt: nowIso(), stages: b.stages.map((s) => ({ ...s, matches: s.matches.map((m) => applyScore(m, data)) })) },
      );
      qc.setQueryData<Match[]>(qk.tournamentSchedule(slug), (list) => list?.map((m) => applyScore(m, data)));
    }
    // победитель прошёл дальше / перегенерация — структура изменилась, проще перезапросить
    if (event === "bracket.rebuilt" || event === "match.advanced") qc.invalidateQueries({ queryKey: qk.bracket(slug) });
  });
  useResync(() => qc.invalidateQueries({ queryKey: qk.bracket(slug) }));
  return query;
}

export function useLiveTournamentSchedule(slug: string, initialData: Match[]) {
  return useQuery({ queryKey: qk.tournamentSchedule(slug), queryFn: () => api.tournamentSchedule(slug), initialData });
}

interface CheckinPayload {
  team: string;
  ready: number;
  status: "ready" | "partial" | "none";
}

export function useLiveCheckin(id: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.checkin(id), queryFn: () => api.checkin(id) });
  useChannel<CheckinPayload>(`checkin:${id}`, ({ event, data }) => {
    if (event === "checkin.updated")
      qc.setQueryData<Checkin>(qk.checkin(id), (c) => c && { ...c, rows: c.rows.map((r) => (r.team.slug === data.team ? { ...r, ready: data.ready, status: data.status } : r)) });
    if (event === "checkin.extended" || event === "checkin.closed") qc.invalidateQueries({ queryKey: qk.checkin(id) });
  });
  useResync(() => qc.invalidateQueries({ queryKey: qk.checkin(id) }));
  return query;
}

/** Канал текущего пользователя: уведомления, приглашения, счётчики в сайдбаре. Подключается в CabinetLayout. */
export function useUserChannel() {
  const qc = useQueryClient();
  const bump = useSession((s) => s.bumpUnread);
  useChannel<Notification>("user", ({ event, data }) => {
    switch (event) {
      case "notification.created":
        qc.setQueriesData<Notification[]>({ queryKey: ["me", "notifications"] }, (list) => (list ? [data, ...list] : list));
        bump("notifications", 1);
        toast.info(data.title, data.body, data.action);
        break;
      case "invite.created":
        qc.invalidateQueries({ queryKey: qk.invites });
        bump("invites", 1);
        break;
      case "checkin.opponent":
      case "match.updated":
        qc.invalidateQueries({ queryKey: qk.myMatches });
        break;
    }
  });
  useResync(() => qc.invalidateQueries({ queryKey: ["me"] }));
}
