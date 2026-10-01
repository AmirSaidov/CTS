import type { Metadata } from "next";
import { PublicHeader } from "@/shared/layouts/public-header";
import { SystemScreen } from "@/shared/layouts/system-screen";
import { CornerMarkers } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/misc";
import { MaintenanceNotify } from "@/features/system/maintenance-notify";

export const metadata: Metadata = { title: "Технические работы", robots: { index: false } };

/** 503 «Пит-стоп»: сюда ведёт клиент API, когда Django отвечает 503 / флаг maintenance */
export default function MaintenancePage() {
  // окончание и прогресс придут из ответа /api/v1/status (поле maintenance); пока — значения макета
  const until = "~ 02:00 UTC+6";
  const progress = 70;
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <SystemScreen code="503" eyebrow="Технические работы" title="Пит-стоп" text="Обновляем CTS. Матчи и сетки не пострадают — все результаты сохранятся." status="DEGRADED" tone="gold">
        <MaintenanceNotify />
        <div className="relative grid max-w-[720px] items-center gap-6 border border-line bg-elev-1 p-6 tab:grid-cols-[auto_1fr]">
          <CornerMarkers only="tl" />
          <div className="flex flex-col gap-2">
            <span className="mono-label text-text-2!">Окончание работ</span>
            <span className="font-display text-[34px] leading-none">{until}</span>
          </div>
          <div className="flex flex-col gap-3">
            <span className="mono-label">Прогресс</span>
            <Progress value={progress} label="Прогресс технических работ" />
          </div>
        </div>
      </SystemScreen>
    </div>
  );
}
