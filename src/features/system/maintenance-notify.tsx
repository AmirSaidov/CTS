"use client";

import { Send } from "lucide-react";
import { Button } from "@/shared/ui/button";

/** «Уведомить в Telegram» — подписка на бота CTS, который напишет, когда работы закончатся */
export function MaintenanceNotify() {
  return (
    <Button variant="primary" size="lg" icon={Send} className="self-start" onClick={() => window.open("https://t.me/cts_gg_bot?start=maintenance", "_blank", "noopener")}>
      Уведомить в Telegram
    </Button>
  );
}
