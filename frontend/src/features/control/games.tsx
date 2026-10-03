"use client";

import { useState } from "react";
import { Check, Eye, History, Pencil, Plus } from "lucide-react";
import type { BracketFormat, Game } from "@/shared/api/types";
import { ACCOUNT_LABELS } from "@/shared/lib/labels";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Field, Input, Select, Textarea, Toggle } from "@/shared/ui/form";
import { PageHeader, TeamLogo } from "@/shared/ui/misc";
import { Modal } from "@/shared/ui/overlay";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

const FMT_SHORT: Record<BracketFormat, string> = { single: "SE", double: "DE", groups: "Группы", swiss: "Швейцарка", league: "Лига" };
const FORMATS: { key: BracketFormat; name: string; scope: string }[] = [
  { key: "single", name: "Single Elimination", scope: "Все игры" },
  { key: "double", name: "Double Elimination", scope: "Все игры" },
  { key: "groups", name: "Группы + плей-офф", scope: "Командные" },
  { key: "swiss", name: "Швейцарская система", scope: "Бета · Valorant, CS2" },
];

/** Эти данные управляют мастером создания турнира, онбордингом и заявками — на фронте не хардкодятся */
export function GamesScreen({ initial }: { initial: Game[] }) {
  const [games, setGames] = useState(initial);
  const [formats, setFormats] = useState<Record<string, boolean>>({ single: true, double: true, groups: true, swiss: true });
  const [tplGame, setTplGame] = useState(initial[0].slug);
  const [tpl, setTpl] = useState("1. Турнир проводится по правилам Riot Games.\n2. Опоздание более 10 минут — техническое поражение.\n3. Споры решает главный судья.");
  const [edit, setEdit] = useState<Game | "new" | null>(null);
  const [form, setForm] = useState({ name: "", publisher: "", size: "5", main: "5", subs: "2", check: "manual" });

  const openEdit = (g: Game | "new") => {
    setEdit(g);
    setForm(g === "new" ? { name: "", publisher: "", size: "5", main: "5", subs: "1", check: "manual" } : { name: g.name, publisher: g.publisher, size: String(g.teamSize), main: String(g.roster.main), subs: String(g.roster.subs), check: g.accountCheck });
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Админка // Каталог"
        title="Игры и форматы"
        sub="Что можно выбрать при создании турнира"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openEdit("new")}>
            Добавить игру
          </Button>
        }
      />
      <Card>
        <CardHeader title="Игры" />
        <Table minWidth={860} label="Игры">
          <THead>
            <Th sticky>Игра</Th>
            <Th>Форматы</Th>
            <Th>Состав</Th>
            <Th>Проверка аккаунта</Th>
            <Th>Статус</Th>
            <Th align="right" />
          </THead>
          <tbody>
            {games.map((g) => (
              <Tr key={g.slug}>
                <Td sticky>
                  <span className="flex items-center gap-3">
                    <TeamLogo tag={g.short} size={32} />
                    <span className="flex flex-col">
                      <span className="font-semibold">{g.name}</span>
                      <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">
                        {g.publisher} · {g.teamSize}×{g.teamSize}
                      </span>
                    </span>
                  </span>
                </Td>
                <Td className="text-text-2">{g.formats.map((f) => FMT_SHORT[f]).join(" · ")}</Td>
                <Td className="mono font-medium">{g.roster.subs ? `${g.roster.main} + ${g.roster.subs}` : g.roster.main}</Td>
                <Td>
                  <Badge tone={g.accountCheck === "manual" ? "muted" : "success"}>{ACCOUNT_LABELS[g.accountCheck]}</Badge>
                </Td>
                <Td>
                  <Badge tone={g.status === "active" ? "success" : "gold"}>{g.status === "active" ? "Активна" : "Бета"}</Badge>
                </Td>
                <Td align="right">
                  <span className="flex justify-end gap-2">
                    <IconButton icon={Pencil} label={`Редактировать ${g.name}`} size={32} onClick={() => openEdit(g)} />
                    <IconButton icon={Eye} label={`Турниры по ${g.name}`} size={32} href={`/tournaments?game=${g.slug}`} />
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <div className="grid gap-6 desk:grid-cols-2">
        <Card>
          <CardHeader title="Форматы сетки" />
          {FORMATS.map((f) => (
            <div key={f.key} className="flex items-center gap-5 border-b border-line px-6 py-4 last:border-b-0">
              <span className="mono w-10 text-[12px] text-text-2">{FMT_SHORT[f.key].slice(0, 2).toUpperCase()}</span>
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{f.name}</span>
                <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{f.scope}</span>
              </span>
              <Toggle
                checked={formats[f.key]}
                onChange={(v) => {
                  setFormats((s) => ({ ...s, [f.key]: v }));
                  toast.success(`${f.name}: ${v ? "доступен" : "скрыт"} в мастере`);
                }}
                label={<span className="sr-only">{f.name}</span>}
              />
            </div>
          ))}
        </Card>
        <Card tone="raised" className="flex flex-col gap-4 p-6">
          <CornerMarkers only="tl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="t-h3">Шаблон регламента</h2>
            <div className="w-[180px]">
              <Select aria-label="Игра шаблона" value={tplGame} onChange={(e) => setTplGame(e.target.value as Game["slug"])} options={games.map((g) => ({ value: g.slug, label: g.name }))} />
            </div>
          </div>
          <Field label="Текст по умолчанию" htmlFor="tpl">
            <Textarea id="tpl" rows={6} value={tpl} onChange={(e) => setTpl(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon={Check} onClick={() => toast.success("Шаблон сохранён", "Новая версия применится к новым турнирам")}>
              Сохранить шаблон
            </Button>
            <Button variant="ghost" icon={History} onClick={() => toast.info("История версий", "v3 · 24.09 · Админ · v2 · 02.09 · v1 · 10.08")}>
              История версий
            </Button>
          </div>
        </Card>
      </div>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit === "new" ? "Новая игра" : `Игра · ${edit && edit.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              disabled={form.name.trim().length < 2}
              onClick={() => {
                const patch = { name: form.name, publisher: form.publisher, teamSize: +form.size, roster: { main: +form.main, subs: +form.subs }, accountCheck: form.check as Game["accountCheck"] };
                if (edit === "new") setGames((l) => [...l, { ...patch, slug: form.name.toLowerCase().replace(/\W+/g, "") as Game["slug"], short: form.name.slice(0, 2).toUpperCase(), formats: ["single"], status: "beta" }]);
                else if (edit) setGames((l) => l.map((g) => (g.slug === edit.slug ? { ...g, ...patch } : g)));
                setEdit(null);
                toast.success("Игра сохранена");
              }}
            >
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Название" htmlFor="gn">
            <Input id="gn" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Издатель" htmlFor="gp">
            <Input id="gp" value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} />
          </Field>
          <Field label="Игроков в команде" htmlFor="gs">
            <Input id="gs" inputMode="numeric" value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value.replace(/\D/g, "") }))} />
          </Field>
          <Field label="Проверка аккаунта" htmlFor="gc">
            <Select id="gc" value={form.check} onChange={(e) => setForm((f) => ({ ...f, check: e.target.value }))} options={[{ value: "riot", label: "Riot ID" }, { value: "steam", label: "Steam" }, { value: "manual", label: "Вручную" }]} />
          </Field>
          <Field label="Основных" htmlFor="gm">
            <Input id="gm" inputMode="numeric" value={form.main} onChange={(e) => setForm((f) => ({ ...f, main: e.target.value.replace(/\D/g, "") }))} />
          </Field>
          <Field label="Запасных" htmlFor="gsb">
            <Input id="gsb" inputMode="numeric" value={form.subs} onChange={(e) => setForm((f) => ({ ...f, subs: e.target.value.replace(/\D/g, "") }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
