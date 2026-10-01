import { PublicHeader } from "@/shared/layouts/public-header";
import { PublicFooter } from "@/shared/layouts/public-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader
        variant="landing"
        items={[
          { href: "/#features", label: "Возможности" },
          { href: "/#audience", label: "Для кого" },
          { href: "/#pricing", label: "Тарифы" },
          { href: "/tournaments", label: "Игрокам" },
        ]}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
