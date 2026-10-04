import Link from "next/link";
import { cn } from "@/shared/lib/cn";

/** Логотип команды / аватар: квадрат со срезом правого верхнего угла и инициалами как запасной вариант */
export function TeamLogo({ tag, size = 32, src, className, square }: { tag: string; size?: number; src?: string | null; className?: string; square?: boolean }) {
  const cut = Math.max(5, Math.round(size / 6));
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-elev-2 text-text-2",
        !square && "cut-tr",
        size >= 96 ? "font-display text-text" : "mono",
        className,
      )}
      style={{ width: size, height: size, fontSize: size >= 96 ? size * 0.4 : Math.max(9, size * 0.3), ["--cut" as string]: `${cut}px` }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- логотипы с CDN бэкенда, размеры мелкие
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        tag
      )}
    </span>
  );
}

/** Квадратный аватар игрока (без среза), инициалы Oswald */
export function Avatar({ tag, size = 32, className }: { tag: string; size?: number; className?: string }) {
  return (
    <span className={cn("font-display inline-flex shrink-0 items-center justify-center bg-elev-2 text-text", className)} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
      {tag}
    </span>
  );
}

/** Плейсхолдер картинки: штриховка + моно-подпись «[ АРТ ТУРНИРА 16:9 ]» */
export function Placeholder({ label, className, aspect, children }: { label?: string; className?: string; aspect?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("hatch relative flex items-center justify-center", className)} style={{ aspectRatio: aspect }}>
      {label && <span className="mono-label text-text-3!">[ {label} ]</span>}
      {children}
    </div>
  );
}

/** Моно-метка секции: «[ 02 ] // Возможности», «КАБИНЕТ ИГРОКА // ОБЗОР» */
export function Eyebrow({ index, children, className, tone = "accent" }: { index?: string; children: React.ReactNode; className?: string; tone?: "accent" | "muted" | "gold" }) {
  return (
    <p className={cn("mono text-[11px] font-medium tracking-[0.18em] uppercase", tone === "accent" && "text-accent", tone === "muted" && "text-text-3", tone === "gold" && "text-gold", className)}>
      {index && <span>[ {index} ] </span>}
      {index && "// "}
      {children}
    </p>
  );
}

export function Logo({ href = "/", sub, className }: { href?: string; sub?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex flex-col gap-1.5", className)} aria-label="CTS — на главную">
      <span className="inline-flex items-center gap-3">
        <span className="cut-tr font-display flex size-7 items-center justify-center bg-primary text-[15px] text-primary-ink [--cut:7px]">C</span>
        <span className="font-display text-[24px] leading-none">CTS</span>
      </span>
      {sub && <span className="mono text-[9px] tracking-[0.2em] text-text-4 uppercase">{sub}</span>}
    </Link>
  );
}

/** Шапка страницы кабинета: моно-метка, H1, подзаголовок, кнопки справа */
export function PageHeader({ eyebrow, title, sub, actions, className }: { eyebrow?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-5 tab:flex-row tab:items-end tab:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="t-h1 break-words">{title}</h1>
        {sub && <p className="text-[14px] text-text-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function StatTile({ label, value, sub, tone = "default", href, subHref }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "accent" | "gold"; href?: string; subHref?: string }) {
  const body = (
    <>
      <span className={cn("mono-label", tone === "gold" && "text-gold!", tone === "accent" && "text-text!")}>{label}</span>
      <span className="font-display text-[44px] leading-none tab:text-[48px]">{value}</span>
      {sub && (subHref ? <Link href={subHref} className="text-[14px] text-text underline underline-offset-4 hover:text-accent-hover">{sub}</Link> : <span className="text-[14px] text-text-2">{sub}</span>)}
    </>
  );
  const cls = cn(
    "flex min-h-[132px] flex-col gap-3 border p-5 tab:p-6",
    tone === "accent" ? "border-accent bg-elev-2" : tone === "gold" ? "border-gold bg-elev-1" : "border-line bg-elev-1",
  );
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-line-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Ряд «Турниров / Матчей / Побед…» в профилях — без рамок, разделители слева */
export function StatRow({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-y-4 border-y border-line py-6">
      {items.map((it) => (
        <div key={it.label} className="flex min-w-[100px] flex-col gap-2 border-l border-line px-6 first:border-l-0 first:pl-0 tab:first:border-l tab:first:pl-6">
          <span className="mono-label">{it.label}</span>
          <span className="font-display text-[34px] leading-none">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({ value, tone = "primary", className, label }: { value: number; tone?: "primary" | "success" | "accent"; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1 w-full bg-line", className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full transition-[width] duration-300", tone === "success" ? "bg-success" : tone === "accent" ? "bg-accent" : "bg-primary")} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden />;
}

/** Скелетон таблицы — вместо спиннера на всю страницу */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-busy aria-label="Загрузка">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-4 border-b border-line px-6 last:border-0">
          <Skeleton className="size-8" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="ml-auto h-3 w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4" role="separator">
      <span className="h-px flex-1 bg-line" />
      {label && <span className="mono-label">{label}</span>}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mono inline-flex h-5 items-center border border-line-strong bg-elev-2 px-1.5 text-[10px] text-text-3">{children}</kbd>;
}
