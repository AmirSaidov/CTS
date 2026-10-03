"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Check, Clock, Info, Mail, SlidersHorizontal, Swords, TriangleAlert, Trophy, Users, type LucideIcon } from "lucide-react";
import type { Notification } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { now as clockNow } from "@/shared/lib/clock";
import { ago, dayGroup, fmtDay } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { useSession } from "@/shared/lib/stores";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { PageHeader, TableSkeleton } from "@/shared/ui/misc";
import { Chips } from "@/shared/ui/tabs";
import { EmptyStateView } from "@/shared/ui/empty-state";
import { QueryError } from "@/shared/ui/feedback";

const ICONS: Record<Notification["icon"], LucideIcon> = { clock: Clock, mail: Mail, users: Users, swords: Swords, check: Check, trophy: Trophy, calendar: Calendar, alert: TriangleAlert, info: Info };
const GROUPS = [
  ["today", "Сегодня"],
  ["yesterday", "Вчера"],
  ["earlier", "Ранее"],
] as const;

/**
 * Экран уведомлений — общий для игрока и организатора (у организатора свой набор фильтров).
 * Новые уведомления приходят по WebSocket (useUserChannel в CabinetShell) и сразу попадают в этот кэш.
 */
export function NotificationsScreen({ initial, audience = "player" }: { initial: Notification[]; audience?: "player" | "org" }) {
  const [kind, setKind] = useState("all");
  const qc = useQueryClient();
  const setUnread = useSession((s) => s.setUnread);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.notifications(kind),
    queryFn: () => api.myNotifications(kind),
    initialData: kind === "all" ? initial : undefined,
  });

  const read = useMutation({
    mutationFn: (ids: string[] | "all") => api.readNotifications(ids),
    onMutate: (ids) => {
      qc.setQueriesData<Notification[]>({ queryKey: ["me", "notifications"] }, (l) => l?.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read: true } : n)));
      const all = qc.getQueryData<Notification[]>(qk.notifications("all")) ?? [];
      setUnread("notifications", all.filter((n) => !n.read).length);
    },
  });

  const list = data ?? [];
  const unread = list.filter((n) => !n.read).length;
  const nowMs = clockNow();
  const groupOf = (iso: string) => dayGroup(iso, nowMs);

  const filters =
    audience === "org"
      ? [
          { key: "all", label: "Все" },
          { key: "tournament", label: "Заявки" },
          { key: "match", label: "Матчи и споры" },
          { key: "system", label: "Система" },
        ]
      : [
          { key: "all", label: "Все" },
          { key: "match", label: "Матчи" },
          { key: "tournament", label: "Турниры" },
          { key: "team", label: "Команда" },
          { key: "system", label: "Система" },
        ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={audience === "org" ? "Организатор // Уведомления" : "Кабинет игрока // Уведомления"}
        title="Уведомления"
        sub={`${unread} непрочитанных`}
        actions={
          <>
            <Button icon={Check} disabled={!unread} onClick={() => read.mutate("all")}>
              Прочитать все
            </Button>
            <Button icon={SlidersHorizontal} href="/settings/notifications">
              Настроить
            </Button>
          </>
        }
      />
      <Chips active={kind} onChange={setKind} items={filters} />
      {isLoading ? (
        <Card>
          <TableSkeleton />
        </Card>
      ) : isError ? (
        <Card>
          <QueryError onRetry={() => refetch()} />
        </Card>
      ) : list.length === 0 || (kind === "all" && unread === 0 && list.length === 0) ? (
        <EmptyStateView code="EMPTY.NOTIFY" icon={Bell} title="Всё прочитано" text="Новых уведомлений нет. Мы сообщим о матчах и приглашениях." cta={{ href: "/settings/notifications", label: "Настроить", icon: SlidersHorizontal }} />
      ) : (
        GROUPS.map(([g, title]) => {
          const items = list.filter((n) => groupOf(n.at) === g);
          if (!items.length) return null;
          return (
            <Card key={g}>
              <CardHeader title={title} />
              <ul>
                {items.map((n) => {
                  const Icon = ICONS[n.icon];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.read && read.mutate([n.id])}
                        className={cn("flex w-full gap-4 border-b border-line px-6 py-5 text-left transition-colors last:border-b-0 hover:bg-elev-1", !n.read && "bg-elev-1/70")}
                        aria-label={`${n.title}${n.read ? "" : ", не прочитано"}`}
                      >
                        <span className={cn("flex size-11 shrink-0 items-center justify-center border", n.tone === "gold" ? "border-gold text-gold" : n.tone === "success" ? "border-success text-success-text" : "border-line-strong")}>
                          <Icon size={18} strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className={cn("text-[16px]", n.read ? "font-medium" : "font-semibold")}>{n.title}</span>
                          <span className="text-[14px] text-text-2">{n.body}</span>
                          {n.action && (
                            <Link href={n.action.href} onClick={(e) => e.stopPropagation()} className="btn-text cut mt-2 inline-flex h-8 w-fit items-center bg-primary px-3.5 text-[12px] text-primary-ink [--cut:7px]">
                              {n.action.label}
                            </Link>
                          )}
                        </span>
                        <span className="mono flex shrink-0 items-start gap-2 text-[10px] text-text-3">
                          {g === "today" ? ago(n.at, nowMs) : fmtDay(n.at)}
                          {!n.read && <span className="mt-0.5 size-1.5 bg-text" aria-hidden />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}
