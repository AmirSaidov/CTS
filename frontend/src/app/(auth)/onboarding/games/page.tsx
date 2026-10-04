"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { cn } from "@/shared/lib/cn";
import { AuthShell, AuthTitle } from "@/shared/layouts/auth-shell";
import { Button } from "@/shared/ui/button";
import { Placeholder, Skeleton } from "@/shared/ui/misc";
import { StepBar } from "@/shared/ui/stepper";

export default function OnboardingGamesPage() {
  const router = useRouter();
  // список игр — с API (управляется в админке, экран 52)
  const { data: games } = useQuery({ queryKey: qk.games, queryFn: () => api.games() });
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));

  return (
    <AuthShell
      slogan={
        <>
          Настроим
          <br />
          под тебя
        </>
      }
      sub="Два шага — и можно подавать заявку на первый турнир."
    >
      <StepBar current={3} total={4} />
      <AuthTitle eyebrow="Онбординг" title="Во что играете?" sub="Выберите игры — покажем подходящие турниры и рейтинги." />
      <fieldset className="grid grid-cols-2 gap-3 tab:grid-cols-3">
        <legend className="sr-only">Игры</legend>
        {!games && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[150px]" />)}
        {games?.map((g) => {
          const on = picked.includes(g.slug);
          return (
            <label key={g.slug} className={cn("relative flex cursor-pointer flex-col border transition-colors", on ? "border-accent bg-elev-2" : "border-line bg-elev-1 hover:border-line-strong")}>
              {on && <span className="absolute -top-px -left-px z-[1] size-3 border-t-2 border-l-2 border-accent" aria-hidden />}
              <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(g.slug)} />
              <span className="pointer-events-none absolute inset-0 peer-focus-visible:outline peer-focus-visible:outline-accent" aria-hidden />
              <Placeholder label="Арт" className="h-[88px] border-b border-line" />
              <span className="flex min-h-[60px] items-center justify-between gap-2 px-4 py-3">
                <span className="font-display text-[17px] leading-tight">{g.name === "Counter-Strike 2" ? "CS2" : g.name}</span>
                <span className={cn("flex size-4 shrink-0 items-center justify-center border", on ? "border-primary bg-primary" : "border-line-strong")} aria-hidden>
                  {on && (
                    <svg viewBox="0 0 12 12" className="size-3 text-primary-ink">
                      <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="lg" href="/onboarding/accounts">
          Пропустить
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={ArrowRight}
          className="flex-1"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await api.saveOnboarding({ games: picked });
            router.push("/onboarding/accounts");
          }}
        >
          Далее
        </Button>
      </div>
    </AuthShell>
  );
}
