"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRealtimeStatus } from "@/shared/realtime/provider";

/** Плашка «Нет соединения» — показываем только если связь пропала дольше 2 секунд (без мигания при переподключении). */
export function ConnectionBanner() {
  const status = useRealtimeStatus();
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "open") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация с внешним сокетом
      setVisible(false);
      return;
    }
    if (status === "closed") {
      const id = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(id);
    }
  }, [status]);

  if (!visible) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b border-gold bg-elev-1 px-4 py-2.5 text-[13px] text-text">
      <WifiOff size={16} className="text-gold" aria-hidden />
      {t("offline")}
    </div>
  );
}
