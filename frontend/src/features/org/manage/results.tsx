"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Flag, Pencil } from "lucide-react";
import type { Dispute, Match } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { MATCH_STATUS } from "@/shared/lib/labels";
import { can } from "@/shared/lib/permissions";
import { ago } from "@/shared/lib/format";
import { toast, useUser } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Field, Input, RadioCard, Textarea } from "@/shared/ui/form";
import { Placeholder, TableSkeleton, TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal, Modal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

/*
 * Статусы и переходы одинаково показываются на экранах 06, 26 и 36.
 * Переходы делает бэкенд; фронт показывает статус и нужные кнопки.
 */
export function ResultsScreen({ id, initial }: { id: string; initial: Match[] }) {
  const qc = useQueryClient();
  const user = useUser();
  const canEdit = can(user, "results.edit");
  const { data: matches = [] } = useQuery({ queryKey: qk.orgMatches(id), queryFn: () => api.orgMatches(id), initialData: initial });
  const [filter, setFilter] = useState<"all" | "dispute" | "awaiting">("all");
  const [selected, setSelected] = useState<string | null>(matches.find((m) => m.status === "dispute")?.code ?? null);
  const [edit, setEdit] = useState<Match | null>(null);
  const [forfeit, setForfeit] = useState<Match | null>(null);

  const confirm = useMutation({
    mutationFn: (code: string) => api.confirmMatch(id, code),
    onSuccess: (_d, code) => {
      qc.setQueryData<Match[]>(qk.orgMatches(id), (l) => l?.map((m) => (m.code === code ? { ...m, status: "confirmed" } : m)));
      toast.success(`${code}: счёт подтверждён`, "Победитель прошёл дальше по сетке");
    },
  });

  const list = matches.filter((m) => filter === "all" || m.status === filter);
  const nDispute = matches.filter((m) => m.status === "dispute").length;
  const nAwait = matches.filter((m) => m.status === "awaiting").length;

  const action = (m: Match) => {
    if (!canEdit) return null;
    switch (m.status) {
      case "confirmed":
        return (
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(m)}>
            Изменить
          </Button>
        );
      case "awaiting":
        return (
          <span className="flex justify-end gap-2">
            <Button size="sm" variant="primary" loading={confirm.isPending && confirm.variables === m.code} onClick={() => confirm.mutate(m.code)}>
              Подтвердить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(m)}>
              Изменить
            </Button>
          </span>
        );
      case "dispute":
        return (
          <Button size="sm" variant="danger" icon={Flag} onClick={() => setSelected(m.code)} className={cn(selected === m.code && "bg-elev-2")}>
            Рассмотреть
          </Button>
        );
      case "live":
        return (
          <Button size="sm" onClick={() => setEdit(m)}>
            Внести счёт
          </Button>
        );
      default:
        return (
          <Button size="sm" variant="ghost" onClick={() => setForfeit(m)}>
            Тех. поражение
          </Button>
        );
    }
  };

  return (
    <div className="grid gap-6 desk:grid-cols-[1fr_440px]">
      <Card className="min-w-0 self-start">
        <CardHeader title="Матчи">
          <Segmented
            label="Фильтр матчей"
            active={filter}
            onChange={setFilter}
            items={[
              { key: "all", label: "Все" },
              { key: "dispute", label: `Спорные · ${nDispute}` },
              { key: "awaiting", label: `Ждут · ${nAwait}` },
            ]}
          />
        </CardHeader>
        <Table minWidth={680} label="Матчи турнира">
          <THead>
            <Th>Код</Th>
            <Th sticky>Матч</Th>
            <Th>Счёт</Th>
            <Th>Статус</Th>
            <Th align="right" />
          </THead>
          <tbody>
            {list.map((m) => {
              const st = MATCH_STATUS[m.status];
              return (
                <Tr key={m.code} active={selected === m.code}>
                  <Td className="mono text-[11px] text-text-3">{m.code}</Td>
                  <Td sticky>
                    <span className="flex items-center gap-3">
                      <TeamLogo tag={m.a.team?.tag ?? "?"} size={28} />
                      <span className="font-semibold">
                        {m.a.team?.name ?? "TBD"} vs {m.b.team?.name ?? "TBD"}
                      </span>
                    </span>
                  </Td>
                  <Td className="font-display text-[20px]">{m.a.score !== null && m.b.score !== null ? `${m.a.score} : ${m.b.score}` : "—"}</Td>
                  <Td>
                    <Badge tone={m.status === "tbd" ? "muted" : st.tone} dot={st.dot}>
                      {m.status === "tbd" ? "Ожидает" : st.label}
                    </Badge>
                  </Td>
                  <Td align="right">{action(m)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      {selected ? <DisputePanel id={id} code={selected} onResolved={() => setSelected(null)} /> : <p className="border border-dashed border-text-4 p-6 text-[14px] text-text-3">Выберите спорный матч, чтобы рассмотреть заявления команд.</p>}

      <ScoreModal id={id} m={edit} onClose={() => setEdit(null)} />
      <ConfirmModal
        open={!!forfeit}
        onClose={() => setForfeit(null)}
        danger
        title={`Тех. поражение в ${forfeit?.code ?? ""}?`}
        text="Неявка на чек-ин сразу даёт тех. поражение. Выберите в карточке матча, какой команде засчитать поражение — победитель пройдёт дальше."
        confirmLabel="Засчитать"
        onConfirm={() => {
          toast.success("Тех. поражение засчитано");
          setForfeit(null);
        }}
      />
    </div>
  );
}

function DisputePanel({ id, code, onResolved }: { id: string; code: string; onResolved: () => void }) {
  const qc = useQueryClient();
  const user = useUser();
  const { data: d, isLoading } = useQuery({ queryKey: qk.dispute(id, code), queryFn: () => api.dispute(id, code) });
  const [decision, setDecision] = useState<string>("a");
  const [comment, setComment] = useState("По демо победа Samurai KG, 13 : 10. Решение окончательное.");
  const [zoom, setZoom] = useState<string | null>(null);

  const resolve = useMutation({
    mutationFn: (dec: string) => api.resolveDispute(id, code, { decision: dec, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.orgMatches(id) });
      toast.success("Решение вынесено", decision === "replay" ? "Переигровка назначена — выберите слот в расписании" : "Победитель автоматически прошёл дальше по сетке");
      onResolved();
    },
  });

  if (isLoading || !d) return <Card><TableSkeleton rows={4} /></Card>;
  const canResolve = can(user, "disputes.resolve");
  const [a, b] = (d as Dispute).claims;

  return (
    <section className="relative self-start border border-accent bg-elev-1" aria-labelledby="dispute-h">
      <CornerMarkers offset={6} />
      <CardHeader id="dispute-h" title={`Спор · ${code}`}>
        <Badge tone="accent" dot>
          Открыт {ago(d.openedAt)} назад
        </Badge>
      </CardHeader>
      <div className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-3">
          {d.claims.map((c) => (
            <div key={c.team.slug} className="flex flex-col gap-3 border border-line bg-bg p-4">
              <span className="flex items-center gap-2">
                <TeamLogo tag={c.team.tag} size={28} />
                <span className="font-semibold">{c.team.name}</span>
              </span>
              <span className="mono-label">Заявляет</span>
              <span className="font-display text-[36px] leading-none">{c.score}</span>
              <button type="button" onClick={() => setZoom(c.team.name)} className="block" aria-label={`Скриншот ${c.team.name} в полном размере`}>
                <Placeholder label="Скриншот" className="h-[90px] border border-line hover:border-line-strong" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[14px] text-text-2 italic">
          «{d.comment}» — {d.commentBy}
        </p>
        {canResolve ? (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="mono-label mb-3">Решение судьи</legend>
              <div className="grid grid-cols-3 gap-2">
                <RadioCard name="dec" value="a" title={a.team.name} text={a.score} checked={decision === "a"} onSelect={() => setDecision("a")} className="p-4 [&_.font-display]:text-[18px]" />
                <RadioCard name="dec" value="b" title={b.team.name} text={b.score.split(" : ").reverse().join(" : ")} checked={decision === "b"} onSelect={() => setDecision("b")} className="p-4 [&_.font-display]:text-[18px]" />
                <RadioCard name="dec" value="replay" title="Переигровка" text="Назначить новый матч" checked={decision === "replay"} onSelect={() => setDecision("replay")} className="p-4 [&_.font-display]:text-[18px]" />
              </div>
            </fieldset>
            <Field label="Комментарий для команд" htmlFor="jc">
              <Textarea id="jc" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Button variant="primary" icon={Check} loading={resolve.isPending && resolve.variables !== "forfeit"} onClick={() => resolve.mutate(decision)}>
                Вынести решение
              </Button>
              <Button loading={resolve.isPending && resolve.variables === "forfeit"} onClick={() => resolve.mutate("forfeit")}>
                Тех. поражение
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-text-3">Решать споры могут Владелец, Админ и Судья.</p>
        )}
      </div>
      <Modal open={!!zoom} onClose={() => setZoom(null)} title={`Скриншот · ${zoom ?? ""}`} size="lg">
        <Placeholder label="Скриншот в полном размере" aspect="16 / 9" className="border border-line" />
      </Modal>
    </section>
  );
}

function ScoreModal({ id, m, onClose }: { id: string; m: Match | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [prev, setPrev] = useState<Match | null>(null);
  if (m !== prev) {
    setPrev(m);
    setA(m?.a.score?.toString() ?? "");
    setB(m?.b.score?.toString() ?? "");
  }
  return (
    <Modal
      open={!!m}
      onClose={onClose}
      title={`Счёт · ${m?.code ?? ""}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            disabled={a === "" || b === "" || a === b}
            onClick={async () => {
              if (!m) return;
              await api.confirmMatch(id, m.code);
              qc.setQueryData<Match[]>(qk.orgMatches(id), (l) => l?.map((x) => (x.code === m.code ? { ...x, status: "confirmed", a: { ...x.a, score: +a }, b: { ...x.b, score: +b } } : x)));
              toast.success("Счёт сохранён", "Победитель прошёл дальше по сетке");
              onClose();
            }}
          >
            Сохранить
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field label={m?.a.team?.name ?? "A"} htmlFor="sa">
          <Input id="sa" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} className="font-display text-center text-[24px]" />
        </Field>
        <span className="pb-3 text-text-3">:</span>
        <Field label={m?.b.team?.name ?? "B"} htmlFor="sb">
          <Input id="sb" inputMode="numeric" value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} className="font-display text-center text-[24px]" />
        </Field>
      </div>
    </Modal>
  );
}
