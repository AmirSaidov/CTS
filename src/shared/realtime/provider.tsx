"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { USE_MOCKS } from "@/shared/api/client";
import { RealtimeClient, type RealtimeMessage, type RealtimeStatus, type RealtimeTransport } from "./client";
import { MockRealtime } from "./mock-socket";

const Ctx = createContext<RealtimeTransport | null>(null);

function wsUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (fromEnv) return fromEnv;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/`;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [transport, setTransport] = useState<RealtimeTransport | null>(null);

  useEffect(() => {
    const t = USE_MOCKS ? new MockRealtime() : new RealtimeClient(wsUrl());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сокет живёт только в браузере
    setTransport(t);
    return () => t.close();
  }, []);

  return <Ctx.Provider value={transport}>{children}</Ctx.Provider>;
}

/** Подписка на канал. handler можно передавать инлайном — берётся последняя версия. */
export function useChannel<T = unknown>(channel: string | null, handler: (msg: RealtimeMessage<T>) => void) {
  const transport = useContext(Ctx);
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!transport || !channel) return;
    return transport.subscribe(channel, (msg) => ref.current(msg as RealtimeMessage<T>));
  }, [transport, channel]);
}

/** После переподключения — дозапросить данные (обычно invalidateQueries). */
export function useResync(fn: () => void) {
  const transport = useContext(Ctx);
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => transport?.onResync(() => ref.current()), [transport]);
}

export function useRealtimeStatus(): RealtimeStatus {
  const transport = useContext(Ctx);
  return useSyncExternalStore(
    (cb) => transport?.onStatus(cb) ?? (() => {}),
    () => transport?.status ?? "connecting",
    () => "connecting",
  );
}
