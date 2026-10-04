import { CornerMarkers } from "@/shared/ui/card";
import { Avatar, Placeholder, StatRow, TeamLogo } from "@/shared/ui/misc";
import { Container } from "@/shared/ui/page";
import type { StatsSummary } from "@/shared/api/types";

/** Шапка профиля игрока (07) и команды (08): баннер, аватар/логотип, бейджи, имя, кнопки, ряд статистики */
export function ProfileHeader({
  kind,
  tag,
  name,
  sub,
  badges,
  actions,
  stats,
}: {
  kind: "player" | "team";
  tag: string;
  name: string;
  sub: React.ReactNode;
  badges: React.ReactNode;
  actions: React.ReactNode;
  stats: StatsSummary | null;
}) {
  return (
    <section>
      <Placeholder label="Баннер профиля" className="h-[200px] border-b border-line [&>span]:-translate-y-6" />
      <Container className="relative">
        <div className="-mt-[88px] flex flex-col gap-6 desk:flex-row desk:items-end">
          <div className="relative w-fit">
            {kind === "player" ? (
              <>
                <CornerMarkers tone="silver" offset={8} />
                <Avatar tag={tag} size={160} className="text-[64px]" />
              </>
            ) : (
              <TeamLogo tag={tag} size={156} />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap gap-2">{badges}</div>
            <h1 className="font-display text-[clamp(52px,6vw,80px)] leading-[0.95] break-words">{name}</h1>
            <p className="text-[15px] text-text-2">{sub}</p>
          </div>
          <div className="flex flex-wrap gap-3 desk:pb-2">{actions}</div>
        </div>
        {stats && (
          <div className="mt-10">
            <StatRow
              items={[
                { label: "Турниров", value: stats.tournaments },
                { label: "Матчей", value: stats.matches },
                { label: "Побед", value: stats.wins },
                { label: "Винрейт", value: `${stats.winrate}%` },
                { label: "Трофеев", value: String(stats.trophies).padStart(2, "0") },
                { label: "Рейтинг", value: `#${stats.rank}` },
              ]}
            />
          </div>
        )}
      </Container>
    </section>
  );
}
