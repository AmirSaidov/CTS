"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Eye, SlidersHorizontal } from "lucide-react";
import type { Tournament } from "@/shared/api/types";
import { GAME_NAMES, TOURNAMENT_STATUS } from "@/shared/lib/labels";
import { can } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Tabs } from "@/shared/ui/tabs";
import { ConfirmModal } from "@/shared/ui/overlay";

/** Шапка управления турниром (34–38): статус, название, ссылка, кнопки, вкладки */
export function ManageHeader({ t, counts }: { t: Tournament; counts: { applications: number; matches: number } }) {
  const path = usePathname();
  const router = useRouter();
  const user = useUser();
  const [ask, setAsk] = useState(false);
  const base = `/org/tournaments/${t.id}`;
  const active = path.split("/").pop() ?? "applications";
  const st = TOURNAMENT_STATUS[t.status];
  // главная кнопка зависит от этапа
  const main = t.status === "registration" ? "Запустить турнир" : t.status === "draft" ? "Опубликовать" : t.status === "finished" ? null : "Завершить этап";

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 desk:flex-row desk:items-end desk:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={t.status === "registration" ? "neutral" : st.tone} solid={false}>
              {st.label}
            </Badge>
            <Badge tone="muted">{GAME_NAMES[t.game]}</Badge>
            <span className="mono text-[11px] tracking-[0.16em] text-text-3 uppercase">
              {t.name} · cts.gg/{t.slug}
            </span>
          </div>
          <h1 className="font-display text-[clamp(40px,4.4vw,56px)] leading-none">{t.name}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button icon={Eye} href={`/tournaments/${t.slug}`}>
            Страница турнира
          </Button>
          {can(user, "tournaments.manage") && (
            <Button icon={SlidersHorizontal} href={`${base}/setup/1`}>
              Настройки
            </Button>
          )}
          {main && can(user, "tournaments.manage") && (
            <Button variant="primary" icon={ArrowRight} onClick={() => setAsk(true)}>
              {main}
            </Button>
          )}
        </div>
      </div>
      <Tabs
        active={active}
        items={[
          { key: "applications", label: "Заявки", count: counts.applications, href: `${base}/applications` },
          { key: "bracket", label: "Сетка", href: `${base}/bracket` },
          { key: "matches", label: "Матчи", count: counts.matches, href: `${base}/matches` },
          { key: "schedule", label: "Расписание", href: `${base}/schedule` },
          { key: "checkin", label: "Чек-ин", href: `${base}/checkin` },
        ]}
      />
      <ConfirmModal
        open={ask}
        onClose={() => setAsk(false)}
        title={`${main}?`}
        text="Регистрация закроется, сетка заблокируется — дальше меняются только время и результаты. Капитаны получат уведомление."
        confirmLabel={main ?? ""}
        onConfirm={() => {
          setAsk(false);
          toast.success("Турнир запущен", "Сетка заблокирована, капитаны уведомлены");
          router.refresh();
        }}
      />
    </header>
  );
}
