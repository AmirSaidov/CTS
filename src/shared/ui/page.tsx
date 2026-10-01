import { cn } from "@/shared/lib/cn";
import { Eyebrow } from "./misc";

/** Контейнер публичной страницы: до 1280px по центру, поля 80/32/16 */
export function Container({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" }) {
  return <Tag className={cn("mx-auto w-full max-w-[calc(var(--content-max)+2*var(--page-pad))] px-[var(--page-pad)]", className)}>{children}</Tag>;
}

/** «Ивентовая» шапка публичных страниц: моно-метка, огромный заголовок, текст справа, свечение */
export function PublicHero({ eyebrow, title, aside, children, center }: { eyebrow: React.ReactNode; title: React.ReactNode; aside?: React.ReactNode; children?: React.ReactNode; center?: boolean }) {
  return (
    <section className="glow [--glow-x:75%] [--glow-y:10%]">
      <Container className={cn("flex flex-col gap-8 pt-14 pb-10 tab:pt-16", center && "items-center text-center")}>
        <div className={cn("grid gap-6", !center && "desk:grid-cols-[1fr_auto] desk:items-end")}>
          <div className="flex flex-col gap-5">
            <Eyebrow tone="accent">{eyebrow}</Eyebrow>
            <h1 className="t-display">{title}</h1>
          </div>
          {aside && <div className="max-w-[400px] text-[16px] text-text-2 desk:pb-4">{aside}</div>}
        </div>
        {children}
      </Container>
    </section>
  );
}
