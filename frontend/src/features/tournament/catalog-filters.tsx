"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input, Select } from "@/shared/ui/form";
import { Chips } from "@/shared/ui/tabs";

/** Все фильтры каталога пишутся в URL (?game=valorant&status=open) — ссылкой можно поделиться. */
export function CatalogFilters({ games, cities, found }: { games: { value: string; label: string }[]; cities: string[]; found: number }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    start(() => router.replace(`${path}?${next.toString()}`, { scroll: false }));
  };

  // поиск — с задержкой, чтобы не дёргать API на каждую букву
  useEffect(() => {
    if ((params.get("search") ?? "") === search) return;
    const id = setTimeout(() => set({ search: search || null }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const status = params.get("status") ?? "all";
  const word = found % 10 === 1 && found % 100 !== 11 ? "турнир" : [2, 3, 4].includes(found % 10) && ![12, 13, 14].includes(found % 100) ? "турнира" : "турниров";

  return (
    <div className="flex flex-col gap-6" aria-busy={pending}>
      <div className="grid gap-3 tab:grid-cols-2 desk:grid-cols-[minmax(0,420px)_180px_180px_220px]">
        <Input icon={Search} type="search" placeholder="Название турнира или организатора" aria-label="Поиск турниров" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Игра" value={params.get("game") ?? ""} onChange={(e) => set({ game: e.target.value || null })}>
          <option value="">Все игры</option>
          {games.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        <Select aria-label="Город" value={params.get("city") ?? ""} onChange={(e) => set({ city: e.target.value || null })}>
          <option value="">Все города</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="Сортировка" value={params.get("ordering") ?? "start"} onChange={(e) => set({ ordering: e.target.value === "start" ? null : e.target.value })}>
          <option value="start">Сначала ближайшие</option>
          <option value="-start">Сначала поздние</option>
          <option value="prize">По призовому</option>
        </Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Chips
          active={status}
          onChange={(k) => set({ status: k === "all" ? null : k })}
          items={[
            { key: "all", label: "Все" },
            { key: "open", label: "Регистрация открыта" },
            { key: "live", label: "Идут сейчас" },
            { key: "finished", label: "Завершённые" },
            { key: "online", label: "Онлайн" },
            { key: "lan", label: "LAN" },
          ]}
        />
        <span className="mono-label" aria-live="polite">
          Найдено: {found} {word}
        </span>
      </div>
    </div>
  );
}
