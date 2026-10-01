"use client";

import { createContext, createElement, useContext, useState } from "react";
import { create, createStore, useStore, type StoreApi } from "zustand";
import type { SessionUser } from "@/shared/api/types";

/* Глобальное состояние — минимально: сессия и тосты. Данные API живут в TanStack Query. */

interface SessionState {
  user: SessionUser | null;
  bumpUnread: (key: keyof SessionUser["unread"], delta: number) => void;
  setUnread: (key: keyof SessionUser["unread"], value: number) => void;
}

/*
 * Стор сессии создаётся на каждый запрос (через контекст), а не модульным синглтоном:
 * клиентские компоненты рендерятся и на сервере, и общий стор там «утёк» бы между пользователями.
 */
const createSessionStore = (user: SessionUser | null) =>
  createStore<SessionState>((set) => ({
    user,
    bumpUnread: (key, delta) =>
      set((s) => (s.user ? { user: { ...s.user, unread: { ...s.user.unread, [key]: Math.max(0, s.user.unread[key] + delta) } } } : s)),
    setUnread: (key, value) => set((s) => (s.user ? { user: { ...s.user, unread: { ...s.user.unread, [key]: value } } } : s)),
  }));

const SessionCtx = createContext<StoreApi<SessionState> | null>(null);

export function SessionStoreProvider({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  const [store] = useState(() => createSessionStore(user));
  return createElement(SessionCtx.Provider, { value: store }, children);
}

export function useSession<T>(selector: (s: SessionState) => T): T {
  const store = useContext(SessionCtx);
  if (!store) throw new Error("useSession вне SessionStoreProvider");
  return useStore(store, selector);
}

export const useUser = () => useSession((s) => s.user);

export type ToastTone = "success" | "error" | "info";
export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
  action?: { label: string; href: string };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let seq = 0;
// тосты создаются только в браузере (обработчики событий), поэтому синглтон тут безопасен
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => get().dismiss(id), t.tone === "error" ? 6000 : 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, body?: string) => useToasts.getState().push({ tone: "success", title, body }),
  error: (title: string, body?: string) => useToasts.getState().push({ tone: "error", title, body }),
  info: (title: string, body?: string, action?: Toast["action"]) => useToasts.getState().push({ tone: "info", title, body, action }),
};
