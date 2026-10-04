import { Bell, Mail, Search, Swords, Trophy, Users, Plus, X, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CornerMarkers } from "./card";
import { Button } from "./button";
import { cn } from "@/shared/lib/cn";

/** 6 вариантов из экрана 57. Пунктирная рамка, уголки, моно-метка EMPTY.*, иконка в квадрате, заголовок, текст, CTA. */
export type EmptyKind = "tournaments" | "matches" | "team" | "notify" | "search" | "invites";

const META: Record<EmptyKind, { code: string; icon: LucideIcon; cta?: { href: string; icon?: LucideIcon; primary?: boolean }; cta2?: { href: string } }> = {
  tournaments: { code: "EMPTY.TOURNAMENTS", icon: Trophy, cta: { href: "/org/tournaments/new", icon: Plus, primary: true } },
  matches: { code: "EMPTY.MATCHES", icon: Swords, cta: { href: "/tournaments", icon: Search } },
  team: { code: "EMPTY.TEAM", icon: Users, cta: { href: "/me/team?create=1", icon: Plus, primary: true }, cta2: { href: "/tournaments" } },
  notify: { code: "EMPTY.NOTIFY", icon: Bell },
  search: { code: "EMPTY.SEARCH", icon: Search, cta: { href: "?", icon: X } },
  invites: { code: "EMPTY.INVITES", icon: Mail },
};

export async function EmptyState({ kind, ctaHref, className, compact }: { kind: EmptyKind; ctaHref?: string; className?: string; compact?: boolean }) {
  const t = await getTranslations(`empty.${kind}`);
  const m = META[kind];
  return <EmptyStateView className={className} compact={compact} code={m.code} icon={m.icon} title={t("title")} text={t("text")} cta={m.cta && { ...m.cta, href: ctaHref ?? m.cta.href, label: t("cta") }} cta2={m.cta2 && { href: m.cta2.href, label: t("cta2") }} />;
}

/** Клиентская версия (для client-компонентов): тексты передаются пропсами */
export function EmptyStateView({
  code,
  icon: Icon,
  title,
  text,
  cta,
  cta2,
  onCta,
  className,
  compact,
}: {
  code: string;
  icon: LucideIcon;
  title: string;
  text: string;
  cta?: { href?: string; label: string; icon?: LucideIcon; primary?: boolean };
  cta2?: { href: string; label: string };
  onCta?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative flex flex-col items-center gap-4 border border-dashed border-text-4 bg-elev-1 px-6 text-center", compact ? "py-10" : "py-14", className)}>
      <CornerMarkers />
      <span className="mono text-[10px] tracking-[0.16em] text-text-4">{code}</span>
      <span className="flex size-[72px] items-center justify-center border border-line bg-bg">
        <Icon size={28} strokeWidth={1.5} className="text-accent" aria-hidden />
      </span>
      <h3 className="t-h3 text-[26px]">{title}</h3>
      <p className="max-w-[320px] text-[14px] text-text-2">{text}</p>
      {(cta || cta2) && (
        <div className="mt-1 flex flex-wrap justify-center gap-2.5">
          {cta && (
            <Button href={onCta ? undefined : cta.href} onClick={onCta} variant={cta.primary ? "primary" : "secondary"} icon={cta.icon}>
              {cta.label}
            </Button>
          )}
          {cta2 && <Button href={cta2.href}>{cta2.label}</Button>}
        </div>
      )}
    </div>
  );
}
