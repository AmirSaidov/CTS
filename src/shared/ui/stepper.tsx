import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { pad2 } from "@/shared/lib/format";

/** Вертикальный степпер мастера (29–33): Сейчас / Готово / — */
export function Stepper({ steps, current, done, hrefFor }: { steps: string[]; current: number; done: number[]; hrefFor?: (i: number) => string | null }) {
  return (
    <ol className="flex gap-2 overflow-x-auto desk:flex-col desk:gap-1 no-scrollbar">
      {steps.map((s, i) => {
        const n = i + 1;
        const isNow = n === current;
        const isDone = done.includes(n) && !isNow;
        const href = hrefFor?.(n);
        const inner = (
          <>
            <span className={cn("mono flex size-7 shrink-0 items-center justify-center border text-[11px]", isDone ? "border-primary bg-primary text-primary-ink" : isNow ? "border-accent text-text" : "border-line text-text-3")}>
              {isDone ? <Check size={14} aria-hidden /> : pad2(n)}
            </span>
            <span className="flex flex-col">
              <span className={cn("text-[14px] font-semibold whitespace-nowrap", !isNow && !isDone && "text-text-2")}>{s}</span>
              <span className={cn("mono text-[9px] tracking-[0.16em] uppercase", isDone ? "text-success-text" : "text-text-3")}>{isNow ? "Сейчас" : isDone ? "Готово" : "—"}</span>
            </span>
          </>
        );
        const cls = cn("flex items-center gap-3 border px-4 py-3.5", isNow ? "border-accent bg-elev-2" : "border-transparent");
        return (
          <li key={s} aria-current={isNow ? "step" : undefined}>
            {href && !isNow ? (
              <Link href={href} className={cn(cls, "hover:bg-elev-1")}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Горизонтальный «ШАГ 02 / 04» с полосками — регистрация */
export function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="mono text-[11px] tracking-[0.16em] text-text-2">
        ШАГ {pad2(current)} / {pad2(total)}
      </span>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }} aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-[3px]", i < current ? "bg-primary" : "bg-line")} />
        ))}
      </div>
    </div>
  );
}
