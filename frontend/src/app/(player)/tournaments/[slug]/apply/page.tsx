import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { orNotFound } from "@/shared/api/server";
import { getSession } from "@/shared/auth/session";
import { FORMAT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { fmtDay } from "@/shared/lib/format";
import { PageHeader } from "@/shared/ui/misc";
import { EmptyState } from "@/shared/ui/empty-state";
import { ApplyForm } from "@/features/player/apply-form";

export const metadata = { title: "Заявка на турнир" };

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, user, games] = await Promise.all([orNotFound(api.tournament(slug)), getSession(), api.games()]);
  const team = user?.team ? await api.myTeam() : null;
  const game = games.find((g) => g.slug === t.game)!;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/tournaments" className="mono flex items-center gap-2 text-[11px] tracking-[0.16em] text-text-2 uppercase hover:text-text">
        <ArrowLeft size={14} aria-hidden /> Каталог турниров
      </Link>
      <PageHeader eyebrow="Кабинет игрока // Заявка" title="Заявка на турнир" sub={`${t.name} · ${GAME_NAMES[t.game]} · ${FORMAT_LABELS[t.format]} · старт ${fmtDay(t.startAt)}`} />
      {t.status !== "registration" ? (
        <p className="border border-line bg-elev-1 p-6 text-text-2">Регистрация на этот турнир закрыта.</p>
      ) : !team ? (
        <EmptyState kind="team" />
      ) : user?.captainOf !== team.slug ? (
        <p className="border border-line bg-elev-1 p-6 text-text-2">Заявку от команды подаёт капитан — {team.captainNick}. Напишите ему, чтобы он добавил вас в состав.</p>
      ) : (
        <ApplyForm t={t} team={team} game={game} />
      )}
    </div>
  );
}
