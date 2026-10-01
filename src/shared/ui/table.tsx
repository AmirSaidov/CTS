import { cn } from "@/shared/lib/cn";

/*
 * Таблицы: заголовки моно-капсом, строки с рамкой снизу.
 * На телефоне скроллятся горизонтально с закреплённой первой колонкой (sticky).
 */

export function Table({ children, className, minWidth = 720, label }: { children: React.ReactNode; className?: string; minWidth?: number; label?: string }) {
  return (
    <div className="relative overflow-x-auto" role="region" aria-label={label} tabIndex={label ? 0 : undefined}>
      <table className={cn("w-full border-collapse text-left", className)} style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line">{children}</tr>
    </thead>
  );
}

export function Th({ children, className, align, sticky, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; sticky?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "mono-label h-11 px-5 font-medium whitespace-nowrap first:pl-5 tab:px-4 tab:first:pl-6 last:pr-5 tab:last:pr-6",
        align === "right" && "text-right",
        align === "center" && "text-center",
        sticky && "sticky left-0 z-[1] bg-inherit",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Tr({ children, className, active, ...rest }: React.HTMLAttributes<HTMLTableRowElement> & { active?: boolean }) {
  return (
    <tr className={cn("border-b border-line transition-colors last:border-b-0", active ? "bg-elev-2" : "hover:bg-elev-1/60", className)} {...rest}>
      {children}
    </tr>
  );
}

export function Td({ children, className, align, sticky, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; sticky?: boolean }) {
  return (
    <td
      className={cn(
        "h-16 px-5 align-middle text-[14px] first:pl-5 tab:px-4 tab:first:pl-6 last:pr-5 tab:last:pr-6",
        align === "right" && "text-right",
        align === "center" && "text-center",
        sticky && "sticky left-0 z-[1] bg-bg max-tab:shadow-[1px_0_0_var(--line)]",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Ячейка «имя + моно-подпись» с логотипом */
export function NameCell({ title, sub, logo }: { title: React.ReactNode; sub?: React.ReactNode; logo?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-semibold">{title}</span>
        {sub && <span className="mono truncate text-[10px] tracking-[0.14em] text-text-3 uppercase">{sub}</span>}
      </div>
    </div>
  );
}
