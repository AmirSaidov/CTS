"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Menu, X } from "lucide-react";
import { useUser } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";
import { Button, IconButton } from "@/shared/ui/button";
import { Avatar, Logo } from "@/shared/ui/misc";

export interface NavItem {
  href: string;
  label: string;
}

/** Шапка публичной части, 72px. На лендинге — свой набор пунктов-якорей. */
export function PublicHeader({ items }: { items?: NavItem[] }) {
  const t = useTranslations("nav");
  const path = usePathname();
  const user = useUser();
  const [open, setOpen] = useState(false);

  const nav: NavItem[] = items ?? [
    { href: "/tournaments", label: t("tournaments") },
    { href: "/pricing", label: t("pricing") },
  ];

  // eslint-disable-next-line react-hooks/set-state-in-effect -- закрываем меню при переходе
  useEffect(() => setOpen(false), [path]);

  const cabinet = user ? (user.defaultCabinet === "org" ? "/org" : "/me") : null;

  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[calc(var(--content-max)+2*var(--page-pad))] items-center gap-10 px-[var(--page-pad)]">
        <Logo />
        <nav aria-label="Основное меню" className="hidden h-full items-stretch gap-8 desk:flex">
          {nav.map((it) => {
            const on = !it.href.includes("#") && path.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={cn("btn-text relative flex items-center text-[15px] transition-colors", on ? "text-text after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent" : "text-text-2 hover:text-text")}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <IconButton icon={Bell} label={t("notifications")} href="/me/notifications" />
              <Link href={cabinet!} className="hidden tab:inline-flex" aria-label={t("profile")}>
                <Avatar tag={user.tag} size={40} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-text hidden px-2 text-[15px] hover:text-accent-hover tab:inline">
                {t("login")}
              </Link>
              <Button href="/register" variant="primary" size="sm" className="hidden tab:inline-flex">
                {t("startFree")}
              </Button>
            </>
          )}
          <button type="button" className="flex size-10 items-center justify-center border border-line desk:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={t("menu")}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-drop absolute inset-x-0 top-full flex h-[calc(100dvh-var(--header-h))] flex-col gap-1 overflow-y-auto border-t border-line bg-bg px-4 py-6 desk:hidden">
          {nav.map((it, i) => (
            <Link key={it.href} href={it.href} style={{ "--i": i } as React.CSSProperties} className="animate-drop-item font-display border-b border-line py-4 text-[28px]">
              {it.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-3">
            {user ? (
              <Button href={cabinet!} variant="primary" size="lg" block>
                {user.defaultCabinet === "org" ? t("orgPanel") : t("playerCabinet")}
              </Button>
            ) : (
              <>
                <Button href="/register" variant="primary" size="lg" block>
                  {t("startFree")}
                </Button>
                <Button href="/login" size="lg" block>
                  {t("login")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
