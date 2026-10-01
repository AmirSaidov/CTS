import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { USE_MOCKS } from "@/shared/api/client";
import { BCC_MATCHES, TOURNAMENTS } from "@/shared/api/mocks/data";
import { Badge, Counter, ProBadge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, KeyRow } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Container } from "@/shared/ui/page";
import { Eyebrow, Placeholder, Progress, Skeleton, StatTile, TeamLogo } from "@/shared/ui/misc";
import { TournamentCard } from "@/features/tournament/tournament-card";
import { MatchCard } from "@/features/match/match-card";
import { UiPlayground } from "@/features/dev/ui-playground";

export const metadata: Metadata = { title: "UI-кит", robots: { index: false } };

/**
 * Витрина UI-кита и экран 57 «Пустые состояния». Только для разработки (моки / dev-сборка) —
 * в продакшене 404. Замена Storybook на первом этапе.
 */
export default function UiKitPage() {
  if (!USE_MOCKS && process.env.NODE_ENV === "production") notFound();
  return (
    <Container className="flex flex-col gap-16 py-16">
      <header className="flex flex-col gap-4">
        <Eyebrow>[ Системные состояния ]</Eyebrow>
        <h1 className="t-display">Пустые состояния</h1>
      </header>
      <section className="grid gap-6 tab:grid-cols-2 desk:grid-cols-3" aria-label="Экран 57">
        <EmptyState kind="tournaments" />
        <EmptyState kind="matches" />
        <EmptyState kind="team" />
        <EmptyState kind="notify" />
        <EmptyState kind="search" />
        <EmptyState kind="invites" />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="t-h1">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" icon={Plus}>
            Создать турнир
          </Button>
          <Button variant="primary">Primary 44</Button>
          <Button variant="primary" size="sm">
            Primary 36
          </Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Загрузка</Button>
          <Button disabled>Disabled</Button>
          <Button icon={Search} variant="secondary" size="sm">
            С иконкой
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="t-h1">Статусы</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Регистрация</Badge>
          <Badge tone="accent" dot>
            Идёт
          </Badge>
          <Badge tone="gold">Финал</Badge>
          <Badge tone="muted">Завершён</Badge>
          <Badge tone="accent" dot>
            Live
          </Badge>
          <Badge tone="success">Подтверждён</Badge>
          <Badge tone="accent" dot>
            Спор
          </Badge>
          <Badge tone="violet-solid">Групповой этап</Badge>
          <Badge tone="bronze">3 место</Badge>
          <ProBadge />
          <Counter value={4} />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="t-h1">Данные</h2>
        <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
          <StatTile label="Активные турниры" value="03" sub="1 в плей-офф" />
          <StatTile label="Матчей до финала" value="01" sub="27.09 · 19:00" tone="gold" />
          <StatTile label="Заявки" value="05" sub="Рассмотреть" subHref="#" tone="accent" />
          <div className="flex flex-col gap-3 border border-line bg-elev-1 p-6">
            <Progress value={62} label="Пример" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="grid gap-6 desk:grid-cols-3">
          <TournamentCard t={TOURNAMENTS[0]} />
          <div className="flex flex-col gap-4">
            <MatchCard m={BCC_MATCHES[5]} />
            <MatchCard m={BCC_MATCHES[4]} />
            <MatchCard m={BCC_MATCHES[6]} final />
          </div>
          <Card>
            <CardHeader title="Детали матча" />
            <KeyRow k="Формат" v="BO3" />
            <KeyRow k="Сервер" v="[РЕГИОН]" />
            <div className="flex items-center gap-3 p-6">
              <TeamLogo tag="TG" size={48} />
              <TeamLogo tag="SK" size={32} />
              <Placeholder label="Арт" className="h-12 flex-1 border border-line" />
            </div>
          </Card>
        </div>
      </section>

      <UiPlayground />
    </Container>
  );
}
