"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Download, Search, Send, Upload } from "lucide-react";
import type { Participant } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { GAME_NAMES } from "@/shared/lib/labels";
import { download } from "@/shared/lib/format";
import { hasPlan } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers, KeyRow } from "@/shared/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/shared/ui/form";
import { PageHeader, StatTile, TableSkeleton, TeamLogo } from "@/shared/ui/misc";
import { Modal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

const LABEL_TONE = { gold: "gold", violet: "violet-solid", neutral: "accent" } as const;
const CSV_FIELDS = ["Команда", "Капитан", "Город", "Игра", "Контакт"];

export function ParticipantsScreen({ initial }: { initial: Participant[] }) {
  const user = useUser();
  const pro = hasPlan(user, "pro");
  const [kind, setKind] = useState<"teams" | "players">("teams");
  const [search, setSearch] = useState("");
  const [game, setGame] = useState("");
  const [label, setLabel] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>(initial[0]?.team.slug);
  const [importOpen, setImportOpen] = useState(false);
  const q = { kind, search };
  const { data, isFetching } = useQuery({ queryKey: qk.participants(q), queryFn: () => api.participants(q), initialData: !search && kind === "teams" ? initial : undefined });

  const list = useMemo(() => (data ?? []).filter((p) => (!game || p.game === game) && (!label || p.label?.text === label)), [data, game, label]);
  const sel = list.find((p) => p.team.slug === current) ?? list[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Организатор // CRM"
        title="База участников"
        sub="Все команды и игроки, которые участвовали в ваших турнирах"
        actions={
          <>
            <Button icon={Upload} onClick={() => setImportOpen(true)}>
              Импорт CSV
            </Button>
            <Button
              icon={Download}
              onClick={() => {
                if (!pro) return toast.info("Экспорт базы — в Pro", "Откройте /pricing, чтобы сравнить тарифы");
                download("participants.csv", "﻿" + ["Команда;Город;Турниров;Винрейт;Метка", ...list.map((p) => `${p.team.name};${p.city};${p.tournaments};${p.winrate}%;${p.label?.text ?? ""}`)].join("\n"), "text/csv");
              }}
            >
              Экспорт {!pro && <span className="mono ml-1 text-[9px] text-gold">PRO</span>}
            </Button>
          </>
        }
      />
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="Команд" value="48" />
        <StatTile label="Игроков" value="256" />
        <StatTile label="Новых за месяц" value="+14" tone="accent" />
        <StatTile label="Постоянных" value="21" sub="3+ турнира" />
      </div>
      <div className="grid gap-6 desk:grid-cols-[1fr_340px]">
        <Card className="min-w-0 self-start">
          <CardHeader title={kind === "teams" ? "Команды" : "Игроки"}>
            <Segmented label="Раздел" active={kind} onChange={setKind} items={[{ key: "teams", label: "Команды" }, { key: "players", label: "Игроки" }]} />
          </CardHeader>
          <div className="flex flex-wrap gap-3 border-b border-line px-6 py-4">
            <div className="min-w-[220px] flex-1">
              <Input icon={Search} type="search" placeholder="Название, капитан, игрок" aria-label="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11" />
            </div>
            <div className="w-[150px]">
              <Select aria-label="Игра" value={game} onChange={(e) => setGame(e.target.value)} className="h-11">
                <option value="">Все игры</option>
                <option value="valorant">Valorant</option>
                <option value="cs2">CS2</option>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select aria-label="Метка" value={label} onChange={(e) => setLabel(e.target.value)} className="h-11">
                <option value="">Все метки</option>
                <option>VIP</option>
                <option>Студенты</option>
                <option>Предупреждение</option>
              </Select>
            </div>
          </div>
          {isFetching && !data ? (
            <TableSkeleton />
          ) : (
            <Table minWidth={780} label="Участники">
              <THead>
                <Th className="w-12">
                  <Checkbox aria-label="Выбрать все" checked={picked.length === list.length && list.length > 0} onChange={(e) => setPicked(e.target.checked ? list.map((p) => p.team.slug) : [])} />
                </Th>
                <Th sticky>Команда</Th>
                <Th>Город</Th>
                <Th align="right">Турниров</Th>
                <Th align="right">Винрейт</Th>
                <Th>Метка</Th>
                <Th>Последний</Th>
                <Th />
              </THead>
              <tbody>
                {list.map((p) => (
                  <Tr key={p.team.slug} active={sel?.team.slug === p.team.slug}>
                    <Td>
                      <Checkbox aria-label={`Выбрать ${p.team.name}`} checked={picked.includes(p.team.slug)} onChange={(e) => setPicked((s) => (e.target.checked ? [...s, p.team.slug] : s.filter((x) => x !== p.team.slug)))} />
                    </Td>
                    <Td sticky>
                      <span className="flex items-center gap-3">
                        <TeamLogo tag={p.team.tag} size={32} />
                        <span className="flex flex-col">
                          <span className="font-semibold">{p.team.name}</span>
                          <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{GAME_NAMES[p.game]}</span>
                        </span>
                      </span>
                    </Td>
                    <Td>{p.city}</Td>
                    <Td align="right" className="mono">{p.tournaments}</Td>
                    <Td align="right" className="mono">{p.winrate}%</Td>
                    <Td>{p.label ? <Badge tone={LABEL_TONE[p.label.tone]} dot={p.label.tone === "neutral"}>{p.label.text}</Badge> : <span className="text-text-4">—</span>}</Td>
                    <Td className="mono">{p.last}</Td>
                    <Td align="right">
                      <IconButton icon={ChevronRight} label={`Открыть карточку ${p.team.name}`} size={32} active={sel?.team.slug === p.team.slug} onClick={() => setCurrent(p.team.slug)} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        {sel && <ParticipantCard key={sel.team.slug} p={sel} />}
      </div>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function ParticipantCard({ p }: { p: Participant }) {
  const [note, setNote] = useState(p.note);
  const [saved, setSaved] = useState(p.note);
  return (
    <aside className="relative flex flex-col self-start border border-line bg-elev-1 desk:sticky desk:top-24">
      <CornerMarkers only="tl" offset={6} />
      <div className="flex items-center gap-4 border-b border-line p-6">
        <TeamLogo tag={p.team.tag} size={56} />
        <div className="flex flex-col gap-2">
          <span className="font-display text-[30px] leading-none">{p.team.name}</span>
          <span className="flex items-center gap-2">
            {p.label && <Badge tone={LABEL_TONE[p.label.tone]}>{p.label.text}</Badge>}
            <span className="mono text-[10px] text-text-3">С {p.since}</span>
          </span>
        </div>
      </div>
      <KeyRow k="Капитан" v={`${p.captain} · ${p.captainContact}`} />
      <KeyRow k="Турниров у вас" v={p.tournaments} />
      <KeyRow k="Лучший результат" v={p.best} />
      <KeyRow k="Неявки" v={p.noShows} />
      <KeyRow k="Споры" v={p.disputes} />
      <div className="flex flex-col gap-3 p-6">
        <Field label="Заметка" htmlFor="note" hint={note !== saved ? "Не сохранено" : "Видна только вашей команде организаторов"}>
          <Textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={async () => {
              if (note === saved) return;
              await api.saveNote(p.team.slug, note);
              setSaved(note);
              toast.success("Заметка сохранена");
            }}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={Send} className="flex-1" onClick={() => toast.success(`Приглашение отправлено капитану ${p.captain}`)}>
            Пригласить на турнир
          </Button>
          <Button href="/org/mailings">Написать</Button>
        </div>
      </div>
    </aside>
  );
}

/** Импорт CSV: превью и сопоставление колонок */
function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [map, setMap] = useState<Record<string, number>>({});
  const parse = async (f: File) => {
    const text = await f.text();
    const sep = text.includes(";") ? ";" : ",";
    const parsed = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean).map((l) => l.split(sep).map((c) => c.replace(/^"|"$/g, "")));
    setRows(parsed);
    setMap(Object.fromEntries(CSV_FIELDS.map((f, i) => [f, Math.min(i, (parsed[0]?.length ?? 1) - 1)])));
  };
  const headers = rows?.[0] ?? [];
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Импорт участников из CSV"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            disabled={!rows}
            onClick={() => {
              toast.success(`Импортировано: ${(rows?.length ?? 1) - 1} записей`);
              setRows(null);
              onClose();
            }}
          >
            Импортировать
          </Button>
        </>
      }
    >
      {!rows ? (
        <label className="flex cursor-pointer flex-col items-center gap-3 border border-dashed border-text-4 px-6 py-12 text-center hover:border-line-strong">
          <Upload size={24} className="text-text-2" aria-hidden />
          <span className="font-semibold">Выберите CSV-файл</span>
          <span className="mono-label">UTF-8 · разделитель ; или ,</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} />
        </label>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 tab:grid-cols-2">
            {CSV_FIELDS.map((f) => (
              <Field key={f} label={f} htmlFor={`map-${f}`}>
                <Select id={`map-${f}`} value={map[f]} onChange={(e) => setMap((m) => ({ ...m, [f]: Number(e.target.value) }))}>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Колонка ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  {CSV_FIELDS.map((f) => (
                    <th key={f} className="mono-label px-3 py-2 text-left">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1, 6).map((r, i) => (
                  <tr key={i} className={cn("border-b border-line last:border-0")}>
                    {CSV_FIELDS.map((f) => (
                      <td key={f} className="px-3 py-2">
                        {r[map[f]] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="mono-label">Превью: первые 5 из {rows.length - 1} строк</span>
        </div>
      )}
    </Modal>
  );
}
