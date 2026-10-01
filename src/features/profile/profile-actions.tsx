"use client";

import { useRouter } from "next/navigation";
import { Link2, MessageSquare, Plus } from "lucide-react";
import { toast, useUser } from "@/shared/lib/stores";
import { Button, IconButton } from "@/shared/ui/button";

/** Кнопки профиля. Для гостя ведут на вход с возвратом обратно. */
export function ProfileActions({ primary, message, path }: { primary: string; message: string; path: string }) {
  const user = useUser();
  const router = useRouter();
  const guard = (fn: () => void) => () => (user ? fn() : router.push(`/login?next=${encodeURIComponent(path)}`));

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={guard(() => toast.success("Заявка отправлена", "Ответ придёт в уведомления"))}>
        {primary}
      </Button>
      <Button icon={MessageSquare} onClick={guard(() => toast.info("Сообщения появятся в следующем релизе", "Пока свяжитесь через Telegram из профиля"))}>
        {message}
      </Button>
      <IconButton
        icon={Link2}
        label="Скопировать ссылку"
        size={40}
        className="size-11"
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.origin + path);
          toast.success("Ссылка скопирована");
        }}
      />
    </>
  );
}
