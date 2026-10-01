"use client";

import Link from "next/link";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { useToasts } from "@/shared/lib/stores";
import { cn } from "@/shared/lib/cn";

const ICONS = { success: Check, error: TriangleAlert, info: Info };

/** Тосты справа внизу, 4–6 секунд. aria-live — чтобы скринридер зачитал. */
export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(380px,calc(100%-32px))] flex-col gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex animate-[cts-rise_.2s_ease-out] gap-3 border bg-elev-1 p-4",
              t.tone === "success" && "border-success",
              t.tone === "error" && "border-danger",
              t.tone === "info" && "border-line-strong",
            )}
          >
            <Icon size={18} className={cn("mt-0.5 shrink-0", t.tone === "success" ? "text-success-text" : t.tone === "error" ? "text-danger" : "text-accent")} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[15px] font-semibold">{t.title}</span>
              {t.body && <span className="text-[13px] text-text-2">{t.body}</span>}
              {t.action && (
                <Link href={t.action.href} className="btn-text mt-1 self-start text-[13px] text-accent-hover hover:text-text" onClick={() => dismiss(t.id)}>
                  {t.action.label}
                </Link>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="self-start text-text-3 hover:text-text" aria-label="Закрыть">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
