import { cn } from "@/shared/lib/cn";

export type CornerTone = "accent" | "gold" | "bronze" | "silver" | "violet";

const CORNER_COLOR: Record<CornerTone, string> = {
  accent: "border-accent",
  gold: "border-gold",
  bronze: "border-bronze",
  silver: "border-text-2",
  violet: "border-violet-text",
};

/**
 * Уголки-маркеры: 12×12, линия 2px. `offset` — насколько выступают за рамку
 * (в макете у акцентных панелей ~8px, у карточек каталога — 1px).
 */
export function CornerMarkers({ tone = "accent", only, offset = 1 }: { tone?: CornerTone; only?: "tl" | "tl-br"; offset?: number }) {
  const c = CORNER_COLOR[tone];
  const o = `-${offset}px`;
  const base = cn("pointer-events-none absolute size-3", c);
  // без обёртки: уголки абсолютные и не должны становиться flex/grid-элементами родителя
  return (
    <>
      <span aria-hidden className={cn(base, "border-t-2 border-l-2")} style={{ top: o, left: o }} />
      {only !== "tl" && <span aria-hidden className={cn(base, "border-b-2 border-r-2")} style={{ bottom: o, right: o }} />}
      {!only && (
        <>
          <span aria-hidden className={cn(base, "border-t-2 border-r-2")} style={{ top: o, right: o }} />
          <span aria-hidden className={cn(base, "border-b-2 border-l-2")} style={{ bottom: o, left: o }} />
        </>
      )}
    </>
  );
}

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article" | "aside";
  corners?: CornerTone | false;
  cornersOnly?: "tl" | "tl-br";
  cornerOffset?: number;
  tone?: "default" | "raised" | "sunken" | "gold" | "bronze" | "accent" | "dashed" | "plain";
  padded?: boolean;
}

const TONES: Record<NonNullable<CardProps["tone"]>, string> = {
  default: "border border-line bg-bg",
  raised: "border border-line bg-elev-1",
  sunken: "border border-line bg-sunken",
  accent: "border border-accent bg-elev-2",
  gold: "border border-gold bg-elev-1",
  bronze: "border border-bronze bg-elev-1",
  dashed: "border border-dashed border-text-4 bg-elev-1",
  plain: "",
};

export function Card({ as: Tag = "section", corners = false, cornersOnly, cornerOffset, tone = "default", padded, className, children, ...rest }: CardProps) {
  return (
    <Tag className={cn("relative", TONES[tone], padded && "p-5 tab:p-6", className)} {...rest}>
      {corners && <CornerMarkers tone={corners} only={cornersOnly} offset={cornerOffset} />}
      {children}
    </Tag>
  );
}

/** Шапка панели: заголовок Oswald + правая часть (фильтры, ссылка «Все») */
export function CardHeader({ title, children, className, id }: { title: React.ReactNode; children?: React.ReactNode; className?: string; id?: string }) {
  return (
    <header className={cn("flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 tab:px-6", className)}>
      <h2 id={id} className="t-h3">
        {title}
      </h2>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Строка «ключ — значение» в боковых карточках (Детали матча, Турнир в заявке) */
export function KeyRow({ k, v, className }: { k: React.ReactNode; v: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 last:border-b-0 tab:px-6", className)}>
      <span className="text-[14px] text-text-2">{k}</span>
      <span className="text-right text-[14px] font-semibold">{v}</span>
    </div>
  );
}
