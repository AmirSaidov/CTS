"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AtSign, Check, Eye, MapPin, Send, Tv, Upload } from "lucide-react";
import type { Player } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { toast } from "@/shared/lib/stores";
import { useUnsavedGuard } from "@/shared/lib/use-unsaved";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { Checkbox, Field, Input, Select, Textarea, Toggle } from "@/shared/ui/form";
import { FileDrop, IMAGE_TYPES } from "@/shared/ui/file-drop";
import { Avatar, PageHeader, Progress } from "@/shared/ui/misc";
import { LinkedAccounts } from "@/features/account/linked-accounts";
import { nickRule } from "@/features/auth/register-form";

const url = (host: RegExp, msg: string) => z.string().trim().refine((v) => !v || host.test(v), msg);

const schema = z.object({
  nick: nickRule,
  fullName: z.string().trim().max(60),
  city: z.string().trim().max(40),
  role: z.string(),
  about: z.string().max(500, "До 500 символов"),
  lookingForTeam: z.boolean(),
  socials: z.object({
    twitch: url(/^(https?:\/\/)?(www\.)?twitch\.tv\/[\w]+\/?$/i, "Ссылка вида twitch.tv/канал"),
    youtube: url(/^(https?:\/\/)?(www\.)?youtube\.com\/(@|c\/|channel\/)[\w-]+\/?$/i, "Ссылка вида youtube.com/@канал"),
    telegram: url(/^@[\w]{4,}$/, "Формат @username"),
    instagram: url(/^@?[\w.]{2,}$/, "Формат @username"),
  }),
  privacy: z.object({ showStats: z.boolean(), showCity: z.boolean(), invitesFromAll: z.boolean() }),
});
type Form = z.infer<typeof schema>;

function completeness(v: Form, p: Player) {
  const checks = [!!v.nick, !!v.fullName, !!v.city, !!v.about, ...p.accounts.map((a) => !!a.value), !!(v.socials.twitch || v.socials.telegram)];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function ProfileForm({ player }: { player: Player }) {
  const [banner, setBanner] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const { register, handleSubmit, control, reset, setError, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      nick: player.nick,
      fullName: player.fullName,
      city: player.city,
      role: player.role,
      about: player.about,
      lookingForTeam: player.lookingForTeam,
      socials: { twitch: player.socials.twitch ?? "", youtube: player.socials.youtube ?? "", telegram: player.socials.telegram ?? "", instagram: player.socials.instagram ?? "" },
      privacy: player.privacy,
    },
  });
  const { errors, isSubmitting, isDirty } = formState;
  useUnsavedGuard(isDirty || !!banner || !!avatar);
  const values = useWatch({ control }) as Form;
  const pct = completeness(values, player);
  const missingSteam = !player.accounts.find((a) => a.kind === "steam")?.value;

  const onSubmit = handleSubmit(async (v) => {
    try {
      await api.saveProfile({ ...v, socials: v.socials });
      reset(v);
      setBanner(null);
      setAvatar(null);
      toast.success("Профиль сохранён");
    } catch (e) {
      applyServerErrors(e, setError);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Кабинет игрока // Профиль"
        title="Мой профиль"
        sub="Так вас видят организаторы и другие игроки"
        actions={
          <>
            <Button icon={Eye} href={`/p/${player.nick.toLowerCase()}`}>
              Открыть публичный профиль
            </Button>
            <Button type="submit" variant="primary" icon={Check} loading={isSubmitting}>
              Сохранить
            </Button>
          </>
        }
      />
      <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Внешний вид" />
            <div className="flex flex-col gap-6 p-6">
              <FileDrop label="Баннер 1600×400" hint="Перетащите файл · JPG / PNG / WEBP · до 5 МБ" accept={IMAGE_TYPES} maxMb={5} value={banner} onChange={setBanner} aspect="4 / 1" />
              <div className="flex flex-wrap items-center gap-5">
                <Avatar tag={player.tag} size={112} className="text-[44px]" />
                <div className="flex flex-col gap-3">
                  <span className="font-semibold">Аватар</span>
                  <span className="text-[14px] text-text-2">PNG или JPG, минимум 400×400</span>
                  <div className="flex gap-2">
                    <label className="btn-text inline-flex h-9 cursor-pointer items-center gap-2 border border-line-strong px-3.5 text-[13px] hover:border-accent">
                      <Upload size={14} aria-hidden /> Загрузить
                      <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => setAvatar(null)}>
                      Удалить
                    </Button>
                  </div>
                  {avatar && <span className="text-[12px] text-success-text">Выбран: {avatar.name}</span>}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Основное" />
            <div className="grid gap-5 p-6 tab:grid-cols-2">
              <Field label="Ник" htmlFor="nick" error={errors.nick?.message} hint={`Уникальный · cts.gg/p/${(values.nick || "").toLowerCase()}`}>
                <Input id="nick" invalid={!!errors.nick} {...register("nick")} />
              </Field>
              <Field label="Имя и фамилия" htmlFor="fullName" hint="Видно только организаторам">
                <Input id="fullName" {...register("fullName")} />
              </Field>
              <Field label="Город" htmlFor="city">
                <Input id="city" icon={MapPin} {...register("city")} />
              </Field>
              <Field label="Основная роль" htmlFor="role">
                <Select id="role" options={["Дуэлянт", "Инициатор", "Контроллер", "Страж", "Флекс"]} {...register("role")} />
              </Field>
              <Field label="О себе" htmlFor="about" className="tab:col-span-2" error={errors.about?.message}>
                <Textarea id="about" rows={4} {...register("about")} />
              </Field>
              <Checkbox className="tab:col-span-2" label="Ищу команду" hint="Профиль появится в поиске игроков" {...register("lookingForTeam")} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Соцсети" />
            <div className="grid gap-5 p-6 tab:grid-cols-2">
              <Field label="Twitch" htmlFor="tw" error={errors.socials?.twitch?.message}>
                <Input id="tw" icon={Tv} placeholder="twitch.tv/…" invalid={!!errors.socials?.twitch} {...register("socials.twitch")} />
              </Field>
              <Field label="YouTube" htmlFor="yt" error={errors.socials?.youtube?.message}>
                <Input id="yt" icon={Tv} placeholder="youtube.com/@…" invalid={!!errors.socials?.youtube} {...register("socials.youtube")} />
              </Field>
              <Field label="Telegram" htmlFor="tg" error={errors.socials?.telegram?.message}>
                <Input id="tg" icon={Send} placeholder="@username" invalid={!!errors.socials?.telegram} {...register("socials.telegram")} />
              </Field>
              <Field label="Instagram" htmlFor="ig" error={errors.socials?.instagram?.message}>
                <Input id="ig" icon={AtSign} placeholder="@…" invalid={!!errors.socials?.instagram} {...register("socials.instagram")} />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Игровые аккаунты" />
            <LinkedAccounts accounts={player.accounts.map((a) => (a.kind === "steam" ? { ...a, value: null } : a))} />
          </Card>
          <Card>
            <CardHeader title="Приватность" />
            <div className="flex flex-col gap-5 p-6">
              {(
                [
                  ["showStats", "Показывать статистику", undefined],
                  ["showCity", "Показывать город", undefined],
                  ["invitesFromAll", "Принимать приглашения от всех", "Только от команд и организаторов, с кем играли"],
                ] as const
              ).map(([key, label, hint]) => (
                <Controller key={key} control={control} name={`privacy.${key}`} render={({ field }) => <Toggle label={label} hint={hint} checked={field.value} onChange={field.onChange} />} />
              ))}
            </div>
          </Card>
          <Card tone="raised" corners="accent" cornersOnly="tl" padded className="flex flex-col gap-4">
            <span className="mono-label">Заполненность профиля</span>
            <div className="flex items-center gap-5">
              <span className="font-display text-[48px] leading-none">{pct}%</span>
              <span className="text-[14px] text-text-2">{missingSteam ? "Привяжите Steam, чтобы участвовать в турнирах по CS2" : "Добавьте ссылку на стрим — организаторы любят видеть игру"}</span>
            </div>
            <Progress value={pct} label="Заполненность профиля" />
          </Card>
        </aside>
      </div>
    </form>
  );
}
