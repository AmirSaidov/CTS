import { Check } from "lucide-react";
import type { PlanInfo } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { CutFrame } from "@/shared/ui/cut-frame";
import { CONTACT_TELEGRAM } from "@/shared/lib/contacts";

/** Карточка тарифа. Цены и лимиты — с API тарифов, не хардкод. */
export function PlanCard({ plan, period = "month", compact }: { plan: PlanInfo; period?: "month" | "year"; compact?: boolean }) {
  // платных тарифов в MVP нет: Pro и Лига — заявка в Telegram команде CTS
  const href = plan.key === "free" ? "/register?role=org" : CONTACT_TELEGRAM;
  const price = period === "year" ? plan.priceYear : plan.priceMonth;
  const featured = plan.recommended;

  const body = (
    <div className={cn("flex h-full flex-col gap-6 p-7 tab:p-8", featured && "desk:py-10")}>
      <div className="flex items-center justify-between">
        <span className="mono-label">{plan.tier}</span>
        {featured && <span className="mono bg-primary px-2 py-1 text-[9px] tracking-[0.14em] text-primary-ink uppercase">Рекомендуем</span>}
      </div>
      <h3 className="font-display text-[36px]">{plan.name}</h3>
      {!compact && <p className="text-[14px] text-text-2">{plan.tagline}</p>}
      <p className="flex items-baseline gap-3">
        <span className="font-display text-[56px] leading-none">{price}</span>
        <span className="mono-label">/ мес</span>
      </p>
      {compact && (
        <ul className="flex flex-col gap-2 text-[13px] text-text-2">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <Button href={href} variant={featured ? "primary" : "secondary"} block className={compact ? "mt-auto" : undefined}>
        {plan.cta}
      </Button>
      {!compact && (
        <ul className="flex flex-col gap-3.5 border-t border-line pt-6 text-[14px] text-text-2">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-3">
              <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return featured ? (
    <CutFrame cut={22} className="desk:-my-6" fill="bg-elev-2">
      {body}
    </CutFrame>
  ) : (
    <article className="border border-line bg-bg">{body}</article>
  );
}
