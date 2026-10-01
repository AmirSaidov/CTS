"use client";

import { useRef } from "react";
import { cn } from "@/shared/lib/cn";

/** 6 ячеек: автопереход, Backspace назад, вставка кода целиком (экран 18) */
export function OtpInput({ value, onChange, length = 6, invalid, autoFocus }: { value: string; onChange: (v: string) => void; length?: number; invalid?: boolean; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  const set = (i: number, ch: string) => {
    const next = chars.slice();
    next[i] = ch;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div className="grid gap-2 tab:gap-3" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }} role="group" aria-label="Код подтверждения">
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={1}
          aria-label={`Цифра ${i + 1}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "font-display aspect-square w-full border bg-transparent text-center text-[34px] outline-none transition-colors focus:border-accent",
            c ? "border-line-strong bg-elev-1" : "border-line",
            invalid && "border-danger",
          )}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            set(i, d);
            if (d && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!digits) return;
            e.preventDefault();
            onChange(digits);
            refs.current[Math.min(digits.length, length - 1)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
