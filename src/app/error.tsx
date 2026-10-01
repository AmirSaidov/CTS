"use client";

import { useEffect } from "react";
import { RotateCw, Activity } from "lucide-react";
import { ApiRequestError } from "@/shared/api/client";
import { PublicHeader } from "@/shared/layouts/public-header";
import { SystemScreen } from "@/shared/layouts/system-screen";
import { Button } from "@/shared/ui/button";

/**
 * 500 «Сервер упал». REQ-ID — из ответа сервера (x-request-id) или digest ошибки Next,
 * чтобы поддержка могла найти её в логах.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const reqId = (error instanceof ApiRequestError && error.body.requestId) || error.digest || "—";
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <SystemScreen
        code="500"
        eyebrow="Ошибка сервера"
        title={
          <>
            Сервер
            <br />
            упал
          </>
        }
        text="Что-то пошло не так на нашей стороне. Мы уже знаем и чиним. Данные ваших турниров в безопасности."
        status="DEGRADED"
        requestId={reqId}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="lg" icon={RotateCw} onClick={() => reset()}>
            Обновить страницу
          </Button>
          <Button size="lg" icon={Activity} href="https://status.cts.gg">
            Статус сервисов
          </Button>
        </div>
      </SystemScreen>
    </div>
  );
}
