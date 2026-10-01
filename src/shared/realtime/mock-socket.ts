/*
 * Эмулятор WebSocket для режима моков: генерирует те же события, что будет слать Django Channels.
 * Позволяет разрабатывать live-сценарии без бэкенда.
 */
import { nowIso } from "@/shared/lib/clock";
import type { RealtimeMessage, RealtimeStatus, RealtimeTransport } from "./client";

type Handler = (msg: RealtimeMessage) => void;

export class MockRealtime implements RealtimeTransport {
  status: RealtimeStatus = "open";
  private handlers = new Map<string, Set<Handler>>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private sf02 = { a: 8, b: 6, mapA: 1, mapB: 1 };
  private checkin = [4, 0, 3]; // Ala-Too, Wolves, Nomad
  private notifSeq = 100;

  constructor() {
    this.timers.push(setInterval(() => this.tickMatch(), 6_000));
    this.timers.push(setInterval(() => this.tickCheckin(), 7_000));
    this.timers.push(setTimeout(() => this.pushNotification(), 25_000) as unknown as ReturnType<typeof setInterval>);
  }

  private emit(channel: string, event: string, data: unknown) {
    this.handlers.get(channel)?.forEach((h) => h({ channel, event, data }));
  }

  private tickMatch() {
    const s = this.sf02;
    if (s.mapA === 2 || s.mapB === 2) return;
    if (Math.random() > 0.5) s.a++;
    else s.b++;
    let mapDone = false;
    if (s.a >= 13 && s.a - s.b >= 2) { s.mapA++; mapDone = true; }
    if (s.b >= 13 && s.b - s.a >= 2) { s.mapB++; mapDone = true; }
    const payload = {
      code: "SF-02",
      tournamentSlug: "bishkek-cyber-cup",
      status: mapDone ? "awaiting" : "live",
      a: { score: s.mapA },
      b: { score: s.mapB },
      currentMap: 3,
      map: { index: 2, a: s.a, b: s.b, status: mapDone ? "done" : "live" },
    };
    this.emit("match:bishkek-cyber-cup:SF-02", "match.score", payload);
    this.emit("tournament:bishkek-cyber-cup", "match.updated", payload);
  }

  private tickCheckin() {
    const i = this.checkin.findIndex((v) => v < 5);
    if (i < 0) return;
    this.checkin[i]++;
    const slugs = ["ala-too-esports", "bishkek-wolves", "nomad-five"];
    const ready = this.checkin[i];
    const data = { team: slugs[i], ready, status: ready >= 5 ? "ready" : ready > 0 ? "partial" : "none" };
    for (const id of ["t1", "t2", "t3", "t4", "t5", "t6"]) this.emit(`checkin:${id}`, "checkin.updated", data);
    this.emit("user", "checkin.opponent", { ready: Math.min(5, 2 + this.checkin[0] - 3) });
  }

  private pushNotification() {
    this.emit("user", "notification.created", {
      id: `n${this.notifSeq++}`,
      kind: "match",
      icon: "calendar",
      title: "Изменено время матча",
      body: "QF-04 Ordo vs Manas Five перенесён на 20:00.",
      at: nowIso(),
      read: false,
      action: { label: "К матчу", href: "/me/matches" },
    });
  }

  subscribe(channel: string, handler: Handler) {
    let set = this.handlers.get(channel);
    if (!set) this.handlers.set(channel, (set = new Set()));
    set.add(handler);
    return () => void set!.delete(handler);
  }

  onStatus() {
    return () => {};
  }

  onResync() {
    return () => {};
  }

  close() {
    this.timers.forEach(clearInterval);
  }
}
