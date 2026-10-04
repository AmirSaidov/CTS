"use client";

import { CalendarPlus, Clock } from "lucide-react";
import { download, icsFile } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CornerMarkers } from "@/shared/ui/card";
import { TeamLogo } from "@/shared/ui/misc";
import { Countdown } from "@/shared/ui/feedback";

/** Крупная карточка ближайшего матча: таймер, «Чек-ин откроется за 1 час», «Добавить в календарь» (.ics) */
export function NextMatchCard() {
  const start = "2026-09-27T19:00:00+06:00";
  const href = "/tournaments/bishkek-cyber-cup/matches/GF-01";
  return (
    <section className="relative border border-gold bg-elev-1 p-6 tab:p-8" aria-label="Ближайший матч">
      <CornerMarkers tone="gold" offset={6} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="gold">Гранд-финал · BO5</Badge>
          <span className="mono text-[11px] tracking-[0.16em] text-text-2 uppercase">Bishkek Cyber Cup · 27.09 · 19:00</span>
        </div>
        <span className="mono text-[11px] tracking-[0.16em] uppercase">
          До начала <Countdown to={start} long />
        </span>
      </div>
      <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 tab:gap-4">
        <div className="flex items-center gap-4">
          <TeamLogo tag="TG" size={64} className="max-tab:hidden" />
          <span className="font-display truncate text-[clamp(28px,4vw,56px)]">TENGRI</span>
        </div>
        <span className="font-display text-[24px] text-text-3 tab:text-[32px]">VS</span>
        <div className="flex items-center justify-end gap-4">
          <span className="font-display truncate text-[clamp(28px,4vw,56px)] text-text-3">TBD</span>
          <TeamLogo tag="?" size={64} className="max-tab:hidden" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" href={href}>
          Открыть матч
        </Button>
        <Button icon={Clock} disabled>
          Чек-ин откроется за 1 час
        </Button>
        <Button
          variant="ghost"
          icon={CalendarPlus}
          onClick={() =>
            download(
              "cts-grand-final.ics",
              icsFile({ title: "TENGRI vs TBD · Гранд-финал BCC", start, durationMin: 180, url: window.location.origin + href, description: "Bishkek Cyber Cup · BO5" }),
              "text/calendar",
            )
          }
        >
          Добавить в календарь
        </Button>
      </div>
    </section>
  );
}
