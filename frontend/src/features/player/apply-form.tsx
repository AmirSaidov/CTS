"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Send } from "lucide-react";
import type { Game, Team, Tournament } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { ACCOUNT_TAGS, FORMAT_LABELS } from "@/shared/lib/labels";
import { fmtDayTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/stores";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers, KeyRow } from "@/shared/ui/card";
import { Checkbox, Field, Input, Select } from "@/shared/ui/form";
import { Avatar, Placeholder } from "@/shared/ui/misc";

const RULES = ["Прочитал и принимаю регламент турнира", "Все игроки старше [ВОЗРАСТ] или имеют согласие родителей", "Согласен на публикацию ников и результатов"];

export function ApplyForm({ t, team, game }: { t: Tournament; team: Team; game: Game }) {
  const router = useRouter();
  // лимиты состава и требование аккаунта — из настроек игры/турнира, не хардкод
  const { main, subs } = game.roster;
  const max = main + subs;
  const accountKind = game.accountCheck === "manual" ? null : game.accountCheck;
  const accountLabel = accountKind === "riot" ? "Riot ID" : accountKind === "steam" ? "Steam" : null;

  const [picked, setPicked] = useState<string[]>(team.members.filter((m) => m.account.ok).slice(0, max).map((m) => m.nick));
  const [telegram, setTelegram] = useState("@aktan_kg");
  const [phone, setPhone] = useState("+996 ");
  const [rules, setRules] = useState<boolean[]>(RULES.map(() => false));
  const [busy, setBusy] = useState<"send" | "draft" | null>(null);

  const problems = useMemo(() => {
    const p: string[] = [];
    if (picked.length < main) p.push(`Выберите минимум ${main} игроков`);
    if (picked.length > max) p.push(`Максимум ${max} игроков`);
    if (!/^@[\w]{4,}$/.test(telegram)) p.push("Telegram в формате @username");
    if (phone.replace(/\D/g, "").length < 12) p.push("Телефон полностью: +996 XXX XXX XXX");
    if (rules.some((r) => !r)) p.push("Отметьте все правила");
    return p;
  }, [picked, telegram, phone, rules, main, max]);

  const send = async (draft: boolean) => {
    setBusy(draft ? "draft" : "send");
    try {
      const res = await api.apply(t.slug, { team: team.slug, players: picked, telegram, phone, draft });
      if (draft) return toast.success("Черновик сохранён");
      // если включён взнос — переход на оплату (страница платёжного сервиса)
      if (res.payUrl) return window.location.assign(res.payUrl);
      toast.success("Заявка отправлена", "Статус появится в «Мои турниры»");
      router.push("/me/tournaments?tab=applications");
    } catch {
      toast.error("Не получилось отправить заявку");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader title="01 · Команда" />
          <div className="p-6">
            <Field label="Команда" htmlFor="team" hint="Капитан подаёт заявку от своей команды">
              <Select id="team" defaultValue={team.slug}>
                <option value={team.slug}>
                  {team.name} · капитан {team.captainNick}
                </option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="02 · Состав">
            <span className="mono-label">
              {picked.length} / {max} выбрано
            </span>
          </CardHeader>
          <div className="flex flex-col gap-4 p-6">
            <p className="text-[14px] text-text-2">
              Выберите {main} основных игроков и до {subs} запасных.{accountLabel && ` У всех должен быть привязан ${accountLabel}.`}
            </p>
            <div className="grid gap-3 tab:grid-cols-2">
              {team.members.map((m) => {
                const noAccount = !!accountKind && !m.account.ok;
                const on = picked.includes(m.nick);
                return (
                  <label key={m.nick} className={cn("flex items-center gap-3 border px-4 py-3.5 transition-colors", noAccount ? "cursor-not-allowed border-danger opacity-80" : on ? "cursor-pointer border-line-strong bg-elev-2" : "cursor-pointer border-line hover:border-line-strong")}>
                    <Checkbox
                      aria-label={m.nick}
                      checked={on}
                      disabled={noAccount || (!on && picked.length >= max)}
                      onChange={() => setPicked((p) => (on ? p.filter((x) => x !== m.nick) : [...p, m.nick]))}
                    />
                    <Avatar tag={m.tag} size={32} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{m.nick}</span>
                      <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">
                        {m.role}
                        {m.captain && " · капитан"}
                      </span>
                    </span>
                    {noAccount ? (
                      <span className="mono border border-danger px-2 py-1 text-[10px] text-danger">Нет {accountLabel}</span>
                    ) : m.status === "sub" ? (
                      <span className="mono border border-line px-2 py-1 text-[10px] tracking-[0.14em] text-text-3 uppercase">Запасной</span>
                    ) : (
                      accountKind && <span className="mono border border-success px-2 py-1 text-[10px] text-success-text">{ACCOUNT_TAGS[accountKind as "riot"]} · OK</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="03 · Контакт капитана" />
          <div className="grid gap-5 p-6 tab:grid-cols-2">
            <Field label="Telegram" htmlFor="tg">
              <Input id="tg" icon={Send} value={telegram} onChange={(e) => setTelegram(e.target.value)} />
            </Field>
            <Field label="Телефон" htmlFor="phone" hint="Видит только организатор">
              <Input id="phone" icon={Phone} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="04 · Правила" />
          <div className="flex flex-col gap-4 p-6">
            {RULES.map((r, i) => (
              <Checkbox key={r} label={r} checked={rules[i]} onChange={(e) => setRules((s) => s.map((v, j) => (j === i ? e.target.checked : v)))} />
            ))}
          </div>
        </Card>
      </div>

      <aside className="flex flex-col gap-6 desk:sticky desk:top-24 desk:self-start">
        <Card>
          <Placeholder label="Арт турнира" className="h-[160px] border-b border-line" />
          <KeyRow k="Турнир" v={t.name} />
          <KeyRow k="Формат" v={`${FORMAT_LABELS[t.format]} · ${t.matchFormat}`} />
          <KeyRow k="Мест" v={`${t.teams.current} / ${t.teams.max} занято`} />
          {t.registrationClosesAt && <KeyRow k="Регистрация до" v={fmtDayTime(t.registrationClosesAt)} />}
          <KeyRow k="Взнос" v={t.fee ?? "Бесплатно"} />
        </Card>
        <Card tone="raised" className="flex flex-col gap-4 p-6">
          <CornerMarkers only="tl" />
          <p className="text-[14px] text-text-2">После отправки заявку проверит организатор. Статус появится в «Мои турниры», уведомление придёт в Telegram.</p>
          {problems.length > 0 && (
            <ul className="flex flex-col gap-1 text-[13px] text-text-3" aria-live="polite">
              {problems.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
          )}
          <Button variant="primary" size="lg" icon={Send} block disabled={problems.length > 0} loading={busy === "send"} onClick={() => send(false)}>
            Отправить заявку
          </Button>
          <Button block loading={busy === "draft"} onClick={() => send(true)}>
            Сохранить черновик
          </Button>
        </Card>
      </aside>
    </div>
  );
}
