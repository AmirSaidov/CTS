"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock, Send } from "lucide-react";
import type { Checkin, CheckinRow } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { useLiveCheckin } from "@/features/live/hooks";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Countdown, QueryError } from "@/shared/ui/feedback";
import { Progress, TableSkeleton, TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

const STATUS = { ready: { label: "Готова", tone: "success" }, partial: { label: "Частично", tone: "gold" }, none: { label: "Не отметились", tone: "accent" } } as const;

/** Чек-ин (38): обновляется в реальном времени по каналу checkin:{id} */
export function CheckinScreen({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useLiveCheckin(id);
  const [ask, setAsk] = useState<null | { kind: "close" } | { kind: "dq"; row: CheckinRow }>(null);

  if (isLoading) return <Card><TableSkeleton rows={8} /></Card>;
  if (isError || !data) return <Card><QueryError onRetry={() => refetch()} /></Card>;

  const ready = data.rows.filter((r) => r.status === "ready").length;
  const pct = Math.round((ready / data.rows.length) * 100);

  const act = async (action: Parameters<typeof api.checkinAction>[1], team?: CheckinRow) => {
    await api.checkinAction(id, action, team?.team.slug);
    if (action === "extend") {
      qc.setQueryData<Checkin>(qk.checkin(id), (c) => c && { ...c, closesAt: new Date(new Date(c.closesAt).getTime() + 5 * 60_000).toISOString() });
      toast.success("Чек-ин продлён на 5 минут", "Капитаны получили уведомление");
    }
    if (action === "unmark" && team) qc.setQueryData<Checkin>(qk.checkin(id), (c) => c && { ...c, rows: c.rows.map((r) => (r === team || r.team.slug === team.team.slug ? { ...r, ready: 0, status: "none" } : r)) });
    if (action === "remind" || action === "remind_all") toast.success(action === "remind" ? `Напоминание: ${team?.team.name}` : "Напоминание отправлено всем, кто не готов");
    if (action === "disqualify" && team) {
      qc.setQueryData<Checkin>(qk.checkin(id), (c) => c && { ...c, rows: c.rows.filter((r) => r.team.slug !== team.team.slug) });
      toast.success(`${team.team.name} дисквалифицирована`, "Сопернику засчитано тех. поражение");
    }
    if (action === "close") toast.success("Чек-ин закрыт", "Сетка построена по отметившимся командам");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="relative grid items-center gap-6 border border-accent bg-elev-2 p-6 desk:grid-cols-[auto_1fr_auto] desk:p-8">
        <CornerMarkers offset={8} />
        <div className="flex flex-col gap-2">
          <span className="mono text-[11px] tracking-[0.16em] uppercase">Чек-ин · {data.stage} · закроется через</span>
          <Countdown to={data.closesAt} className="font-display text-[64px] leading-none tab:text-[80px]" />
        </div>
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="mono flex justify-between text-[11px] tracking-[0.16em] uppercase">
            <span className="text-text-2">
              Готовы {ready} из {data.rows.length} команд
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} label="Готовность команд" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button icon={Clock} onClick={() => act("extend")}>
            Продлить на 5 мин
          </Button>
          <Button variant="primary" icon={Check} onClick={() => setAsk({ kind: "close" })}>
            Закрыть и построить
          </Button>
        </div>
      </section>
      <Card>
        <CardHeader title="Команды">
          <Button size="sm" variant="ghost" icon={Send} onClick={() => act("remind_all")}>
            Напомнить всем
          </Button>
        </CardHeader>
        <Table minWidth={720} label="Чек-ин команд">
          <THead>
            <Th sticky>Команда</Th>
            <Th>Игроки</Th>
            <Th>Статус</Th>
            <Th align="right" />
          </THead>
          <tbody>
            {data.rows.map((r) => (
              <Tr key={r.team.slug}>
                <Td sticky>
                  <span className="flex items-center gap-3">
                    <TeamLogo tag={r.team.tag} size={32} />
                    <span className="font-semibold">{r.team.name}</span>
                  </span>
                </Td>
                <Td className="mono font-medium">
                  {r.ready}/{r.total}
                </Td>
                <Td>
                  <Badge tone={STATUS[r.status].tone} dot={r.status === "none"}>
                    {STATUS[r.status].label}
                  </Badge>
                </Td>
                <Td align="right">
                  {r.status === "ready" ? (
                    <Button size="sm" variant="ghost" onClick={() => act("unmark", r)}>
                      Снять отметку
                    </Button>
                  ) : (
                    <span className="flex justify-end gap-2">
                      <Button size="sm" icon={Bell} onClick={() => act("remind", r)}>
                        Напомнить
                      </Button>
                      {r.status === "none" && (
                        <Button size="sm" variant="danger" onClick={() => setAsk({ kind: "dq", row: r })}>
                          Дисквал.
                        </Button>
                      )}
                    </span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <ConfirmModal
        open={!!ask}
        onClose={() => setAsk(null)}
        danger={ask?.kind === "dq"}
        title={ask?.kind === "dq" ? `Дисквалифицировать ${ask.row.team.name}?` : "Закрыть чек-ин и построить сетку?"}
        text={ask?.kind === "dq" ? "Команда не отметилась. Сопернику будет засчитано тех. поражение, команда выбывает из турнира." : `Не отметились: ${data.rows.filter((r) => r.status !== "ready").map((r) => r.team.name).join(", ") || "нет"}. Им засчитается тех. поражение.`}
        confirmLabel={ask?.kind === "dq" ? "Дисквалифицировать" : "Закрыть и построить"}
        onConfirm={() => {
          if (ask?.kind === "dq") act("disqualify", ask.row);
          else act("close");
          setAsk(null);
        }}
      />
    </div>
  );
}
