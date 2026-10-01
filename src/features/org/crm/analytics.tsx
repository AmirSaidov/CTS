"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { qk } from "@/shared/api/keys";
import { download, num } from "@/shared/lib/format";
import { hasPlan } from "@/shared/lib/permissions";
import { useUser } from "@/shared/lib/stores";
import { ProBadge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { PageHeader, Skeleton, StatTile } from "@/shared/ui/misc";
import { ProGate } from "@/shared/ui/feedback";
import { Segmented } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

type Data = Awaited<ReturnType<typeof api.analytics>>;

/*
 * Одна серия на график: цвет — один тон (--accent-deep, контраст 3.4:1 к карточке),
 * рекордная неделя — светлый --primary. Данные агрегирует бэкенд.
 */
export function AnalyticsScreen({ initial }: { initial: Data }) {
  const user = useUser();
  const pro = hasPlan(user, "pro");
  const [period, setPeriod] = useState<"7d" | "30d" | "season">("7d");
  const { data, isFetching } = useQuery({ queryKey: qk.analytics(period), queryFn: () => api.analytics(period), initialData: period === "7d" ? initial : undefined });

  const record = data ? Math.max(...data.weekly.map((w) => w.value)) : 0;
  const recordWeek = data?.weekly.find((w) => w.value === record)?.week;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Организатор // Аналитика"
        title="Аналитика"
        sub="Сентябрь 2026 · все турниры"
        actions={
          <>
            <Segmented
              label="Период"
              active={period}
              onChange={setPeriod}
              items={[
                { key: "7d", label: "7 дней" },
                { key: "30d", label: "30 дней" },
                { key: "season", label: "Сезон" },
              ]}
            />
            <Button
              icon={Download}
              disabled={!data}
              onClick={() => data && download("analytics.csv", "﻿" + ["Неделя;Заявок", ...data.weekly.map((w) => `${w.week};${w.value}`)].join("\n"), "text/csv")}
            >
              Экспорт
            </Button>
          </>
        }
      />
      {!data || isFetching ? (
        <div className="grid gap-4 desk:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[132px]" />
          ))}
          <Skeleton className="h-[360px] desk:col-span-4" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 tab:grid-cols-2 desk:grid-cols-4">
            <StatTile label="Заявок" value={data.kpi.applications} sub={data.kpi.applicationsDelta} />
            <StatTile label="Явка на матчи" value={`${data.kpi.attendance}%`} sub={data.kpi.attendanceNote} />
            <StatTile label="Новых игроков" value={`+${data.kpi.newPlayers}`} />
            <StatTile label="Среднее время турнира" value={data.kpi.avgDuration} />
          </div>
          <div className="grid gap-6 desk:grid-cols-[1fr_370px]">
            <Card className="min-w-0">
              <CardHeader title="Заявки по неделям">
                <span className="mono-label text-text-2!">Неделя {recordWeek?.slice(1)} — рекорд</span>
              </CardHeader>
              <figure className="h-[300px] px-4 py-6" aria-label="Столбчатая диаграмма: заявки по неделям">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weekly} margin={{ top: 24, right: 12, left: -12, bottom: 0 }} barCategoryGap="38%">
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "var(--text-3)", fontSize: 10, fontFamily: "var(--font-mono)" }} dy={8} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-3)", fontSize: 10, fontFamily: "var(--font-mono)" }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "var(--bg-elev-2)" }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="border border-line-strong bg-elev-2 px-3 py-2 text-[13px]">
                            <div className="mono-label">{payload[0].payload.week}</div>
                            <div className="font-semibold">{payload[0].value} заявок</div>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {data.weekly.map((w) => (
                        <Cell key={w.week} fill={w.value === record ? "var(--primary)" : "var(--accent-deep)"} />
                      ))}
                      <LabelList dataKey="value" position="top" offset={8} style={{ fill: "var(--text-2)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <table className="sr-only">
                  <caption>Заявки по неделям</caption>
                  <tbody>
                    {data.weekly.map((w) => (
                      <tr key={w.week}>
                        <th scope="row">{w.week}</th>
                        <td>{w.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </figure>
            </Card>
            <Card>
              <CardHeader title="Популярные игры">
                <span className="mono-label">% заявок</span>
              </CardHeader>
              <ul className="flex flex-col gap-5 p-6">
                {data.games.map((g) => (
                  <li key={g.name} className="flex flex-col gap-2" title={`${g.name}: ${g.share}% заявок`}>
                    <span className="flex justify-between text-[15px]">
                      {g.name}
                      <span className="mono text-[12px] font-medium">{g.share}%</span>
                    </span>
                    <span className="h-2.5 border border-line bg-bg" aria-hidden>
                      <span className="block h-full bg-primary" style={{ width: `${g.share}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <div className="grid gap-6 desk:grid-cols-2">
            <Card>
              <CardHeader title="Воронка регистрации · Osh Open" />
              <ol className="flex flex-col gap-3 p-6">
                {data.funnel.map((f, i) => {
                  const pct = (f.value / data.funnel[0].value) * 100;
                  const conv = i > 0 ? Math.round((f.value / data.funnel[i - 1].value) * 100) : 100;
                  return (
                    <li key={f.step} className="group grid grid-cols-[150px_1fr_56px] items-center gap-4" title={i ? `${conv}% от предыдущего шага` : undefined}>
                      <span className="text-[14px] text-text-2">{f.step}</span>
                      <span className="relative h-6">
                        <span className={i === 0 ? "block h-full bg-primary" : "block h-full bg-accent-deep group-hover:bg-accent"} style={{ width: `${Math.max(pct, 2)}%` }} />
                        {i > 0 && <span className="mono absolute top-1/2 left-[calc(var(--w)+8px)] -translate-y-1/2 text-[10px] text-text-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ ["--w" as string]: `${Math.max(pct, 2)}%` }}>{conv}%</span>}
                      </span>
                      <span className="mono text-right text-[12px] font-medium">{num(f.value)}</span>
                    </li>
                  );
                })}
              </ol>
            </Card>
            <Card>
              <CardHeader title="Турниры">
                <ProBadge />
              </CardHeader>
              <ProGate locked={!pro} label="Таблица по турнирам — в Pro">
                <Table minWidth={420} label="Показатели по турнирам">
                  <THead>
                    <Th sticky>Турнир</Th>
                    <Th align="right">Команд</Th>
                    <Th align="right">Явка</Th>
                    <Th align="right">Споры</Th>
                  </THead>
                  <tbody>
                    {data.byTournament.map((t) => (
                      <Tr key={t.name}>
                        <Td sticky>{t.name}</Td>
                        <Td align="right" className="mono">{t.teams}</Td>
                        <Td align="right" className="mono">{t.attendance}%</Td>
                        <Td align="right" className="mono">{t.disputes}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </ProGate>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
