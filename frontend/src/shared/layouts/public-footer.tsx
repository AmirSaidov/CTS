import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function PublicFooter() {
  const t = await getTranslations("footer");
  const links = [
    ["/pricing", t("pricing")],
    ["/legal/privacy", t("privacy")],
    ["/legal/terms", t("terms")],
  ];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[calc(var(--content-max)+2*var(--page-pad))] flex-col gap-6 px-[var(--page-pad)] py-10 tab:flex-row tab:items-center tab:justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display text-[24px]">CTS</span>
          <span className="mono text-[11px] tracking-[0.16em] text-text-3 uppercase">{t("copy")}</span>
        </div>
        <nav aria-label="Ссылки в подвале" className="flex flex-wrap gap-x-7 gap-y-3">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="mono text-[11px] tracking-[0.16em] text-text-2 uppercase hover:text-text">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** Нижняя полоса системных страниц: SYS.STATUS · REQ-ID · © */
export function StatusBar({ status = "ONLINE", requestId }: { status?: string; requestId?: string }) {
  return (
    <div className="mt-auto border-t border-line">
      <div className="mono mx-auto flex h-[var(--footer-h)] max-w-[calc(var(--content-max)+2*var(--page-pad))] items-center justify-between gap-4 px-[var(--page-pad)] text-[10px] tracking-[0.16em] text-text-4 uppercase">
        <span>SYS.STATUS: {status}</span>
        {requestId && <span className="hidden tab:inline">REQ-ID {requestId}</span>}
        <span>© 2026 CTS</span>
      </div>
    </div>
  );
}
