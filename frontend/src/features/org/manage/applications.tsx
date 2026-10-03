"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Download, Search } from "lucide-react";
import type { Application } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { fmtDayTime } from "@/shared/lib/format";
import { can } from "@/shared/lib/permissions";
import { download } from "@/shared/lib/format";
import { toast, useUser } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/shared/ui/form";
import { StatTile, TeamLogo } from "@/shared/ui/misc";
import { Modal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { EmptyStateView } from "@/shared/ui/empty-state";

type Filter = "all" | "new" | "problems" | "approved";

const CHECK_TONE = { ok: "success", missing_account: "gold", incomplete: "accent" } as const;

export function ApplicationsScreen({ id, initial, max }: { id: string; initial: Application[]; max: number }) {
  const qc = useQueryClient();
  const user = useUser();
  const allowed = can(user, "applications.decide");
  const { data = [] } = useQuery({ queryKey: qk.applications(id), queryFn: () => api.applications(id), initialData: initial });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [reject, setReject] = useState<Application | null>(null);
  const [reason, setReason] = useState("Неполный состав");
  const [comment, setComment] = useState("");

  const decide = useMutation({
    mutationFn: ({ ids, approve, reason }: { ids: string[]; approve: boolean; reason?: string }) => api.decideApplications(id, ids, approve, reason),
    onMutate: async ({ ids, approve }) => {
      await qc.cancelQueries({ queryKey: qk.applications(id) });
      const prev = qc.getQueryData<Application[]>(qk.applications(id));
      qc.setQueryData<Application[]>(qk.applications(id), (l) => l?.map((a) => (ids.includes(a.id) ? { ...a, status: approve ? "approved" : "rejected" } : a)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.applications(id), ctx?.prev);
      toast.error("Не удалось сохранить решение");
    },
    onSuccess: (_d, { ids, approve }) => {
      setSelected([]);
      toast.success(approve ? `Одобрено: ${ids.length}` : "Заявка отклонена", approve ? undefined : "Капитан получит причину в уведомлении");
    },
  });

  const list = useMemo(
    () =>
      data.filter((a) => {
        if (a.status === "rejected") return false;
        if (search && !`${a.team.name} ${a.captain}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (filter === "new") return a.status === "pending";
        if (filter === "problems") return a.check !== "ok";
        if (filter === "approved") return a.status === "approved";
        return true;
      }),
    [data, filter, search],
  );

  const pending = data.filter((a) => a.status === "pending");
  const approved = data.filter((a) => a.status === "approved").length;
  const clean = pending.filter((a) => a.check === "ok");

  const exportCsv = () => {
    const rows = [["Команда", "Капитан", "Состав", "Проверка", "Подана", "Статус"], ...data.map((a) => [a.team.name, a.captain, `${a.roster.main}+${a.roster.subs}`, a.checkLabel, a.submittedAt, a.status])];
    download("applications.csv", "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n"), "text/csv");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="Заявок" value={String(data.length).padStart(2, "0")} />
        <StatTile label="Ждут решения" value={String(pending.length).padStart(2, "0")} tone="accent" />
        <StatTile label="Одобрено" value={String(approved).padStart(2, "0")} />
        <StatTile label="Свободных мест" value={`${max - approved} / ${max}`} />
      </div>
      <Card>
        <CardHeader title="Заявки команд">
          <Button size="sm" variant="ghost" icon={Download} onClick={exportCsv}>
            Экспорт CSV
          </Button>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
          <div className="w-full tab:w-[280px]">
            <Input icon={Search} type="search" placeholder="Команда или капитан" aria-label="Поиск заявок" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10" />
          </div>
          <Segmented
            label="Фильтр"
            active={filter}
            onChange={setFilter}
            items={[
              { key: "all", label: "Все" },
              { key: "new", label: "Новые" },
              { key: "problems", label: "С проблемами" },
              { key: "approved", label: "Одобрены" },
            ]}
          />
        </div>
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyStateView code="EMPTY.SEARCH" icon={Search} title="Ничего не найдено" text="Попробуйте другой запрос или сбросьте фильтры." onCta={() => { setFilter("all"); setSearch(""); }} cta={{ label: "Сбросить фильтры" }} />
          </div>
        ) : (
          <Table minWidth={980} label="Заявки">
            <THead>
              <Th className="w-12">
                <Checkbox aria-label="Выбрать все" checked={selected.length > 0 && selected.length === list.filter((a) => a.status === "pending").length} onChange={(e) => setSelected(e.target.checked ? list.filter((a) => a.status === "pending").map((a) => a.id) : [])} />
              </Th>
              <Th sticky>Команда</Th>
              <Th>Состав</Th>
              <Th>Проверка</Th>
              <Th>Подана</Th>
              <Th align="right" />
            </THead>
            <tbody>
              {list.map((a) => (
                <Fragment key={a.id}>
                  <Tr active={open === a.id}>
                    <Td>
                      <Checkbox aria-label={`Выбрать ${a.team.name}`} disabled={a.status !== "pending"} checked={selected.includes(a.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))} />
                    </Td>
                    <Td sticky>
                      <button type="button" className="flex items-center gap-3 text-left" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                        <TeamLogo tag={a.team.tag} size={32} />
                        <span className="flex flex-col">
                          <span className="font-semibold">{a.team.name}</span>
                          <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">Капитан · {a.captain}</span>
                        </span>
                        <ChevronDown size={14} className={cn("text-text-3 transition-transform", open === a.id && "rotate-180")} aria-hidden />
                      </button>
                    </Td>
                    <Td className="mono">
                      {a.roster.main} + {a.roster.subs}
                    </Td>
                    <Td>
                      <Badge tone={CHECK_TONE[a.check]} dot={a.check === "incomplete"}>
                        {a.checkLabel}
                      </Badge>
                    </Td>
                    <Td className="mono">{fmtDayTime(a.submittedAt)}</Td>
                    <Td align="right">
                      {a.status === "approved" ? (
                        <Badge tone="success">Одобрена</Badge>
                      ) : allowed ? (
                        <span className="flex justify-end gap-2">
                          <Button size="sm" variant="primary" icon={Check} onClick={() => decide.mutate({ ids: [a.id], approve: true })}>
                            Одобрить
                          </Button>
                          <Button size="sm" onClick={() => setReject(a)}>
                            Отклонить
                          </Button>
                        </span>
                      ) : (
                        <Badge tone="muted">Ждёт решения</Badge>
                      )}
                    </Td>
                  </Tr>
                  {open === a.id && (
                    <tr className="border-b border-line bg-elev-1">
                      <td colSpan={6} className="px-6 py-4">
                        <ul className="grid gap-2 tab:grid-cols-3 desk:grid-cols-4">
                          {a.members.map((m) => (
                            <li key={m.nick} className={cn("flex items-center justify-between border px-3 py-2 text-[13px]", m.account ? "border-line" : "border-gold")}>
                              {m.nick}
                              <span className={cn("mono text-[10px]", m.account ? "text-success-text" : "text-gold")}>{m.account ? "RI · OK" : "Нет Riot ID"}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
        {allowed && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
            <span className="mono-label">Выбрано: {selected.length}</span>
            <div className="flex gap-3">
              {selected.length > 0 && (
                <Button size="sm" variant="primary" icon={Check} onClick={() => decide.mutate({ ids: selected, approve: true })}>
                  Одобрить выбранные
                </Button>
              )}
              <Button size="sm" icon={Check} disabled={!clean.length} onClick={() => decide.mutate({ ids: clean.map((a) => a.id), approve: true })}>
                Одобрить все без проблем
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        title={`Отклонить ${reject?.team.name ?? ""}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReject(null)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (reject) decide.mutate({ ids: [reject.id], approve: false, reason: `${reason}${comment ? `. ${comment}` : ""}` });
                setReject(null);
                setComment("");
              }}
            >
              Отклонить заявку
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Причина" htmlFor="reason">
            <Select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} options={["Неполный состав", "Игрок без игрового аккаунта", "Нет свободных мест", "Нарушение правил платформы", "Другое"]} />
          </Field>
          <Field label="Комментарий капитану" htmlFor="rcomment" hint="Капитан увидит причину и комментарий в уведомлении">
            <Textarea id="rcomment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
