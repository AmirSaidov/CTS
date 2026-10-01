"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft, Bell, ChartColumn, CreditCard, Database, Gamepad2, Globe, House, LogOut, Mail, Menu, Newspaper, Palette, Plus,
  Search, Send, Shield, SlidersHorizontal, Swords, Trash, Trophy, User, Users, X, type LucideIcon,
} from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { useUser } from "@/shared/lib/stores";
import { can, type OrgAction } from "@/shared/lib/permissions";
import { cn } from "@/shared/lib/cn";
import { Counter } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Kbd, Logo, Avatar, Progress } from "@/shared/ui/misc";
import { useUserChannel } from "@/features/live/hooks";

export type CabinetKind = "player" | "org" | "settings" | "control";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  countMuted?: boolean;
  perm?: OrgAction;
  exact?: boolean;
}

interface Section {
  title: string;
  items: Item[];
}

function useMenu(kind: CabinetKind): { sub: string; crumb: string; sections: Section[] } {
  const user = useUser();
  const tp = useTranslations("player");
  const to = useTranslations("org");
  const ts = useTranslations("settings");
  const tc = useTranslations("control");
  const unread = user?.unread ?? { notifications: 0, invites: 0 };

  switch (kind) {
    case "player":
      return {
        sub: tp("title"),
        crumb: tp("section"),
        sections: [
          {
            title: tp("section"),
            items: [
              { href: "/me", label: tp("overview"), icon: House, exact: true },
              { href: "/me/profile", label: tp("profile"), icon: User },
              { href: "/me/team", label: tp("team"), icon: Users },
              { href: "/me/tournaments", label: tp("tournaments"), icon: Trophy },
              { href: "/me/matches", label: tp("matches"), icon: Swords },
              { href: "/me/invites", label: tp("invites"), icon: Mail, count: unread.invites },
              { href: "/me/notifications", label: tp("notifications"), icon: Bell, count: unread.notifications },
            ],
          },
          { title: tp("account"), items: [{ href: "/settings/profile", label: tp("settings"), icon: SlidersHorizontal }] },
        ],
      };
    case "org":
      return {
        sub: to("title"),
        crumb: to("section"),
        sections: [
          {
            title: to("section"),
            items: [
              { href: "/org", label: to("overview"), icon: House, exact: true },
              { href: "/org/tournaments", label: to("tournaments"), icon: Trophy, count: 5, countMuted: true },
              { href: "/org/matches", label: to("matches"), icon: Swords },
              { href: "/org/participants", label: to("participants"), icon: Database },
              { href: "/org/mailings", label: to("mailings"), icon: Send, perm: "mailings.send" },
              { href: "/org/analytics", label: to("analytics"), icon: ChartColumn },
              { href: "/org/staff", label: to("staff"), icon: Users, perm: "staff.manage" },
              { href: "/org/branding", label: to("branding"), icon: Palette, perm: "staff.manage" },
            ],
          },
          {
            title: to("account"),
            items: [
              { href: "/settings/profile", label: to("settings"), icon: SlidersHorizontal },
              { href: "/settings/billing", label: to("billing"), icon: CreditCard, perm: "billing.manage" },
            ],
          },
        ],
      };
    case "settings":
      return {
        sub: ts("title"),
        crumb: ts("section"),
        sections: [
          {
            title: ts("section"),
            items: [
              { href: "/settings/profile", label: ts("profile"), icon: User },
              { href: "/settings/notifications", label: ts("notifications"), icon: Bell },
              { href: "/settings/locale", label: ts("locale"), icon: Globe },
              { href: "/settings/billing", label: ts("billing"), icon: CreditCard },
              { href: "/settings/delete", label: ts("delete"), icon: Trash },
            ],
          },
          {
            title: ts("navigation"),
            items: [
              { href: "/me", label: ts("toCabinet"), icon: ArrowLeft, exact: true },
              ...(user?.isOrganizer ? [{ href: "/org", label: ts("toOrg"), icon: House, exact: true }] : []),
            ],
          },
        ],
      };
    case "control":
      return {
        sub: tc("title"),
        crumb: "Админка",
        sections: [
          {
            title: tc("section"),
            items: [
              // экрана «Обзор» в макете нет — до отрисовки ведёт на «Пользователи»
              { href: "/control", label: tc("overview"), icon: ChartColumn, exact: true },
              { href: "/control/users", label: tc("users"), icon: Users },
              { href: "/control/moderation", label: tc("moderation"), icon: Shield, count: 12 },
              { href: "/control/payments", label: tc("payments"), icon: CreditCard },
              { href: "/control/games", label: tc("games"), icon: Gamepad2 },
              { href: "/control/content", label: tc("content"), icon: Newspaper },
            ],
          },
        ],
      };
  }
}

function isActive(path: string, it: Item) {
  return it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`);
}

export function CabinetShell({ kind, widget, topAction, topActionOn, children }: { kind: CabinetKind; widget?: React.ReactNode; topAction?: React.ReactNode; topActionOn?: string; children: React.ReactNode }) {
  const path = usePathname();
  const user = useUser();
  const tn = useTranslations("nav");
  const { sub, crumb, sections } = useMenu(kind);
  const [drawer, setDrawer] = useState(false);
  useUserChannel();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- закрываем меню при переходе
  useEffect(() => setDrawer(false), [path]);

  const visible = sections.map((s) => ({ ...s, items: s.items.filter((it) => !it.perm || kind !== "org" || can(user, it.perm)) }));
  const flat = visible.flatMap((s) => s.items);
  const active = flat.filter((it) => isActive(path, it)).sort((a, b) => b.href.length - a.href.length)[0];

  const sidebar = (
    <nav aria-label={sub} className="flex h-full flex-col gap-7 px-4 py-6">
      <Logo href={kind === "org" ? "/org" : kind === "control" ? "/control/users" : "/me"} sub={sub} className="px-2" />
      {visible.map((s) => (
        <div key={s.title} className="flex flex-col gap-1">
          <span className="mono-label px-2 pb-2 text-text-4!">{s.title}</span>
          {s.items.map((it) => {
            const on = it === active;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={on ? "page" : undefined}
                title={it.label}
                className={cn(
                  "group flex min-h-10 items-center gap-3 border px-3 py-2 text-[15px] transition-colors",
                  on ? "border-line-strong bg-elev-2 font-semibold text-text" : "border-transparent text-text-2 hover:text-text",
                )}
              >
                <it.icon size={17} strokeWidth={1.6} className="shrink-0" aria-hidden />
                <span className="flex-1 leading-tight">{it.label}</span>
                {it.count ? <Counter value={it.countMuted ? String(it.count).padStart(2, "0") : it.count} /> : null}
                {on && !it.count && <span className="size-1.5 bg-text" aria-hidden />}
              </Link>
            );
          })}
        </div>
      ))}
      {widget && <div className="mt-auto">{widget}</div>}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      {/* десктоп */}
      <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-w)] shrink-0 overflow-y-auto border-r border-line desk:block">{sidebar}</aside>
      {/* планшет: иконки */}
      <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col items-center gap-2 border-r border-line py-6 tab:flex desk:hidden">
        <Logo href="/" className="mb-4" />
        {flat.map((it) => (
          <Link key={it.href} href={it.href} title={it.label} aria-label={it.label} aria-current={it === active ? "page" : undefined} className={cn("relative flex size-11 items-center justify-center border", it === active ? "border-line-strong bg-elev-2 text-text" : "border-transparent text-text-3 hover:text-text")}>
            <it.icon size={18} strokeWidth={1.6} aria-hidden />
            {it.count ? <span className="absolute top-1 right-1 size-1.5 bg-accent" aria-hidden /> : null}
          </Link>
        ))}
      </aside>
      {/* телефон: выезжающая панель */}
      {drawer && (
        <div className="fixed inset-0 z-40 tab:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Закрыть меню" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(300px,85vw)] overflow-y-auto border-r border-line bg-bg">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          crumbs={["CTS", crumb, active?.label].filter(Boolean) as string[]}
          kind={kind}
          onMenu={() => setDrawer(true)}
          searchHint={kind === "org"}
          action={!topActionOn || path === topActionOn ? topAction : null}
          searchLabel={tn("search")}
        />
        <main id="main" className="flex-1 px-4 pt-8 pb-16 tab:px-8 desk:px-8 desk:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function Topbar({ crumbs, kind, onMenu, searchHint, action, searchLabel }: { crumbs: string[]; kind: CabinetKind; onMenu: () => void; searchHint?: boolean; action?: React.ReactNode; searchLabel: string }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur tab:px-8">
      <button type="button" onClick={onMenu} className="flex size-10 items-center justify-center border border-line tab:hidden" aria-label="Меню">
        <Menu size={18} />
      </button>
      <ol className="mono hidden min-w-0 items-center gap-2 text-[11px] tracking-[0.16em] uppercase sm:flex" aria-label="Хлебные крошки">
        {crumbs.map((c, i) => (
          <li key={i} className={cn("flex items-center gap-2 whitespace-nowrap", i === crumbs.length - 1 ? "font-medium text-text" : "text-text-3")}>
            {i > 0 && <span className="text-text-4">/</span>}
            {c}
          </li>
        ))}
      </ol>
      <div className="ml-auto flex items-center gap-3">
        <form
          role="search"
          className="relative hidden lg:block"
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchRef.current?.value.trim();
            if (q) router.push(`/tournaments?search=${encodeURIComponent(q)}`);
          }}
        >
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-3" aria-hidden />
          <input ref={searchRef} type="search" placeholder={searchLabel} aria-label={searchLabel} className="h-10 w-[300px] border border-line bg-transparent pr-14 pl-10 text-[14px] outline-none placeholder:text-text-3 focus:border-accent" />
          {searchHint && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2">
              <Kbd>⌘K</Kbd>
            </span>
          )}
        </form>
        <IconButton icon={Bell} label="Уведомления" href={kind === "org" ? "/org/notifications" : "/me/notifications"} />
        {action}
        <UserMenu kind={kind} />
      </div>
    </div>
  );
}

function UserMenu({ kind }: { kind: CabinetKind }) {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("nav");

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-label={t("profile")}>
        <Avatar tag={user.tag} size={40} />
      </button>
      {open && (
        <div role="menu" className="absolute top-12 right-0 z-30 flex w-64 flex-col border border-line-strong bg-elev-1 p-1">
          <div className="border-b border-line px-3 py-3">
            <p className="text-[15px] font-semibold">{user.nick}</p>
            <p className="text-[12px] text-text-3">{user.email}</p>
          </div>
          {/* переключатель «Кабинет игрока / Панель организатора» — один аккаунт может быть обоими */}
          {user.isOrganizer && (
            <MenuLink href={kind === "org" ? "/me" : "/org"} icon={kind === "org" ? User : House}>
              {kind === "org" ? t("playerCabinet") : t("orgPanel")}
            </MenuLink>
          )}
          {user.isPlatformAdmin && kind !== "control" && (
            <MenuLink href="/control/users" icon={Shield}>
              Админка
            </MenuLink>
          )}
          <MenuLink href={`/p/${user.nick.toLowerCase()}`} icon={User}>
            Публичный профиль
          </MenuLink>
          <MenuLink href="/settings/profile" icon={SlidersHorizontal}>
            {t("settings")}
          </MenuLink>
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-3 px-3 py-2.5 text-left text-[14px] text-text-2 hover:bg-elev-2 hover:text-text"
            onClick={async () => {
              await api.logout();
              document.cookie = "cts_mock_role=guest; path=/; max-age=31536000";
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={16} aria-hidden /> {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" className="flex items-center gap-3 px-3 py-2.5 text-[14px] text-text-2 hover:bg-elev-2 hover:text-text">
      <Icon size={16} aria-hidden /> {children}
    </Link>
  );
}

/* ───────── Виджеты низа сайдбара ───────── */

export function NextMatchWidget() {
  const t = useTranslations("player");
  return (
    <div className="flex flex-col gap-3 border border-line bg-elev-1 p-4">
      <span className="mono-label">{t("nextMatch")}</span>
      <span className="font-display text-[20px]">TENGRI vs TBD</span>
      <span className="text-[13px] text-text-2">27.09 · 19:00 · Гранд-финал</span>
      <Button href="/tournaments/bishkek-cyber-cup/matches/GF-01" size="sm" block>
        {t("openMatch")}
      </Button>
    </div>
  );
}

export function PlanWidget() {
  const user = useUser();
  const t = useTranslations("org");
  const org = user?.org;
  if (!org) return null;
  const [used, limit] = org.limits.tournaments;
  return (
    <div className="relative flex flex-col gap-3 border border-line bg-elev-1 p-4">
      <span className="absolute -top-2 -right-2 size-3 border-t-2 border-r-2 border-accent" aria-hidden />
      <div className="flex items-center justify-between">
        <span className="mono-label">{t("plan")}</span>
        <span className="mono text-[11px] font-medium tracking-[0.14em] uppercase">{org.plan}</span>
      </div>
      <span className="text-[14px] text-text-2">{limit ? t("tournamentsUsed", { used, limit }) : "Турниров: безлимит"}</span>
      {limit && <Progress value={(used / limit) * 100} label="Лимит турниров" />}
      {org.plan === "free" && (
        <Button href="/pricing" variant="primary" size="sm" block className="mt-1">
          {t("goPro")}
        </Button>
      )}
    </div>
  );
}

export function SuperadminWidget() {
  const t = useTranslations("control");
  return (
    <div className="flex flex-col gap-2 border border-violet bg-[color-mix(in_srgb,var(--violet)_14%,var(--bg))] p-4">
      <span className="mono text-[10px] tracking-[0.16em] text-violet-text uppercase">{t("superadmin")}</span>
      <span className="text-[13px] text-text-2">{t("superadminHint")}</span>
    </div>
  );
}

/** Кнопка «Создать турнир» в шапке: при исчерпании лимита Free — модалка апгрейда */
export function CreateTournamentButton({ size = "sm" }: { size?: "sm" | "md" }) {
  const user = useUser();
  const [modal, setModal] = useState(false);
  const limit = user?.org?.limits.tournaments;
  const exhausted = !!limit && limit[1] !== null && limit[0] >= limit[1];
  return (
    <>
      <Button variant="primary" size={size} icon={Plus} href={exhausted ? undefined : "/org/tournaments/new"} onClick={exhausted ? () => setModal(true) : undefined}>
        Создать турнир
      </Button>
      {modal && <UpgradeModal onClose={() => setModal(false)} />}
    </>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal aria-labelledby="upgrade-title">
      <div className="relative flex w-full max-w-[440px] flex-col gap-4 border border-line-strong bg-elev-1 p-6">
        <button type="button" className="absolute top-4 right-4 text-text-3 hover:text-text" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
        <span className="mono-label text-gold!">Лимит тарифа Free</span>
        <h2 id="upgrade-title" className="t-h2">
          3 из 3 турниров
        </h2>
        <p className="text-[15px] text-text-2">На Free одновременно идут до 3 активных турниров. Завершите один из них или перейдите на Pro — там лимита нет.</p>
        <div className="flex gap-3">
          <Button variant="primary" href="/pricing">
            Перейти на Pro
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Позже
          </Button>
        </div>
      </div>
    </div>
  );
}

