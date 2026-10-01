import type { Metadata } from "next";
import { headers } from "next/headers";
import { House, Search } from "lucide-react";
import { PublicHeader } from "@/shared/layouts/public-header";
import { SystemScreen } from "@/shared/layouts/system-screen";
import { Button } from "@/shared/ui/button";

export const metadata: Metadata = { title: "Страница не найдена", robots: { index: false } };

export default async function NotFound() {
  const reqId = (await headers()).get("x-request-id") ?? undefined;
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <SystemScreen
        code="404"
        eyebrow="Страница не найдена"
        title="Вне карты"
        text="Такой страницы нет или её переместили. Возможно, турнир уже завершён или ссылка устарела."
        requestId={reqId}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="lg" icon={House} href="/">
            На главную
          </Button>
          <Button size="lg" href="/tournaments">
            Каталог турниров
          </Button>
        </div>
        <form action="/tournaments" role="search" className="relative w-full max-w-[420px]">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-3" aria-hidden />
          <input name="search" type="search" placeholder="Найти турнир, команду или игрока" aria-label="Поиск" className="h-12 w-full border border-line bg-transparent pr-4 pl-11 text-[15px] outline-none placeholder:text-text-3 focus:border-accent" />
        </form>
      </SystemScreen>
    </div>
  );
}
