import { Eyebrow } from "@/shared/ui/misc";
import { StatusBar } from "./public-footer";
import { cn } from "@/shared/lib/cn";

/** Каркас 404 / 500 / 503: огромные контурные цифры, свечение, моно-метка, нижняя полоса с REQ-ID */
export function SystemScreen({
  code,
  eyebrow,
  title,
  text,
  children,
  status = "ONLINE",
  requestId,
  tone = "accent",
}: {
  code: string;
  eyebrow: string;
  title: React.ReactNode;
  text: string;
  children: React.ReactNode;
  status?: string;
  requestId?: string;
  tone?: "accent" | "gold";
}) {
  return (
    <div className="glow relative flex flex-1 flex-col overflow-hidden [--glow-x:70%] [--glow-y:50%]">
      <span aria-hidden className="font-display outline-digits pointer-events-none absolute top-1/2 right-[4%] hidden -translate-y-1/2 text-[min(30vw,460px)] leading-none select-none desk:block">
        {code}
      </span>
      <div className="relative mx-auto flex w-full max-w-[calc(var(--content-max)+2*var(--page-pad))] flex-1 flex-col justify-center gap-7 px-[var(--page-pad)] py-20">
        <Eyebrow tone={tone === "gold" ? "gold" : "accent"}>
          ERR.{code} {"// "}{eyebrow}
        </Eyebrow>
        <h1 className={cn("t-display max-w-[640px]")}>{title}</h1>
        <p className="max-w-[520px] text-[17px] text-text-2 tab:text-[18px]">{text}</p>
        {children}
      </div>
      <StatusBar status={status} requestId={requestId} />
    </div>
  );
}
