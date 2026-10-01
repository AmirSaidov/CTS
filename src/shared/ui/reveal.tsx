"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

/** Появление секции при скролле: fade + сдвиг 16px. Без параллакса; reduced-motion — сразу видно. */
export function Reveal({ children, className, as: Tag = "div", delay = 0 }: { children: React.ReactNode; className?: string; as?: "div" | "section"; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} data-shown={shown} className={cn("reveal", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
