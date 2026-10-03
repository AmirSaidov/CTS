"use client";

import { Component, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, RotateCw } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { countdown } from "@/shared/lib/format";
import { now as clockNow } from "@/shared/lib/clock";
import { Button } from "./button";

/** Error boundary блока: падает один блок — остальная страница работает. */
export class BlockBoundary extends Component<{ children: React.ReactNode; title?: string; className?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className={cn("flex flex-col items-start gap-3 border border-dashed border-text-4 bg-elev-1 p-6", this.props.className)}>
        <span className="mono-label">ERR.BLOCK</span>
        <p className="text-[15px] font-semibold">{this.props.title ?? "Блок не загрузился"}</p>
        <Button size="sm" icon={RotateCw} onClick={() => this.setState({ error: null })}>
          Повторить
        </Button>
      </div>
    );
  }
}

/** Ошибка запроса внутри блока (useQuery.isError) */
export function QueryError({ onRetry, text = "Не удалось загрузить данные" }: { onRetry: () => void; text?: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-6">
      <p className="text-[14px] text-text-2">{text}</p>
      <Button size="sm" icon={RotateCw} onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

/** Тикающий таймер: «00:42:10» или «2д 21ч» */
export function Countdown({ to, long, className, onDone }: { to: string; long?: boolean; className?: string; onDone?: () => void }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- время известно только в браузере
    setNow(clockNow());
    const id = setInterval(() => setNow(clockNow()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = now === null ? null : new Date(to).getTime() - now;
  useEffect(() => {
    if (left !== null && left <= 0) onDone?.();
  }, [left, onDone]);
  return (
    <time dateTime={to} className={cn("tabular-nums", className)} suppressHydrationWarning>
      {left === null ? (long ? "—" : "--:--:--") : countdown(left, long)}
    </time>
  );
}

/** Функция не своего тарифа: не прячем, показываем замок + Pro и ведём на /pricing */
export function ProGate({ locked, children, label = "Доступно в Pro", className }: { locked: boolean; children: React.ReactNode; label?: string; className?: string }) {
  if (!locked) return <>{children}</>;
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none opacity-40 select-none" aria-hidden inert>
        {children}
      </div>
      <Link href="/pricing" className="absolute inset-0 flex items-center justify-center gap-2 bg-bg/40 text-[13px] font-semibold backdrop-blur-[1px] hover:bg-bg/20">
        <span className="flex items-center gap-2 border border-line-strong bg-elev-1 px-3 py-2">
          <Lock size={14} className="text-gold" aria-hidden />
          {label}
        </span>
      </Link>
    </div>
  );
}

/** Подсказка для иконок без подписи и сокращений (BO3, ACS) */
export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group/tip relative inline-flex" tabIndex={0} aria-label={text}>
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 border border-line-strong bg-elev-2 px-2.5 py-1.5 text-[12px] whitespace-nowrap normal-case tracking-normal text-text opacity-0 transition-opacity group-hover/tip:opacity-100 group-focus/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}
