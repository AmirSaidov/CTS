"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SessionUser } from "@/shared/api/types";
import { ApiRequestError } from "@/shared/api/client";
import { RealtimeProvider } from "@/shared/realtime/provider";
import { SessionStoreProvider } from "@/shared/lib/stores";
import { Toaster } from "@/shared/ui/toast";
import { ConnectionBanner } from "@/shared/ui/connection-banner";

export function Providers({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // 4xx не повторяем — это не сетевой сбой
            retry: (n, e) => !(e instanceof ApiRequestError && e.status < 500) && n < 2,
          },
        },
      }),
  );

  // смена пользователя (вход/выход/переключение роли) пересоздаёт стор сессии
  const identity = user ? `${user.id}:${user.org?.role ?? "-"}:${user.captainOf ?? "-"}:${user.isPlatformAdmin}` : "guest";

  return (
    <QueryClientProvider client={client}>
      <SessionStoreProvider key={identity} user={user}>
        <RealtimeProvider>
          {children}
          <ConnectionBanner />
          <Toaster />
        </RealtimeProvider>
      </SessionStoreProvider>
    </QueryClientProvider>
  );
}
