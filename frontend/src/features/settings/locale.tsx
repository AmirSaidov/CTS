"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { now } from "@/shared/lib/clock";
import { fmtDate, fmtWeekday, tzLabel } from "@/shared/lib/format";
import { toast } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Button } from "@/shared/ui/button";
import { Field, RadioCard, Select, Toggle } from "@/shared/ui/form";
import { PageHeader } from "@/shared/ui/misc";
import { SettingsSection } from "./section";

const LANGS = [
  { key: "ru", code: "RU", name: "Русский", note: "По умолчанию" },
  { key: "ky", code: "KY", name: "Кыргызча", note: "Бета" },
  { key: "en", code: "EN", name: "English", note: "Interface in English" },
  { key: "kk", code: "KZ", name: "Қазақша", note: "Скоро", disabled: true },
];
const ZONES = ["Asia/Bishkek", "Asia/Almaty", "Asia/Tashkent", "Asia/Dushanbe", "Europe/Moscow"];

export function LocaleSettings({ locale }: { locale: string }) {
  const router = useRouter();
  const [tz, setTz] = useState("Asia/Bishkek");
  const [auto, setAuto] = useState(true);
  const [dateFmt, setDateFmt] = useState("dd.MM.yyyy");
  const [weekStart, setWeekStart] = useState("mon");
  const [currency, setCurrency] = useState("KGS");
  const [clock, setClock] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- пояс браузера известен только на клиенте
    if (auto) setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [auto]);

  useEffect(() => {
    const tick = () => setClock(new Date(now()).toLocaleTimeString("ru-RU", { timeZone: tz, hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [tz]);

  const nowIso = new Date(now()).toISOString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Настройки // Регион"
        title="Язык и часовой пояс"
        sub="Интерфейс, даты и время матчей"
        actions={
          <Button
            variant="primary"
            icon={Check}
            disabled={!dirty}
            onClick={async () => {
              await api.saveLocale({ locale, timezone: tz, autoTz: auto, dateFormat: dateFmt, weekStart, currency });
              setDirty(false);
              toast.success("Сохранено");
            }}
          >
            Сохранить
          </Button>
        }
      />
      <SettingsSection title="Язык интерфейса" text="Письма и уведомления тоже придут на этом языке.">
        <div className="grid gap-3 tab:grid-cols-2">
          {LANGS.map((l) => (
            <RadioCard
              key={l.key}
              name="lang"
              value={l.key}
              eyebrow={l.code}
              title={l.name}
              text={l.note}
              disabled={l.disabled}
              checked={locale === l.key}
              onSelect={() => {
                // смена языка применяется сразу: cookie + перерисовка серверных компонентов
                document.cookie = `NEXT_LOCALE=${l.key}; path=/; max-age=31536000; samesite=lax`;
                router.refresh();
                toast.success(`Язык: ${l.name}`);
              }}
            />
          ))}
        </div>
      </SettingsSection>
      <SettingsSection title="Часовой пояс" text="Все матчи отображаются в вашем часовом поясе.">
        <Field label="Часовой пояс" htmlFor="tz">
          <Select id="tz" value={tz} disabled={auto} onChange={(e) => { setTz(e.target.value); setDirty(true); }}>
            {[...new Set([tz, ...ZONES])].map((z) => (
              <option key={z} value={z}>
                ({tzLabel(z)}) {z.split("/")[1]?.replace("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Toggle label="Определять автоматически" hint="По настройкам браузера" checked={auto} onChange={(v) => { setAuto(v); setDirty(true); }} />
        <div className="flex items-center gap-5 border border-line bg-elev-1 px-6 py-5" aria-live="polite">
          <span className="mono-label">Сейчас</span>
          <span className="font-display text-[34px] leading-none" suppressHydrationWarning>
            {clock ?? "--:--"}
          </span>
          <span className="mono text-[11px] tracking-[0.14em] text-text-2 uppercase" suppressHydrationWarning>
            {fmtWeekday(nowIso, tz)} · {fmtDate(nowIso, tz)} · {tzLabel(tz)}
          </span>
        </div>
      </SettingsSection>
      <SettingsSection title="Формат" text="Как показывать даты и время.">
        <div className="grid gap-4 tab:grid-cols-2">
          <Field label="Дата" htmlFor="df">
            <Select id="df" value={dateFmt} onChange={(e) => { setDateFmt(e.target.value); setDirty(true); }} options={[{ value: "dd.MM.yyyy", label: "28.09.2026" }, { value: "yyyy-MM-dd", label: "2026-09-28" }, { value: "d MMMM", label: "28 сентября" }]} />
          </Field>
          <Field label="Время" htmlFor="tf">
            <Select id="tf" defaultValue="24" options={[{ value: "24", label: "24 часа · 19:00" }]} />
          </Field>
          <Field label="Первый день недели" htmlFor="ws">
            <Select id="ws" value={weekStart} onChange={(e) => { setWeekStart(e.target.value); setDirty(true); }} options={[{ value: "mon", label: "Понедельник" }, { value: "sun", label: "Воскресенье" }]} />
          </Field>
          <Field label="Валюта" htmlFor="cur">
            <Select id="cur" value={currency} onChange={(e) => { setCurrency(e.target.value); setDirty(true); }} options={[{ value: "KGS", label: "KGS · сом" }, { value: "KZT", label: "KZT · тенге" }, { value: "USD", label: "USD" }]} />
          </Field>
        </div>
      </SettingsSection>
    </div>
  );
}
