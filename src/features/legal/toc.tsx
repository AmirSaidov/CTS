"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

/** Липкое оглавление с подсветкой текущего раздела */
export function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Содержание" className="hidden desk:block">
      <div className="sticky top-24 flex flex-col">
        <span className="mono-label mb-4">Содержание</span>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined} className={cn("border-l-2 py-2.5 pl-4 text-[14px] transition-colors", active === s.id ? "border-accent text-text" : "border-line text-text-2 hover:text-text")}>
            {s.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
