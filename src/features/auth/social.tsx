"use client";

import { USE_MOCKS } from "@/shared/api/client";
import { toast } from "@/shared/lib/stores";
import { Divider } from "@/shared/ui/misc";

const PROVIDERS = [
  ["discord", "Discord"],
  ["google", "Google"],
  ["telegram", "Telegram"],
] as const;

/** OAuth: кнопки ведут на эндпоинты бэкенда; после колбэка — тот же редирект, что при обычном входе (next) */
export function SocialLogin({ next }: { next?: string }) {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  return (
    <div className="flex flex-col gap-6">
      <Divider label="или" />
      <div className="grid grid-cols-3 gap-3">
        {PROVIDERS.map(([key, label]) => (
          <a
            key={key}
            href={`${api}/auth/oauth/${key}/?next=${encodeURIComponent(next ?? "/me")}`}
            onClick={(e) => {
              if (USE_MOCKS) {
                e.preventDefault();
                toast.info(`Вход через ${label}`, "В режиме моков OAuth отключён — нужен бэкенд");
              }
            }}
            className="btn-text flex h-11 items-center justify-center border border-line-strong text-[14px] transition-colors hover:border-accent hover:bg-elev-2"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
