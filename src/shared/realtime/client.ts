/*
 * Одно WebSocket-подключение на вкладку (Django Channels).
 *
 * Протокол (согласовать с бэкендом):
 *   → { "action": "subscribe" | "unsubscribe", "channel": "tournament:osh-open" }
 *   ← { "channel": "tournament:osh-open", "event": "match.updated", "data": {...} }
 *   ← { "event": "pong" }
 *
 * Каналы:
 *   tournament:{slug}         — сетка, счёт матчей, «1 матч в эфире»
 *   match:{slug}:{code}       — live-счёт по картам, статус, смена карты
 *   checkin:{tournamentId}    — прогресс чек-ина (организатор и игроки)
 *   user                      — уведомления, приглашения, счётчики (канал текущего пользователя, по сессии)
 *   org                       — счётчики CRM: новые заявки, споры
 */

export type RealtimeStatus = "connecting" | "open" | "closed";

export interface RealtimeMessage<T = unknown> {
  channel: string;
  event: string;
  data: T;
}

type Handler = (msg: RealtimeMessage) => void;

export interface RealtimeTransport {
  subscribe(channel: string, handler: Handler): () => void;
  onStatus(fn: (s: RealtimeStatus) => void): () => void;
  /** вызывается после восстановления связи — хуки дозапрашивают данные */
  onResync(fn: () => void): () => void;
  status: RealtimeStatus;
  close(): void;
}

const MIN_DELAY = 1_000;
const MAX_DELAY = 30_000;
const PING_EVERY = 25_000;

export class RealtimeClient implements RealtimeTransport {
  status: RealtimeStatus = "closed";
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private statusFns = new Set<(s: RealtimeStatus) => void>();
  private resyncFns = new Set<() => void>();
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private ping: ReturnType<typeof setInterval> | null = null;
  private closedByUser = false;
  private everOpened = false;

  constructor(private url: string) {
    this.connect();
    if (typeof window !== "undefined") {
      // вкладка вернулась из фона / сеть появилась — переподключаемся сразу, не ждём бэкоф
      window.addEventListener("online", () => this.reconnectNow());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.status === "closed") this.reconnectNow();
      });
    }
  }

  private setStatus(s: RealtimeStatus) {
    this.status = s;
    this.statusFns.forEach((fn) => fn(s));
  }

  private connect() {
    this.setStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      const wasReconnect = this.everOpened;
      this.everOpened = true;
      this.attempt = 0;
      this.setStatus("open");
      for (const channel of this.handlers.keys()) this.send({ action: "subscribe", channel });
      this.ping = setInterval(() => this.send({ action: "ping" }), PING_EVERY);
      if (wasReconnect) this.resyncFns.forEach((fn) => fn());
    };

    ws.onmessage = (e) => {
      let msg: RealtimeMessage;
      try {
        msg = JSON.parse(e.data as string);
      } catch {
        return;
      }
      if (!msg.channel) return;
      this.handlers.get(msg.channel)?.forEach((h) => h(msg));
    };

    ws.onclose = () => {
      if (this.ping) clearInterval(this.ping);
      this.ws = null;
      this.setStatus("closed");
      if (!this.closedByUser) this.scheduleReconnect();
    };

    ws.onerror = () => ws.close();
  }

  private scheduleReconnect() {
    // нарастающая задержка с джиттером: 1s, 2s, 4s … 30s
    const delay = Math.min(MAX_DELAY, MIN_DELAY * 2 ** this.attempt) * (0.75 + Math.random() * 0.5);
    this.attempt++;
    this.timer = setTimeout(() => this.connect(), delay);
  }

  private reconnectNow() {
    if (this.status === "open" || this.status === "connecting") return;
    if (this.timer) clearTimeout(this.timer);
    this.attempt = 0;
    this.connect();
  }

  private send(payload: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
  }

  subscribe(channel: string, handler: Handler) {
    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set();
      this.handlers.set(channel, set);
      this.send({ action: "subscribe", channel });
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
      if (set!.size === 0) {
        this.handlers.delete(channel);
        this.send({ action: "unsubscribe", channel });
      }
    };
  }

  onStatus(fn: (s: RealtimeStatus) => void) {
    this.statusFns.add(fn);
    return () => void this.statusFns.delete(fn);
  }

  onResync(fn: () => void) {
    this.resyncFns.add(fn);
    return () => void this.resyncFns.delete(fn);
  }

  close() {
    this.closedByUser = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }
}
