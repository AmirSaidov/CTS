"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./button";

export interface FileDropProps {
  label: string;
  hint: string; // «1920×1080 · до 5 МБ · JPG / PNG / WEBP»
  accept: string[]; // mime-типы
  maxMb: number;
  value: File | null;
  onChange: (f: File | null) => void;
  aspect?: string; // «16 / 9»
  compact?: boolean;
  className?: string;
}

/** Пунктирная зона загрузки: проверка типа и размера на клиенте, превью до отправки, «Удалить». */
export function FileDrop({ label, hint, accept, maxMb, value, onChange, aspect, compact, className }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !value.type.startsWith("image/")) return;
    const url = URL.createObjectURL(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL живёт вместе с файлом
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const take = (f: File | undefined) => {
    if (!f) return;
    if (!accept.includes(f.type)) return setError(`Формат не подходит: нужен ${accept.map((a) => a.split("/")[1].toUpperCase()).join(" / ")}`);
    if (f.size > maxMb * 1024 * 1024) return setError(`Файл больше ${maxMb} МБ`);
    setError(null);
    onChange(f);
  };

  if (value) {
    return (
      <div className={cn("relative border border-line bg-sunken", className)} style={{ aspectRatio: aspect }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob-превью, next/image не нужен
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex h-full min-h-24 items-center px-5 text-[14px]">{value.name}</div>
        )}
        <div className="absolute right-3 bottom-3 flex gap-2">
          <Button size="sm" variant="secondary" className="bg-bg" icon={X} onClick={() => { onChange(null); setPreview(null); }}>
            Удалить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed text-center transition-colors",
          compact ? "flex-row gap-4 px-5 py-5 text-left" : "px-6 py-10",
          over ? "border-accent bg-elev-2" : "border-text-4 hover:border-line-strong",
          error && "border-danger",
        )}
        style={{ aspectRatio: compact ? undefined : aspect }}
      >
        <Upload size={compact ? 20 : 26} strokeWidth={1.5} className="text-text-2" aria-hidden />
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-semibold">{label}</span>
          <span className="mono-label">{hint}</span>
        </div>
        {!compact && (
          <span className="btn-text mt-1 border border-line-strong px-4 py-2 text-[13px]">Выбрать файл</span>
        )}
      </div>
      <input ref={input} type="file" accept={accept.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => take(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-2 text-[12px] text-danger">{error}</p>}
    </div>
  );
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
