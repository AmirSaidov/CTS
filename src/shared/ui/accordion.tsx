import { Plus } from "lucide-react";

/** FAQ-аккордеон на нативном <details>: работает без JS и с клавиатуры */
export function Accordion({ items, openFirst }: { items: { q: string; a: string }[]; openFirst?: boolean }) {
  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <details key={it.q} open={openFirst && i === 0} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <span className="font-display text-[22px] leading-tight">{it.q}</span>
            <Plus size={18} className="shrink-0 text-text-2 transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <p className="max-w-[760px] pb-6 text-[15px] text-text-2">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
