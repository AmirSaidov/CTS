"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/shared/ui/form";

export function RankingFilters() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete("page");
    router.replace(`${path}?${next}`, { scroll: false });
  };
  return (
    <>
      <div className="w-[180px]">
        <Select aria-label="Игра" value={params.get("game") ?? "valorant"} onChange={(e) => set("game", e.target.value)}>
          <option value="valorant">Valorant</option>
          <option value="cs2">CS2</option>
          <option value="dota2">Dota 2</option>
          <option value="mlbb">Mobile Legends</option>
        </Select>
      </div>
      <div className="w-[180px]">
        <Select aria-label="Город" value={params.get("city") ?? ""} onChange={(e) => set("city", e.target.value)}>
          <option value="">Все города</option>
          <option>Бишкек</option>
          <option>Ош</option>
          <option>Каракол</option>
        </Select>
      </div>
    </>
  );
}
