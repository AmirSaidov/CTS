import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Пагинация ‹ 1 2 3 … 12 › — ссылки, чтобы страница была в URL */
export function Pagination({ page, pages, hrefFor, className }: { page: number; pages: number; hrefFor: (p: number) => string; className?: string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, 2, 3, page - 1, page, page + 1, pages].filter((p) => p >= 1 && p <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const cell = "mono flex size-10 items-center justify-center border text-[13px] transition-colors";
  return (
    <nav aria-label="Страницы" className={cn("flex items-center justify-center gap-1.5", className)}>
      <Link href={hrefFor(Math.max(1, page - 1))} aria-label="Назад" aria-disabled={page === 1} className={cn(cell, "border-line text-text-2 hover:border-line-strong aria-disabled:pointer-events-none aria-disabled:opacity-40")}>
        <ChevronLeft size={14} />
      </Link>
      {list.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - list[i - 1] > 1 && <span className={cn(cell, "border-line text-text-3")}>…</span>}
          <Link href={hrefFor(p)} aria-current={p === page ? "page" : undefined} className={cn(cell, p === page ? "border-accent bg-elev-2 text-text" : "border-line text-text-2 hover:border-line-strong")}>
            {p}
          </Link>
        </span>
      ))}
      <Link href={hrefFor(Math.min(pages, page + 1))} aria-label="Вперёд" aria-disabled={page === pages} className={cn(cell, "border-line text-text-2 hover:border-line-strong aria-disabled:pointer-events-none aria-disabled:opacity-40")}>
        <ChevronRight size={14} />
      </Link>
    </nav>
  );
}
