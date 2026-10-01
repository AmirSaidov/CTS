"use client";

import { Link2 } from "lucide-react";
import type { GameAccount } from "@/shared/api/types";
import { USE_MOCKS } from "@/shared/api/client";
import { ACCOUNT_LABELS, ACCOUNT_TAGS } from "@/shared/lib/labels";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { TeamLogo } from "@/shared/ui/misc";

const HINTS = { riot: "Для Valorant", steam: "Для CS2 и Dota 2", discord: "Для связи с командой", telegram: "Для уведомлений о матчах" } as const;

/** Привязка игровых аккаунтов: кнопка ведёт на OAuth-эндпоинт бэкенда (Riot RSO, Steam OpenID, Discord, Telegram Login) */
export function LinkedAccounts({ accounts, variant = "rows", next = "/me/profile" }: { accounts: GameAccount[]; variant?: "rows" | "cards"; next?: string }) {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  return (
    <ul className={cn("flex flex-col", variant === "cards" && "gap-3")}>
      {accounts.map((a) => {
        const linked = !!a.value;
        return (
          <li key={a.kind} className={cn("flex items-center gap-4 px-5 py-4", variant === "cards" ? cn("border bg-elev-1", linked && a.verified ? "border-success" : "border-line") : "border-b border-line last:border-b-0 tab:px-6")}>
            <TeamLogo tag={ACCOUNT_TAGS[a.kind]} size={40} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[16px] font-semibold">{ACCOUNT_LABELS[a.kind]}</span>
              <span className="mono truncate text-[10px] tracking-[0.14em] text-text-3 uppercase">{linked ? a.value : variant === "cards" ? HINTS[a.kind] : "Не привязан"}</span>
            </span>
            {linked ? (
              <Badge tone="success">{variant === "cards" ? "Привязан" : "OK"}</Badge>
            ) : (
              <a
                href={`${api}/auth/link/${a.kind}/?next=${encodeURIComponent(next)}`}
                onClick={(e) => {
                  if (USE_MOCKS) {
                    e.preventDefault();
                    toast.info(`Привязка ${ACCOUNT_LABELS[a.kind]}`, "В режиме моков OAuth отключён — нужен бэкенд");
                  }
                }}
                className="btn-text flex h-9 items-center gap-2 border border-line-strong px-3.5 text-[13px] transition-colors hover:border-accent"
              >
                <Link2 size={14} aria-hidden /> Привязать
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
