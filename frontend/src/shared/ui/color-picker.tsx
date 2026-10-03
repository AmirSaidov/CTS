"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Input } from "./form";

/** 5 пресетов + свой HEX. Тёмные и «кислотные» цвета отклоняем — проверяем контраст к фону. */
export const ACCENT_PRESETS = ["#D5DBE3", "#E07A2E", "#C9A45C", "#3B82D6", "#5B2A86"];

function luminance(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

export function checkAccent(hex: string): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "Формат: #RRGGBB";
  const bg = luminance("#0b0d11");
  const contrast = (luminance(hex) + 0.05) / (bg + 0.05);
  if (contrast < 3) return `Слишком тёмный: контраст с фоном ${contrast.toFixed(1)} : 1, нужно от 3 : 1`;
  if (saturation(hex) > 0.92 && luminance(hex) > 0.35) return "Слишком кислотный цвет — выберите спокойнее";
  return null;
}

export function ColorPicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState(value);
  const error = checkAccent(draft);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Акцентный цвет">
        {ACCENT_PRESETS.map((c) => {
          const on = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c}
              disabled={disabled}
              onClick={() => { setDraft(c); onChange(c); }}
              className={cn("size-11 border-2 p-1 transition-colors disabled:opacity-40", on ? "border-text" : "border-transparent hover:border-line-strong")}
            >
              <span className="block size-full" style={{ background: c }} />
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <span className="mono-label text-text-2!">Свой HEX</span>
        <Input
          value={draft}
          disabled={disabled}
          invalid={!!error}
          onChange={(e) => {
            const v = e.target.value.trim();
            setDraft(v);
            if (!checkAccent(v)) onChange(v);
          }}
          maxLength={7}
          aria-label="Свой HEX"
        />
        {error ? <p role="alert" className="text-[12px] text-danger">{error}</p> : <p className="text-[12px] text-text-3">Фон и шрифты остаются в стиле CTS — так страницы читаются одинаково хорошо.</p>}
      </div>
    </div>
  );
}
