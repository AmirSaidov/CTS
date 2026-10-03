"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Tournament } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { FORMAT_LABELS, GAME_NAMES, TOURNAMENT_STATUS } from "@/shared/lib/labels";
import { fmtDay } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { CardHeader } from "@/shared/ui/card";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { TableSkeleton } from "@/shared/ui/misc";
import { EmptyStateView } from "@/shared/ui/empty-state";
import { Plus, Trophy } from "lucide-react";

type Row = Pick<Tournament, "id" | "slug" | "name" | "game" | "format" | "teams" | "status" | "startAt">;

/** «Мои турниры» организатора: вкладки Все / Активные / Архив, строка → управление турниром */
export function OrgTournamentsTable({ initial, title = "Мои турниры" }: { initial: Row[]; title?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "active" | "archive">("all");
  const { data, isFetching } = useQuery({ queryKey: qk.orgTournaments(tab), queryFn: () => api.orgTournaments(tab), initialData: tab === "all" ? (initial as Tournament[]) : undefined });

  return (
    <>
      <CardHeader title={title}>
        <Segmented
          label="Фильтр турниров"
          active={tab}
          onChange={setTab}
          items={[
            { key: "all", label: "Все" },
            { key: "active", label: "Активные" },
            { key: "archive", label: "Архив" },
          ]}
        />
      </CardHeader>
      {!data && isFetching ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <div className="p-6">
          <EmptyStateView code="EMPTY.TOURNAMENTS" icon={Trophy} title="Нет турниров" text="Создайте первый турнир — мастер проведёт по шагам за пару минут." cta={{ href: "/org/tournaments/new", label: "Создать турнир", icon: Plus, primary: true }} />
        </div>
      ) : (
        <Table minWidth={760} label={title}>
          <THead>
            <Th sticky>Турнир</Th>
            <Th>Игра</Th>
            <Th>Формат</Th>
            <Th>Команды</Th>
            <Th>Статус</Th>
            <Th align="right">Старт</Th>
          </THead>
          <tbody>
            {data.map((t) => {
              const st = TOURNAMENT_STATUS[t.status];
              const done = t.status === "finished";
              const href = `/org/tournaments/${t.id}/applications`;
              return (
                <Tr
                  key={t.id}
                  className={cn("cursor-pointer", done && "text-text-2")}
                  onClick={() => router.push(href)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(href)}
                  tabIndex={0}
                  aria-label={`Управление: ${t.name}`}
                >
                  <Td sticky className={cn("font-semibold", done && "font-medium")}>
                    {t.name}
                  </Td>
                  <Td>{GAME_NAMES[t.game]}</Td>
                  <Td>{FORMAT_LABELS[t.format]}</Td>
                  <Td className="mono font-medium">
                    {t.teams.current}/{t.teams.max}
                  </Td>
                  <Td>
                    <Badge tone={t.status === "final" ? "gold" : st.tone} dot={st.dot}>
                      {t.status === "final" ? "Финал" : st.label}
                    </Badge>
                  </Td>
                  <Td align="right" className="mono">
                    {fmtDay(t.startAt)}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
