"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { Counter } from "./badge";

export interface TabItem {
  key: string;
  label: React.ReactNode;
  count?: number;
  href?: string;
}

/** Вкладки с подчёркиванием 2px у активной. С href — навигация (вкладка в URL), иначе — onChange. */
export function Tabs({ items, active, onChange, className, size = "md" }: { items: TabItem[]; active: string; onChange?: (k: string) => void; className?: string; size?: "md" | "lg" }) {
  return (
    <div role="tablist" className={cn("no-scrollbar flex gap-7 overflow-x-auto border-b border-line tab:gap-9", className)}>
      {items.map((it) => {
        const on = it.key === active;
        const cls = cn(
          "btn-text relative flex shrink-0 items-center gap-2 pb-3.5 transition-colors",
          size === "lg" ? "text-[17px]" : "text-[15px]",
          on ? "text-text after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent" : "text-text-3 hover:text-text-2",
        );
        const inner = (
          <>
            {it.label}
            {it.count !== undefined && <Counter value={it.count} active={on} />}
          </>
        );
        return it.href ? (
          <Link key={it.key} href={it.href} role="tab" aria-selected={on} className={cls} scroll={false}>
            {inner}
          </Link>
        ) : (
          <button key={it.key} type="button" role="tab" aria-selected={on} className={cls} onClick={() => onChange?.(it.key)}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}

/** Мелкий переключатель моно-капсом: «ВСЕ · АКТИВНЫЕ · АРХИВ», «7 ДНЕЙ · 30 ДНЕЙ · СЕЗОН» */
export function Segmented<K extends string>({ items, active, onChange, className, label }: { items: { key: K; label: React.ReactNode; href?: string }[]; active: K; onChange?: (k: K) => void; className?: string; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap items-center gap-1", className)}>
      {items.map((it) => {
        const on = it.key === active;
        const cls = cn(
          "mono inline-flex h-8 items-center px-3 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors",
          on ? "bg-elev-2 text-text outline outline-1 outline-line-strong" : "text-text-3 hover:text-text-2",
        );
        return it.href ? (
          <Link key={it.key} href={it.href} role="radio" aria-checked={on} className={cls} scroll={false}>
            {it.label}
          </Link>
        ) : (
          <button key={it.key} type="button" role="radio" aria-checked={on} onClick={() => onChange?.(it.key)} className={cls}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/** Чипы фильтров (каталог, новости, уведомления) */
export function Chips<K extends string>({ items, active, onChange, className }: { items: { key: K; label: string; href?: string }[]; active: K; onChange?: (k: K) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((it) => {
        const on = it.key === active;
        const cls = cn(
          "inline-flex h-9 items-center border px-3.5 text-[14px] transition-colors",
          on ? "border-accent bg-elev-2 font-semibold text-text" : "border-line text-text-2 hover:border-line-strong hover:text-text",
        );
        return it.href ? (
          <Link key={it.key} href={it.href} aria-pressed={on} className={cls} scroll={false}>
            {it.label}
          </Link>
        ) : (
          <button key={it.key} type="button" aria-pressed={on} onClick={() => onChange?.(it.key)} className={cls}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
