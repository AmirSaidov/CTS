"use client";

import { useState } from "react";
import { Check, Globe, Plus, Upload } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { hasPlan } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { cn } from "@/shared/lib/cn";
import { Badge, ProBadge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CornerMarkers } from "@/shared/ui/card";
import { ColorPicker } from "@/shared/ui/color-picker";
import { Field, Input, Toggle } from "@/shared/ui/form";
import { PageHeader, Placeholder, TeamLogo } from "@/shared/ui/misc";
import { ProGate } from "@/shared/ui/feedback";
import { Segmented } from "@/shared/ui/tabs";

/** Брендирование (Pro): лого, акцентный цвет с проверкой контраста, спонсоры, свой домен (Лига), живое превью */
export function BrandingScreen() {
  const user = useUser();
  const pro = hasPlan(user, "pro");
  const league = hasPlan(user, "league");
  const [name, setName] = useState("[НАЗВАНИЕ КЛУБА]");
  const [slug, setSlug] = useState("club");
  const [accent, setAccent] = useState("#8BA3BE");
  const [logo, setLogo] = useState<File | null>(null);
  const [sponsors, setSponsors] = useState(2);
  const [showSponsors, setShowSponsors] = useState(true);
  const [domain, setDomain] = useState("");
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(dirty);
  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setDirty(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Организатор // Брендинг"
        title="Брендирование"
        sub="Ваш стиль на страницах турниров"
        actions={
          <>
            <ProBadge />
            <Button
              variant="primary"
              icon={Check}
              loading={busy}
              disabled={!pro}
              onClick={async () => {
                setBusy(true);
                await api.saveBranding({ name, slug, accent, showSponsors, domain });
                setBusy(false);
                setDirty(false);
                toast.success("Брендирование сохранено", "Применится ко всем турнирам организации");
              }}
            >
              Сохранить
            </Button>
          </>
        }
      />
      <div className="grid gap-6 desk:grid-cols-[420px_1fr]">
        <ProGate locked={!pro} label="Брендирование — в Pro">
          <div className="flex flex-col gap-6">
            <Card tone="raised" className="flex flex-col gap-5 p-6">
              <h2 className="t-h3">Организация</h2>
              <div className="flex items-center gap-4">
                <TeamLogo tag={logo ? "✓" : "КС"} size={72} />
                <div className="flex flex-col gap-2">
                  <label className="btn-text inline-flex h-10 w-fit cursor-pointer items-center gap-2 border border-line-strong px-4 text-[13px] hover:border-accent">
                    <Upload size={14} aria-hidden /> Загрузить логотип
                    <input type="file" accept="image/svg+xml,image/png" className="sr-only" onChange={(e) => touch(setLogo)(e.target.files?.[0] ?? null)} />
                  </label>
                  <span className="text-[13px] text-text-2">{logo?.name ?? "SVG или PNG, прозрачный фон"}</span>
                </div>
              </div>
              <Field label="Название" htmlFor="bn">
                <Input id="bn" value={name} onChange={(e) => touch(setName)(e.target.value)} />
              </Field>
              <Field label="Адрес страницы" htmlFor="bs" hint={`cts.gg/org/${slug}`}>
                <Input id="bs" value={slug} onChange={(e) => touch(setSlug)(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </Field>
            </Card>
            <Card tone="raised" className="flex flex-col gap-5 p-6">
              <h2 className="t-h3">Цвета</h2>
              <ColorPicker value={accent} onChange={touch(setAccent)} />
            </Card>
            <Card tone="raised" className="flex flex-col gap-5 p-6">
              <h2 className="t-h3">Спонсоры</h2>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: sponsors }, (_, i) => (
                  <Placeholder key={i} label="лого" className="h-16 border border-line" />
                ))}
                <button type="button" onClick={() => touch(setSponsors)(sponsors + 1)} className="hatch mono flex h-16 items-center justify-center gap-1 border border-dashed border-text-4 text-[10px] tracking-[0.14em] text-text-3 uppercase hover:text-text">
                  <Plus size={12} aria-hidden /> Добавить
                </button>
              </div>
              <Toggle label="Показывать блок спонсоров" checked={showSponsors} onChange={touch(setShowSponsors)} />
            </Card>
            <Card tone="raised" className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="t-h3">Свой домен</h2>
                <Badge tone="gold">Лига</Badge>
              </div>
              <ProGate locked={!league} label="Свой домен — на тарифе Лига">
                <Field label="Домен" htmlFor="bd" hint="Добавьте CNAME на cts.gg — SSL выпустим автоматически">
                  <Input id="bd" icon={Globe} placeholder="tournaments.club.kg" value={domain} onChange={(e) => touch(setDomain)(e.target.value)} />
                </Field>
              </ProGate>
            </Card>
          </div>
        </ProGate>
        <section className="relative self-start border border-line bg-elev-1 desk:sticky desk:top-24" aria-label="Превью страницы турнира" style={{ ["--accent" as string]: accent }}>
          <CornerMarkers tone="silver" offset={8} />
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="mono-label">Превью страницы турнира</span>
            <Segmented label="Устройство" active={device} onChange={setDevice} items={[{ key: "desktop", label: "Десктоп" }, { key: "phone", label: "Телефон" }]} />
          </div>
          <div className={cn("mx-auto transition-[max-width] duration-200", device === "phone" ? "max-w-[375px] border-x border-line" : "max-w-full")}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="flex items-center gap-3">
                <TeamLogo tag="КС" size={28} />
                <span className="font-display text-[20px]">{name}</span>
              </span>
              <span className="mono text-[9px] tracking-[0.16em] text-text-4 uppercase">Powered by CTS</span>
            </div>
            <div className={cn("grid gap-6 p-5", device === "desktop" && "tab:grid-cols-[1fr_240px]")}>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Badge>Регистрация</Badge>
                  <Badge tone="muted">Valorant</Badge>
                </div>
                <span className="font-display text-[48px] leading-none">Osh Open</span>
                <div className="flex gap-2">
                  <span className="btn-text cut flex h-10 items-center px-4 text-[13px] text-primary-ink [--cut:9px]" style={{ background: accent }}>
                    Подать заявку
                  </span>
                  <span className="btn-text flex h-10 items-center border border-line-strong px-4 text-[13px]">Правила</span>
                </div>
              </div>
              <Placeholder label="Баннер" className="h-[150px] border border-line" />
            </div>
            <div className="flex gap-6 border-b border-line px-5">
              {["Сетка", "Расписание", "Команды"].map((t, i) => (
                <span key={t} className={cn("btn-text pb-3 text-[13px]", i === 0 ? "border-b-2 text-text" : "text-text-3")} style={i === 0 ? { borderColor: accent } : undefined}>
                  {t}
                </span>
              ))}
            </div>
            <div className={cn("grid gap-3 p-5", device === "desktop" && "tab:grid-cols-2")}>
              {["QF-01 · Tengri / Iron Snow", "QF-02 · Ala-Too / KGZ Titans"].map((m) => (
                <div key={m} className="border border-line px-3 py-2 text-[13px]">
                  {m}
                </div>
              ))}
            </div>
            {showSponsors && (
              <div className="flex items-center gap-3 border-t border-line px-5 py-4">
                <span className="mono-label">Спонсоры</span>
                {Array.from({ length: Math.min(sponsors, 3) }, (_, i) => (
                  <Placeholder key={i} label="лого" className="h-9 w-20 border border-line" />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
