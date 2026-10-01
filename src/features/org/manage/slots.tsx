"use client";

import { useId, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import type { ScheduleSlot } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/stores";
import { Button, IconButton } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Input, Toggle } from "@/shared/ui/form";
import { Segmented } from "@/shared/ui/tabs";

const HOURS = [14, 15, 16, 17, 18, 19, 20, 21];
const ROW = 64;
const h = (t: string) => Number(t.slice(0, 2));

type Venue = { name: string; short: string; meta: string };
type Unscheduled = { code: string; title: string };

/** Команды матча из заголовка «QF-01 · Tengri vs Iron Snow» — для проверки «команда в двух матчах сразу» */
const teamsOf = (s: ScheduleSlot) => (s.kind === "match" ? (s.title.split(" · ")[1] ?? "").split(" vs ").map((x) => x.trim().toLowerCase()) : []);

function conflict(slots: ScheduleSlot[], moving: ScheduleSlot, venue: string, start: string): string | null {
  const others = slots.filter((s) => s !== moving && s.kind !== "free");
  if (others.some((s) => s.venue === venue && h(s.start) === h(start))) return "На этой площадке в это время уже есть матч";
  const teams = teamsOf(moving).filter((t) => t && t !== "tbd");
  const clash = others.find((s) => h(s.start) === h(start) && teamsOf(s).some((t) => teams.includes(t)));
  if (clash) return `Команда уже играет в это время: ${clash.matchCode}`;
  return null;
}

function Block({ s, conflictWith }: { s: ScheduleSlot; conflictWith?: boolean }) {
  const draggable = s.kind === "match";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `slot:${s.matchCode}`, disabled: !draggable, data: s });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), height: (h(s.end) - h(s.start)) * ROW - 6 }}
      className={cn(
        "absolute inset-x-1 top-[3px] z-[1] flex flex-col justify-between overflow-hidden border px-2.5 py-2 text-left",
        s.kind === "match" && "border-line-strong bg-elev-2",
        s.kind === "show" && "border-violet bg-[color-mix(in_srgb,var(--violet)_18%,var(--bg))]",
        s.kind === "stream" && "border-line bg-elev-1",
        s.kind === "reserve" && "border-line bg-elev-1",
        s.kind === "free" && "border-dashed border-text-4 bg-transparent",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "z-20 border-accent shadow-none",
        conflictWith && "border-danger",
      )}
      {...(draggable ? { ...attributes, ...listeners, "aria-label": `${s.title}, ${s.start}–${s.end}, ${s.venue}. Пробел — взять, стрелки — двигать` } : {})}
    >
      <span className="text-[13px] leading-tight font-semibold">{s.title}</span>
      <span className="mono text-[9px] tracking-[0.12em] text-text-3">
        {s.start} – {s.end}
        {s.bo ? ` · BO${s.bo}` : ""}
      </span>
    </div>
  );
}

function Cell({ venue, hour, children }: { venue: string; hour: number; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${venue}|${hour}` });
  return (
    <div ref={setNodeRef} className={cn("relative border-b border-l border-line", isOver && "bg-elev-2")} style={{ height: ROW }}>
      {children}
    </div>
  );
}

function UnscheduledItem({ u }: { u: Unscheduled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `tbd:${u.code}`, data: u });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("flex cursor-grab items-center gap-4 border-b border-line bg-bg px-6 py-4 last:border-b-0", isDragging && "relative z-20 border border-accent")}
      {...attributes}
      {...listeners}
      aria-label={`${u.title} — перетащите в слот`}
    >
      <span className="mono text-[11px] text-text-3">{u.code.slice(0, 2)}</span>
      <span className="flex flex-col">
        <span className="font-semibold">{u.title}</span>
        <span className="mono text-[9px] tracking-[0.16em] text-text-3 uppercase">Перетащите в слот</span>
      </span>
    </li>
  );
}

export function SlotsScreen({ id, venues: initialVenues, slots: initialSlots, unscheduled: initialU, date }: { id: string; venues: Venue[]; slots: ScheduleSlot[]; unscheduled: Unscheduled[]; date: string }) {
  const [day, setDay] = useState(1);
  const [venues, setVenues] = useState(initialVenues);
  const [slots, setSlots] = useState(initialSlots);
  const [unscheduled, setUnscheduled] = useState(initialU);
  const [notify, setNotify] = useState(true);
  const [buffer, setBuffer] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [newVenue, setNewVenue] = useState("");
  // стабильный id: иначе aria-describedby у dnd-kit расходится между SSR и клиентом
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const [venue, hour] = String(over.id).replace("cell:", "").split("|");
    const start = `${hour}:00`;
    const end = `${Number(hour) + 1}:00`;
    const isTbd = String(active.id).startsWith("tbd:");
    const moving: ScheduleSlot = isTbd
      ? { matchCode: (active.data.current as Unscheduled).code, title: (active.data.current as Unscheduled).title, venue, start, end, bo: 1, kind: "match" }
      : (active.data.current as ScheduleSlot);
    // конфликты подсвечиваем и не сохраняем
    const err = conflict(slots, moving, venue, start);
    if (err) {
      setFlash(`${venue}|${hour}`);
      setTimeout(() => setFlash(null), 1500);
      return toast.error("Нельзя поставить сюда", err);
    }
    const prev = { slots, unscheduled };
    const placed = { ...moving, venue, start, end };
    setSlots((l) => [...l.filter((s) => s !== moving && !(s.kind === "free" && s.venue === venue && s.start === start)), placed]);
    if (isTbd) setUnscheduled((l) => l.filter((u) => u.code !== moving.matchCode));
    try {
      await api.moveSlot(id, { code: moving.matchCode!, venue, start });
      toast.success(`${moving.matchCode} → ${venue.split(" · ")[0]}, ${start}`, notify ? "Капитаны получат уведомление" : undefined);
    } catch {
      setSlots(prev.slots);
      setUnscheduled(prev.unscheduled);
      toast.error("Не удалось сохранить слот");
    }
  };

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-6 desk:grid-cols-[1fr_300px]">
        <Card className="min-w-0 self-start">
          <CardHeader title={`${date.split("-").reverse().join(".")} · ${["", "СБ", "ВС", "ПН"][day]}`}>
            <IconButton icon={ArrowLeft} label="Предыдущий день" disabled={day === 1} onClick={() => setDay((d) => Math.max(1, d - 1))} />
            <Segmented label="День турнира" active={String(day)} onChange={(k) => setDay(Number(k))} items={[1, 2, 3].map((d) => ({ key: String(d), label: `День ${d}` }))} />
            <IconButton icon={ArrowRight} label="Следующий день" disabled={day === 3} onClick={() => setDay((d) => Math.min(3, d + 1))} />
          </CardHeader>
          <div className="overflow-x-auto" role="region" aria-label="Таймлайн слотов" tabIndex={0}>
            <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `64px repeat(${venues.length}, minmax(160px, 1fr))` }}>
              <div className="sticky left-0 z-[2] border-b border-line bg-bg" />
              {venues.map((v) => (
                <div key={v.name} className="border-b border-l border-line px-3 py-3 text-[14px] font-semibold">
                  {v.name}
                </div>
              ))}
              {HOURS.map((hour) => (
                <div key={hour} className="contents">
                  <div className="mono sticky left-0 z-[2] border-b border-line bg-bg px-3 pt-3 text-[11px] text-text-3">{hour}:00</div>
                  {venues.map((v) => {
                    const slot = slots.find((s) => s.venue === v.name && h(s.start) === hour);
                    return (
                      <Cell key={v.name + hour} venue={v.name} hour={hour}>
                        {flash === `${v.name}|${hour}` && <span className="absolute inset-0 z-[3] border-2 border-danger" aria-hidden />}
                        {slot && <Block s={slot} />}
                      </Cell>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Без времени" />
            {unscheduled.length ? (
              <ul>
                {unscheduled.map((u) => (
                  <UnscheduledItem key={u.code} u={u} />
                ))}
              </ul>
            ) : (
              <p className="px-6 py-5 text-[14px] text-text-3">Все матчи в расписании</p>
            )}
          </Card>
          <Card tone="raised" className="flex flex-col gap-2 p-6">
            <CornerMarkers only="tl" />
            <h2 className="t-h3 mb-2">Площадки</h2>
            {venues.map((v) => (
              <div key={v.name} className="flex justify-between py-1.5 text-[15px]">
                {v.short}
                <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{v.meta}</span>
              </div>
            ))}
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newVenue.trim().length < 2) return;
                setVenues((l) => [...l, { name: newVenue.trim(), short: newVenue.trim(), meta: "—" }]);
                setNewVenue("");
              }}
            >
              <Input aria-label="Название площадки" placeholder="Зал 3" value={newVenue} onChange={(e) => setNewVenue(e.target.value)} className="h-10" />
              <Button type="submit" size="sm" icon={Plus} className="h-10">
                Добавить
              </Button>
            </form>
          </Card>
          <Card className="flex flex-col gap-5 p-6">
            <Toggle label="Уведомлять капитанов об изменениях" checked={notify} onChange={setNotify} />
            <Toggle label="Буфер между матчами 15 мин" checked={buffer} onChange={setBuffer} />
          </Card>
        </aside>
      </div>
    </DndContext>
  );
}
