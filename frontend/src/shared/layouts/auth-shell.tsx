import { Logo } from "@/shared/ui/misc";

/** AuthLayout: слева атмосферный блок с лозунгом и техметками, справа форма */
export function AuthShell({ slogan, sub, children }: { slogan: React.ReactNode; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh desk:grid-cols-[640px_1fr]">
      <aside className="glow relative flex flex-col justify-between gap-10 border-line px-[var(--page-pad)] py-8 [--glow-x:30%] [--glow-y:55%] desk:border-r desk:px-16 desk:py-16">
        <Logo />
        <div className="flex flex-col gap-5 max-desk:hidden">
          <span className="mono-label text-text-2!">CTS // Tournament OS</span>
          <p className="t-display text-[clamp(56px,5.6vw,92px)]">{slogan}</p>
          <p className="max-w-[440px] text-[17px] text-text-2">{sub}</p>
        </div>
        <div className="mono flex justify-between text-[10px] tracking-[0.16em] text-text-4 uppercase max-desk:hidden" aria-hidden>
          <span>N 42.87° / E 74.59°</span>
          <span>SYS.STATUS: ONLINE</span>
        </div>
      </aside>
      <main id="main" className="flex min-w-0 items-start justify-center px-[var(--page-pad)] py-10 desk:items-center desk:py-16">
        <div className="flex w-full max-w-[480px] flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}

export function AuthTitle({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="mono text-[11px] tracking-[0.18em] text-text-2 uppercase">{"// "}{eyebrow}</span>
      <h1 className="font-display text-[clamp(40px,4.4vw,60px)] leading-[0.98]">{title}</h1>
      {sub && <p className="text-[15px] text-text-2">{sub}</p>}
    </div>
  );
}
