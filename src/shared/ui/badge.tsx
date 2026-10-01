import { cn } from "@/shared/lib/cn";
import type { Tone } from "@/shared/lib/labels";

const TONES: Record<Tone, string> = {
  neutral: "border-line-strong text-text-2",
  muted: "border-line text-text-3",
  accent: "border-accent text-accent-hover",
  gold: "border-gold text-gold",
  bronze: "border-bronze text-bronze",
  violet: "border-violet text-violet-text",
  "violet-solid": "border-violet bg-violet text-white",
  success: "border-success text-success-text",
  danger: "border-danger text-danger",
};

/** Статус-тег: моно 10px в рамке. Статус не передаётся только цветом — у live/спора есть точка-квадрат. */
export function Badge({ tone = "neutral", dot, children, className, solid }: { tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string; solid?: boolean }) {
  return (
    <span
      className={cn(
        "mono inline-flex h-6 shrink-0 items-center gap-1.5 border px-2 text-[10px] font-medium uppercase tracking-[0.14em] whitespace-nowrap",
        TONES[tone],
        solid && tone === "neutral" && "border-primary bg-primary text-primary-ink",
        className,
      )}
    >
      {dot && <span className="live-dot size-1.5 bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Маленький счётчик в сайдбаре и вкладках */
export function Counter({ value, active }: { value: number | string; active?: boolean }) {
  return (
    <span className={cn("mono inline-flex h-[18px] min-w-[18px] items-center justify-center px-1 text-[10px]", active ? "bg-primary text-primary-ink" : "bg-elev-2 text-text-2")}>
      {value}
    </span>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span className={cn("mono inline-flex h-6 items-center border border-line-strong bg-elev-2 px-2 text-[10px] tracking-[0.14em] text-text-2", className)}>PRO</span>
  );
}
