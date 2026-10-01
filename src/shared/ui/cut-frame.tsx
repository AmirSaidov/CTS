import { cn } from "@/shared/lib/cn";

/**
 * Рамка 1px, которая повторяет срез углов (clip-path срезает и border — поэтому две вложенные формы:
 * внешняя закрашена цветом линии, внутренняя — фоном с отступом 1px).
 */
export function CutFrame({ cut = 24, line = "bg-line-strong", fill = "bg-elev-1", className, children }: { cut?: number; line?: string; fill?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("cut-card p-px", line, className)} style={{ ["--cut" as string]: `${cut}px` }}>
      <div className={cn("cut-card h-full", fill)} style={{ ["--cut" as string]: `${cut - 0.5}px` }}>
        {children}
      </div>
    </div>
  );
}
