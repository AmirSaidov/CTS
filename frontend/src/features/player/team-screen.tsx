"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Crown, LogOut, Search, Send, SlidersHorizontal, X } from "lucide-react";
import type { Team } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { isCaptain } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { GAME_NAMES } from "@/shared/lib/labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/form";
import { Avatar, TeamLogo } from "@/shared/ui/misc";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

type Pending = { id: string; nick: string; kind: "sent" | "request"; meta: string };

export function TeamScreen({ team }: { team: Team }) {
  const user = useUser();
  const captain = isCaptain(user, team.slug);
  const [members, setMembers] = useState(team.members);
  const [pending, setPending] = useState<Pending[]>([
    { id: "p1", nick: "Gulnara", kind: "sent", meta: "Отправлено 26.09 · запасной" },
    { id: "p2", nick: "Nurlan", kind: "request", meta: "Заявка в команду · 25.09" },
  ]);
  const [modal, setModal] = useState<null | { kind: "kick" | "captain"; nick: string } | { kind: "leave" | "disband" }>(null);
  const [busy, setBusy] = useState(false);
  const inviteLink = `cts.gg/join/${team.tag.toLowerCase()}-7F2K`;

  const { register, handleSubmit, reset, setError, formState } = useForm<{ who: string; role: string }>({ defaultValues: { who: "", role: "Запасной" } });

  const run = async () => {
    if (!modal) return;
    setBusy(true);
    try {
      if (modal.kind === "kick") {
        await api.teamAction("kick", modal.nick);
        setMembers((m) => m.filter((x) => x.nick !== modal.nick));
        toast.success(`${modal.nick} исключён из команды`);
      } else if (modal.kind === "captain") {
        await api.teamAction("captain", modal.nick);
        setMembers((m) => m.map((x) => ({ ...x, captain: x.nick === modal.nick })));
        toast.success(`Капитанство передано: ${modal.nick}`, "Обновите страницу — у вас больше нет кнопок управления");
      } else {
        await api.teamAction(modal.kind);
        toast.success(modal.kind === "leave" ? "Вы покинули команду" : "Команда распущена");
      }
      setModal(null);
    } catch {
      toast.error("Не получилось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  const mains = members.filter((m) => m.status === "main").length;

  return (
    <div className="flex flex-col gap-8">
      <section className="glow relative flex flex-col gap-6 border border-line p-6 [--glow-x:90%] [--glow-y:50%] tab:flex-row tab:items-center tab:p-10">
        <CornerMarkers only="tl" offset={6} />
        <TeamLogo tag={team.tag} size={96} />
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex gap-2">
            <Badge>{GAME_NAMES[team.game]}</Badge>
            {team.recruiting && <Badge tone="success">Набор открыт</Badge>}
          </div>
          <h1 className="font-display text-[clamp(44px,5vw,64px)] leading-none">{team.name}</h1>
          <span className="mono text-[11px] tracking-[0.16em] text-text-3 uppercase">
            {members.length} игроков · капитан {members.find((m) => m.captain)?.nick}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {captain && <Button icon={SlidersHorizontal}>Настройки команды</Button>}
        </div>
      </section>

      <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
        <Card>
          <CardHeader title="Состав">
            <span className="mono-label">
              {members.length} / {team.maxMembers} мест
            </span>
          </CardHeader>
          <Table minWidth={captain ? 820 : 560} label="Состав команды">
            <THead>
              <Th sticky>Игрок</Th>
              <Th>Роль</Th>
              <Th>Статус</Th>
              <Th>Аккаунт</Th>
              {captain && <Th align="right">Действия</Th>}
            </THead>
            <tbody>
              {members.map((m) => (
                <Tr key={m.nick}>
                  <Td sticky>
                    <span className="flex items-center gap-3">
                      <Avatar tag={m.tag} size={32} />
                      <span className="font-semibold">{m.nick}</span>
                      {m.captain && <Badge tone="gold">Капитан</Badge>}
                    </span>
                  </Td>
                  <Td className="text-text-2">{m.role}</Td>
                  <Td>
                    <Badge tone={m.status === "main" ? "neutral" : "muted"}>{m.status === "main" ? "Основной" : "Запасной"}</Badge>
                  </Td>
                  <Td className="mono text-[12px]">RI · {m.account.ok ? "OK" : "—"}</Td>
                  {captain && (
                    <Td align="right">
                      {m.nick === user?.nick ? (
                        <span className="mono-label">Вы</span>
                      ) : (
                        <span className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" icon={Crown} onClick={() => setModal({ kind: "captain", nick: m.nick })}>
                            Капитан
                          </Button>
                          <Button size="sm" variant="ghost" icon={X} onClick={() => setModal({ kind: "kick", nick: m.nick })}>
                            Исключить
                          </Button>
                        </span>
                      )}
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
          <p className="border-t border-line px-6 py-4 text-[13px] text-text-3">
            {mains} основных и {members.length - mains} запасных. Лимиты состава зависят от игры и турнира.
          </p>
        </Card>

        <aside className="flex flex-col gap-6">
          {captain && (
            <Card tone="raised" corners="accent" cornersOnly="tl" className="p-6">
              <h2 className="t-h3 mb-5">Пригласить игрока</h2>
              <form
                noValidate
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(async (v) => {
                  try {
                    await api.teamInvite(v);
                    setPending((p) => [{ id: crypto.randomUUID(), nick: v.who, kind: "sent", meta: `Отправлено сейчас · ${v.role.toLowerCase()}` }, ...p]);
                    reset();
                    toast.success("Приглашение отправлено");
                  } catch (e) {
                    applyServerErrors(e, setError);
                  }
                })}
              >
                <Field label="Ник или почта" htmlFor="who" error={formState.errors.who?.message}>
                  <Input id="who" icon={Search} placeholder="Например, Gulnara" invalid={!!formState.errors.who} {...register("who", { required: "Укажите ник или почту" })} />
                </Field>
                <Field label="Роль" htmlFor="invite-role">
                  <Select id="invite-role" options={["Основной", "Запасной"]} {...register("role")} />
                </Field>
                <Button type="submit" variant="primary" icon={Send} loading={formState.isSubmitting} block>
                  Отправить приглашение
                </Button>
              </form>
              <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5">
                <span className="mono-label">Ссылка-приглашение</span>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink} aria-label="Ссылка-приглашение" className="mono text-[13px]" />
                  <Button
                    aria-label="Скопировать ссылку"
                    icon={Copy}
                    className="w-12 px-0"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`https://${inviteLink}`);
                      toast.success("Ссылка скопирована");
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {captain && (
            <Card>
              <CardHeader title="Ожидают ответа" />
              {pending.length === 0 && <p className="px-6 py-5 text-[14px] text-text-3">Нет ожидающих</p>}
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
                  <div className="flex flex-1 flex-col">
                    <span className="font-semibold">{p.nick}</span>
                    <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{p.meta}</span>
                  </div>
                  {p.kind === "sent" ? (
                    <Button size="sm" variant="ghost" onClick={() => setPending((l) => l.filter((x) => x.id !== p.id))}>
                      Отозвать
                    </Button>
                  ) : (
                    <span className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => { setPending((l) => l.filter((x) => x.id !== p.id)); toast.success(`${p.nick} в команде`); }}>
                        Принять
                      </Button>
                      <Button size="sm" onClick={() => setPending((l) => l.filter((x) => x.id !== p.id))}>
                        Нет
                      </Button>
                    </span>
                  )}
                </div>
              ))}
            </Card>
          )}

          <Card className="flex flex-col gap-4 p-6">
            <span className="mono-label">Опасная зона</span>
            <p className="text-[14px] text-text-2">{captain ? "Передайте капитанство перед выходом из команды." : "Выход из команды можно отменить только новым приглашением."}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" icon={LogOut} disabled={captain && members.length > 1} onClick={() => setModal({ kind: "leave" })}>
                Покинуть команду
              </Button>
              {captain && (
                <Button variant="ghost" onClick={() => setModal({ kind: "disband" })}>
                  Распустить
                </Button>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmModal
        open={!!modal}
        onClose={() => setModal(null)}
        onConfirm={run}
        loading={busy}
        danger={modal?.kind !== "captain"}
        title={modal?.kind === "kick" ? "Исключить игрока?" : modal?.kind === "captain" ? "Передать капитанство?" : modal?.kind === "leave" ? "Покинуть команду?" : "Распустить команду?"}
        text={
          modal?.kind === "kick"
            ? `${modal.nick} потеряет доступ к заявкам и матчам команды. Активные заявки на турниры нужно будет обновить.`
            : modal?.kind === "captain"
              ? `${modal.nick} станет капитаном и сможет управлять составом и подавать заявки. Вы останетесь игроком.`
              : modal?.kind === "leave"
                ? "Вы потеряете доступ к матчам и заявкам команды."
                : "Команда исчезнет из рейтинга, активные заявки будут отозваны. История турниров сохранится."
        }
        confirmLabel={modal?.kind === "kick" ? "Исключить" : modal?.kind === "captain" ? "Передать" : modal?.kind === "leave" ? "Покинуть" : "Распустить"}
      />
    </div>
  );
}
