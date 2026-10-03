"use client";

import { Link2, Send } from "lucide-react";
import { toast } from "@/shared/lib/stores";
import { IconButton } from "@/shared/ui/button";

export function ShareButtons({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono-label">Поделиться</span>
      <IconButton
        icon={Link2}
        label="Скопировать ссылку"
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Ссылка скопирована");
        }}
      />
      <IconButton icon={Send} label="Отправить в Telegram" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, "_blank", "noopener")} />
    </div>
  );
}
