"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Mail, Swords, Users, X } from "lucide-react";
import type { Invite } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { ago } from "@/shared/lib/format";
import { toast, useSession } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { ConfirmModal } from "@/shared/ui/overlay";
import { TeamLogo } from "@/shared/ui/misc";
import { EmptyStateView } from "@/shared/ui/empty-state";

const KIND = { tournament: { label: "Турнир", tone: "accent" as const, icon: Mail }, scrim: { label: "Скрим", tone: "neutral" as const, icon: Swords }, team: { label: "Команда", tone: "violet-solid" as const, icon: Users } };

export function useInvites(initial?: Invite[]) {
  return useQuery({ queryKey: qk.invites, queryFn: () => api.myInvites(), initialData: initial });
}

/** Принять / Отклонить с оптимистичным удалением из списка и счётчика в сайдбаре */
export function useAnswerInvite() {
  const qc = useQueryClient();
  const bump = useSession((s) => s.bumpUnread);
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => api.answerInvite(id, accept),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: qk.invites });
      const prev = qc.getQueryData<Invite[]>(qk.invites);
      qc.setQueryData<Invite[]>(qk.invites, (l) => l?.filter((i) => i.id !== id));
      bump("invites", -1);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.invites, ctx?.prev);
      bump("invites", 1);
      toast.error("Не получилось ответить на приглашение");
    },
    onSuccess: (_d, { accept }) => toast.success(accept ? "Приглашение принято" : "Приглашение отклонено"),
  });
}

/** Компактный список на обзоре (21) */
export function InviteMiniList({ initial }: { initial: Invite[] }) {
  const { data = [] } = useInvites(initial);
  const answer = useAnswerInvite();
  const incoming = data.filter((i) => i.direction === "in" && i.kind !== "team").slice(0, 2);
  if (!incoming.length) return <p className="px-6 py-6 text-[14px] text-text-3">Новых приглашений нет</p>;
  return (
    <ul>
      {incoming.map((i) => {
        const Icon = KIND[i.kind].icon;
        return (
          <li key={i.id} className="flex gap-4 border-b border-line px-6 py-5 last:border-b-0">
            <span className="flex size-10 shrink-0 items-center justify-center border border-line-strong">
              <Icon size={18} strokeWidth={1.5} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[16px] font-semibold">{i.kind === "scrim" ? `Scrim от ${i.title}` : i.title}</span>
                <span className="mono flex items-center gap-2 text-[10px] text-text-3">
                  {ago(i.at)} <span className="size-1.5 bg-text" aria-label="Новое" />
                </span>
              </div>
              <span className="text-[14px] text-text-2">{i.kind === "scrim" ? "Товарищеская игра 26.09 в 20:00" : "Организатор приглашает TENGRI на турнир"}</span>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="primary" onClick={() => answer.mutate({ id: i.id, accept: true })}>
                  Принять
                </Button>
                <Button size="sm" onClick={() => answer.mutate({ id: i.id, accept: false })}>
                  Отклонить
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Полный экран приглашений (27) */
export function InvitesScreen({ initial, tab }: { initial: Invite[]; tab: "in" | "out" }) {
  const { data = [] } = useInvites(initial);
  const answer = useAnswerInvite();
  const [confirm, setConfirm] = useState<Invite | null>(null);
  const list = data.filter((i) => i.direction === tab);

  if (!list.length)
    return <EmptyStateView code="EMPTY.INVITES" icon={Mail} title="Нет приглашений" text="Когда команда или организатор пригласит вас, это появится здесь." />;

  return (
    <div className="flex flex-col gap-4">
      {list.map((i) => (
        <article key={i.id} className="relative flex flex-col gap-5 border border-line bg-elev-1 p-6 tab:flex-row tab:items-center">
          <CornerMarkers only="tl" offset={0} />
          <TeamLogo tag={i.from.tag} size={56} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-3">
              <Badge tone={KIND[i.kind].tone} dot={i.kind === "tournament"}>
                {KIND[i.kind].label}
              </Badge>
              <span className="mono-label">{tab === "in" ? `${ago(i.at)} назад` : new Date(i.at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</span>
            </div>
            <h2 className="font-display text-[30px] leading-none">{i.title}</h2>
            <p className="text-[15px] text-text-2">
              {i.body}
              {i.leavesTeam && ` Если примете — покинете ${i.leavesTeam}.`}
            </p>
            <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{i.meta}</span>
          </div>
          <div className="flex gap-2">
            {tab === "in" ? (
              <>
                <Button variant="primary" icon={Check} onClick={() => (i.leavesTeam ? setConfirm(i) : answer.mutate({ id: i.id, accept: true }))}>
                  Принять
                </Button>
                <Button icon={X} onClick={() => answer.mutate({ id: i.id, accept: false })}>
                  Отклонить
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => answer.mutate({ id: i.id, accept: false })}>
                Отозвать
              </Button>
            )}
          </div>
        </article>
      ))}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Сменить команду?"
        text={confirm && <>Если примете приглашение {confirm.title}, вы покинете {confirm.leavesTeam}. Капитан {confirm.leavesTeam} получит уведомление.</>}
        confirmLabel="Принять и покинуть"
        onConfirm={() => {
          if (confirm) answer.mutate({ id: confirm.id, accept: true });
          setConfirm(null);
        }}
      />
    </div>
  );
}

export function TabCounter({ n, on }: { n: number; on: boolean }) {
  return <span className={cn("mono text-[10px]", on ? "text-text" : "text-text-3")}>· {n}</span>;
}
