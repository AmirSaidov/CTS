"use client";

import { useState } from "react";
import { Check, Mail, Minus, Pencil, Send } from "lucide-react";
import type { OrgRole, StaffMember } from "@/shared/api/types";
import { api } from "@/shared/api/endpoints";
import { ORG_ACTIONS, ORG_ACTION_LABELS, ORG_ROLE_HINTS, ORG_ROLE_LABELS, ROLE_MATRIX } from "@/shared/lib/permissions";
import { toast, useUser } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/form";
import { Avatar, PageHeader } from "@/shared/ui/misc";
import { ConfirmModal, Modal } from "@/shared/ui/overlay";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

const ROLE_TONE = { owner: "gold", admin: "neutral", judge: "violet-solid", moderator: "muted" } as const;
const ROLES: OrgRole[] = ["owner", "admin", "judge", "moderator"];

export function StaffScreen({ initial }: { initial: StaffMember[] }) {
  const user = useUser();
  const [staff, setStaff] = useState(initial);
  const [who, setWho] = useState("");
  const [role, setRole] = useState<OrgRole>("judge");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<OrgRole>("admin");
  const [revoke, setRevoke] = useState<StaffMember | null>(null);
  const [used, limit] = user?.org?.limits.staff ?? [staff.length, 3];
  const full = staff.length >= limit;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Организатор // Доступы" title="Команда организаторов" sub={`${Math.max(used, staff.length - 1)} из ${limit} мест на тарифе ${user?.org?.plan === "free" ? "Free" : "Pro"}`} />
      <div className="grid gap-6 desk:grid-cols-[1fr_440px]">
        <Card className="min-w-0">
          <CardHeader title="Участники" />
          <Table minWidth={620} label="Команда организаторов">
            <THead>
              <Th sticky>Участник</Th>
              <Th>Роль</Th>
              <Th>Активность</Th>
              <Th align="right" />
            </THead>
            <tbody>
              {staff.map((s) => (
                <Tr key={s.nick}>
                  <Td sticky>
                    <span className="flex items-center gap-3">
                      <Avatar tag={s.tag} size={32} />
                      <span className="flex flex-col">
                        <span className="font-semibold">{s.nick}</span>
                        <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{s.contact}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={ROLE_TONE[s.role]}>{ORG_ROLE_LABELS[s.role]}</Badge>
                  </Td>
                  <Td className="text-text-2">{s.activity}</Td>
                  <Td align="right">
                    {s.you ? (
                      <span className="mono-label">Вы</span>
                    ) : s.pending ? (
                      <Button size="sm" variant="ghost" onClick={() => setRevoke(s)}>
                        Отозвать
                      </Button>
                    ) : (
                      <span className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => { setEdit(s); setEditRole(s.role); }}>
                          Изменить
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRevoke(s)}>
                          Отозвать
                        </Button>
                      </span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card tone="raised" className="self-start p-6">
          <CornerMarkers only="tl" />
          <h2 className="t-h3 mb-5">Пригласить</h2>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (who.trim().length < 3) return toast.error("Укажите почту или ник CTS");
              setBusy(true);
              await api.inviteStaff({ who, role });
              setStaff((l) => [...l, { nick: who, tag: who.slice(0, 2).toUpperCase(), contact: "Приглашение отправлено", role, activity: "—", pending: true }]);
              setWho("");
              setBusy(false);
              toast.success("Приглашение отправлено");
            }}
          >
            <Field label="Почта или ник CTS" htmlFor="sw">
              <Input id="sw" icon={Mail} placeholder="name@mail.kg" value={who} onChange={(e) => setWho(e.target.value)} />
            </Field>
            <Field label="Роль" htmlFor="sr" hint={ORG_ROLE_HINTS[role]}>
              <Select id="sr" value={role} onChange={(e) => setRole(e.target.value as OrgRole)} options={ROLES.filter((r) => r !== "owner").map((r) => ({ value: r, label: ORG_ROLE_LABELS[r] }))} />
            </Field>
            <Button type="submit" variant="primary" icon={Send} loading={busy} disabled={full} block>
              Отправить приглашение
            </Button>
            {full && <p className="text-[13px] text-gold">Все места заняты. Больше организаторов — на тарифе Лига.</p>}
          </form>
        </Card>
      </div>
      <Card>
        <CardHeader title="Права ролей" />
        {/* та же матрица (ROLE_MATRIX) скрывает недоступные действия во всём интерфейсе */}
        <Table minWidth={700} label="Матрица прав ролей">
          <THead>
            <Th sticky>Действие</Th>
            {ROLES.map((r) => (
              <Th key={r} align="center">
                {ORG_ROLE_LABELS[r]}
              </Th>
            ))}
          </THead>
          <tbody>
            {ORG_ACTIONS.map((a) => (
              <Tr key={a}>
                <Td sticky>{ORG_ACTION_LABELS[a]}</Td>
                {ROLES.map((r) => (
                  <Td key={r} align="center">
                    {ROLE_MATRIX[r].includes(a) ? <Check size={16} className="mx-auto" aria-label="Можно" /> : <Minus size={14} className="mx-auto text-text-4" aria-label="Нельзя" />}
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Роль: ${edit?.nick ?? ""}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setStaff((l) => l.map((s) => (s === edit ? { ...s, role: editRole } : s)));
                toast.success("Роль изменена");
                setEdit(null);
              }}
            >
              Сохранить
            </Button>
          </>
        }
      >
        <Field label="Роль" htmlFor="er" hint={ORG_ROLE_HINTS[editRole]}>
          <Select id="er" value={editRole} onChange={(e) => setEditRole(e.target.value as OrgRole)} options={ROLES.filter((r) => r !== "owner").map((r) => ({ value: r, label: ORG_ROLE_LABELS[r] }))} />
        </Field>
      </Modal>
      <ConfirmModal
        open={!!revoke}
        onClose={() => setRevoke(null)}
        danger
        title={`Отозвать доступ: ${revoke?.nick ?? ""}?`}
        text="Сотрудник потеряет доступ к панели организатора. Его действия в журнале сохранятся."
        confirmLabel="Отозвать"
        onConfirm={() => {
          setStaff((l) => l.filter((s) => s !== revoke));
          toast.success("Доступ отозван");
          setRevoke(null);
        }}
      />
    </div>
  );
}
