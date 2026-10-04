"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** FAQ-аккордеон: высота анимируется через grid-template-rows 0fr → 1fr, ответ проявляется с небольшим сдвигом */
export function Accordion({ items, openFirst }: { items: { q: string; a: string }[]; openFirst?: boolean }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(openFirst ? [0] : []));
  const base = useId();

  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        const panel = `${base}-${i}`;
        return (
          <div key={it.q} className="group border-b border-line" data-open={isOpen || undefined}>
            <h3>
              <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen} aria-controls={panel} className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left">
                <span className="font-display text-[22px] leading-tight transition-colors duration-300 group-hover:text-text group-data-open:text-text">{it.q}</span>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center border transition-colors duration-300",
                    isOpen ? "border-accent bg-elev-2 text-accent" : "border-line text-text-2 group-hover:border-line-strong group-hover:text-text",
                  )}
                  aria-hidden
                >
                  <Plus size={18} className={cn("transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]", isOpen && "rotate-[135deg]")} />
                </span>
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              inert={!isOpen}
              className={cn("grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "max-w-[760px] pb-6 text-[15px] text-text-2 transition-all duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]",
                    isOpen ? "translate-y-0 opacity-100 delay-75" : "-translate-y-2 opacity-0",
                  )}
                >
                  {it.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
