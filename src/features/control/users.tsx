"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ban, Download, Eye, LogIn, Search } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Card, CardHeader, KeyRow } from "@/shared/ui/card";
import { Field, Input, Select } from "@/shared/ui/form";
import { Avatar, PageHeader, StatTile, TableSkeleton } from "@/shared/ui/misc";
import { ConfirmModal, Modal } from "@/shared/ui/overlay";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";
import { EmptyStateView } from "@/shared/ui/empty-state";

type U = Awaited<ReturnType<typeof api.adminUsers>>[number];
const TYPE = { org: { label: "Организация", tone: "violet-solid" }, player: { label: "Игрок", tone: "muted" }, organizer: { label: "Организатор", tone: "neutral" } } as const;
const PLAN = { free: { label: "Free", tone: "muted" }, pro: { label: "Pro", tone: "neutral" }, league: { label: "Лига", tone: "gold" } } as const;
const STATUS = { active: { label: "Активен", tone: "success" }, blocked: { label: "Заблокирован", tone: "accent" }, review: { label: "На проверке", tone: "gold" } } as const;

export function UsersScreen({ initial }: { initial: U[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "player" | "org" | "blocked" | "review">("all");
  const { data, isFetching } = useQuery({ queryKey: qk.adminUsers({ search }), queryFn: () => api.adminUsers({ search }), initialData: search ? undefined : initial });
  const [open, setOpen] = useState<U | null>(null);
  const [block, setBlock] = useState<U | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<U>>>({});

  const list = (data ?? [])
    .map((u) => ({ ...u, ...overrides[u.name] }))
    .filter((u) => (filter === "all" ? true : filter === "player" ? u.type === "player" : filter === "org" ? u.type !== "player" : u.status === filter));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Админка // Пользователи"
        title="Пользователи и организации"
        sub="Все аккаунты платформы"
        actions={
          <Button icon={Download} onClick={() => toast.info("Экспорт запущен", "CSV придёт на почту администратора")}>
            Экспорт
          </Button>
        }
      />
      <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
        <StatTile label="Пользователей" value="[N]" />
        <StatTile label="Организаций" value="[N]" />
        <StatTile label="Платящих" value="[N]" tone="accent" />
        <StatTile label="Новых за 7 дней" value="[N]" />
      </div>
      <Card>
        <CardHeader title="Аккаунты" />
        <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
          <div className="w-full tab:w-[300px]">
            <Input icon={Search} type="search" placeholder="Ник, почта, организация" aria-label="Поиск аккаунтов" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10" />
          </div>
          <Segmented
            label="Фильтр"
            active={filter}
            onChange={setFilter}
            items={[
              { key: "all", label: "Все" },
              { key: "player", label: "Игроки" },
              { key: "org", label: "Организации" },
              { key: "blocked", label: "Заблокированы" },
              { key: "review", label: "На проверке" },
            ]}
          />
        </div>
        {isFetching && !data ? (
          <TableSkeleton />
        ) : list.length === 0 ? (
          <div className="p-6">
            <EmptyStateView code="EMPTY.SEARCH" icon={Search} title="Ничего не найдено" text="Попробуйте другой запрос или сбросьте фильтры." onCta={() => { setSearch(""); setFilter("all"); }} cta={{ label: "Сбросить фильтры" }} />
          </div>
        ) : (
          <Table minWidth={880} label="Аккаунты">
            <THead>
              <Th sticky>Аккаунт</Th>
              <Th>Тип</Th>
              <Th>Тариф</Th>
              <Th>С нами с</Th>
              <Th>Статус</Th>
              <Th align="right" />
            </THead>
            <tbody>
              {list.map((u) => (
                <Tr key={u.name}>
                  <Td sticky>
                    <span className="flex items-center gap-3">
                      <Avatar tag={u.tag} size={32} />
                      <span className="flex flex-col">
                        <span className="font-semibold">{u.name}</span>
                        <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">{u.sub}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={TYPE[u.type].tone}>{TYPE[u.type].label}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={PLAN[u.plan].tone} solid={u.plan === "pro"}>
                      {PLAN[u.plan].label}
                    </Badge>
                  </Td>
                  <Td className="mono">{u.since}</Td>
                  <Td>
                    <Badge tone={STATUS[u.status].tone} dot={u.status === "blocked"}>
                      {STATUS[u.status].label}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <span className="flex justify-end gap-2">
                      <IconButton icon={Eye} label={`Открыть ${u.name}`} size={32} onClick={() => setOpen(u)} />
                      <IconButton icon={Ban} label={u.status === "blocked" ? `Разблокировать ${u.name}` : `Заблокировать ${u.name}`} size={32} onClick={() => setBlock(u)} active={u.status === "blocked"} />
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal side open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && (
          <div className="-mx-6 -my-5 flex flex-col">
            <KeyRow k="Тип" v={TYPE[open.type].label} />
            <KeyRow k="Контакт" v={open.sub} />
            <KeyRow k="С нами с" v={open.since} />
            <KeyRow k="Статус" v={STATUS[open.status].label} />
            <div className="flex flex-col gap-4 p-6">
              <Field label="Тариф" htmlFor="pl">
                <Select
                  id="pl"
                  value={open.plan}
                  onChange={(e) => {
                    const plan = e.target.value as U["plan"];
                    setOverrides((o) => ({ ...o, [open.name]: { ...o[open.name], plan } }));
                    setOpen({ ...open, plan });
                    toast.success(`Тариф изменён: ${PLAN[plan].label}`, "Действие записано в журнал");
                  }}
                  options={[{ value: "free", label: "Free" }, { value: "pro", label: "Pro" }, { value: "league", label: "Лига" }]}
                />
              </Field>
              <Button variant="danger" icon={Ban} onClick={() => setBlock(open)}>
                {open.status === "blocked" ? "Разблокировать" : "Заблокировать"}
              </Button>
              {/* вход от имени — только если бэкенд разрешит (флаг в ответе) */}
              <Button icon={LogIn} onClick={() => toast.info("Вход от имени", "Доступно, если бэкенд разрешит impersonate для этой роли")}>
                Войти от имени
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal
        open={!!block}
        onClose={() => setBlock(null)}
        danger={block?.status !== "blocked"}
        title={block?.status === "blocked" ? `Разблокировать ${block?.name}?` : `Заблокировать ${block?.name}?`}
        text="Действие будет записано в журнал суперадмина."
        confirmLabel={block?.status === "blocked" ? "Разблокировать" : "Заблокировать"}
        onConfirm={() => {
          if (!block) return;
          const status = block.status === "blocked" ? "active" : "blocked";
          setOverrides((o) => ({ ...o, [block.name]: { ...o[block.name], status } }));
          toast.success(status === "blocked" ? "Аккаунт заблокирован" : "Аккаунт разблокирован");
          setBlock(null);
          setOpen(null);
        }}
      />
    </div>
  );
}
