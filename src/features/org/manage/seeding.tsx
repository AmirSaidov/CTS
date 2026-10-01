"use client";

import { useId, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChartColumn, GripVertical, Info, RefreshCw, Shuffle } from "lucide-react";
import type { Bracket, TeamRef } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { cn } from "@/shared/lib/cn";
import { pad2 } from "@/shared/lib/format";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { BracketView } from "@/features/bracket/bracket-view";

function SeedRow({ team, index }: { team: TeamRef; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: team.slug });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 border bg-elev-1 px-3 py-3", isDragging ? "z-10 border-accent bg-elev-2" : "border-line")}
    >
      <button type="button" className="cursor-grab touch-none text-text-3 hover:text-text active:cursor-grabbing" aria-label={`Переместить ${team.name}, посев ${index + 1}. Пробел — взять, стрелки — двигать`} {...attributes} {...listeners}>
        <GripVertical size={16} aria-hidden />
      </button>
      <span className="mono w-8 text-[11px] text-text-3">#{pad2(index + 1)}</span>
      <TeamLogo tag={team.tag} size={26} />
      <span className="flex-1 truncate font-semibold">{team.name}</span>
    </li>
  );
}

export function SeedingScreen({ id, initialSeeds, initialBracket, rankOrder }: { id: string; initialSeeds: TeamRef[]; initialBracket: Bracket; rankOrder: string[] }) {
  const [seeds, setSeeds] = useState(initialSeeds);
  const [format, setFormat] = useState<"single" | "double" | "groups">("single");
  const [bracket, setBracket] = useState(initialBracket);
  const [stale, setStale] = useState(false);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState<"regen" | "save" | null>(null);
  // стабильный id: иначе aria-describedby у dnd-kit расходится между SSR и клиентом
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const reorder = (next: TeamRef[]) => {
    setSeeds(next);
    setStale(true);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = seeds.findIndex((s) => s.slug === active.id);
    const to = seeds.findIndex((s) => s.slug === over.id);
    reorder(arrayMove(seeds, from, to));
  };

  const regenerate = async (save = false) => {
    setBusy(save ? "save" : "regen");
    try {
      const b = await api.saveSeeding(id, { format, seeds: seeds.map((s) => s.slug) });
      setBracket(b);
      setStale(false);
      toast.success(save ? "Сетка сохранена" : "Сетка перегенерирована");
    } catch {
      toast.error("Бэкенд не смог построить сетку");
    } finally {
      setBusy(null);
      setAsk(false);
    }
  };

  const pos = (slug: string) => (rankOrder.indexOf(slug) + 1 || 999);
  const byRating = () => reorder([...seeds].sort((a, b) => pos(a.slug) - pos(b.slug)));
  const shuffle = () => reorder([...seeds].map((s) => [Math.random(), s] as const).sort((a, b) => a[0] - b[0]).map(([, s]) => s));

  return (
    <div className="grid gap-6 desk:grid-cols-[300px_1fr]">
      <Card className="self-start">
        <CardHeader title="Посев">
          <Badge tone="muted">Черновик</Badge>
        </CardHeader>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-[13px] text-text-2">Перетащите команды, чтобы изменить посев. С клавиатуры: Tab до ручки, пробел, стрелки.</p>
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={seeds.map((s) => s.slug)} strategy={verticalListSortingStrategy}>
              <ol className="flex flex-col gap-2">
                {seeds.map((t, i) => (
                  <SeedRow key={t.slug} team={t} index={i} />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          <Button block icon={ChartColumn} onClick={byRating}>
            По рейтингу CTS
          </Button>
          <Button block icon={Shuffle} onClick={shuffle}>
            Случайно
          </Button>
        </div>
      </Card>
      <Card className="min-w-0">
        <CardHeader title={`${format === "single" ? "Single Elimination" : format === "double" ? "Double Elimination" : "Группы + плей-офф"} · ${seeds.length} команд`}>
          <Segmented
            label="Формат"
            active={format}
            onChange={(f) => {
              setFormat(f);
              setStale(true);
            }}
            items={[
              { key: "single", label: "Single" },
              { key: "double", label: "Double" },
              { key: "groups", label: "Группы" },
            ]}
          />
          <Button size="sm" variant="ghost" icon={RefreshCw} loading={busy === "regen"} onClick={() => setAsk(true)}>
            Перегенерировать
          </Button>
        </CardHeader>
        {stale && (
          <p role="status" className="flex items-center gap-2 border-b border-line bg-elev-2 px-6 py-3 text-[13px] text-gold">
            <Info size={14} aria-hidden /> Посев или формат изменён — нажмите «Перегенерировать», чтобы бэкенд пересобрал сетку.
          </p>
        )}
        <div className="p-6">
          <BracketView bracket={bracket} logos compact />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="flex max-w-[520px] items-start gap-2 text-[13px] text-text-2">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden /> Сетка заблокируется после запуска турнира. Потом можно менять только время и результаты.
          </p>
          <Button variant="primary" icon={Check} loading={busy === "save"} onClick={() => regenerate(true)}>
            Сохранить сетку
          </Button>
        </div>
      </Card>
      <ConfirmModal open={ask} onClose={() => setAsk(false)} onConfirm={() => regenerate()} loading={busy === "regen"} title="Перегенерировать сетку?" text="Пары и время матчей будут построены заново по текущему посеву. Ручные правки расписания сбросятся." confirmLabel="Перегенерировать" />
    </div>
  );
}
