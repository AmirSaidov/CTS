"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Check, Eye, Pencil, Plus, Trash } from "lucide-react";
import type { NewsArticle } from "@/shared/api/types";
import { RUBRICS } from "@/shared/lib/labels";
import { fmtDay } from "@/shared/lib/format";
import { sanitize } from "@/shared/lib/sanitize";
import { toast } from "@/shared/lib/stores";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Card, CardHeader, CornerMarkers } from "@/shared/ui/card";
import { Field, Input, Select, Textarea } from "@/shared/ui/form";
import { FileDrop, IMAGE_TYPES } from "@/shared/ui/file-drop";
import { PageHeader, Placeholder, Skeleton } from "@/shared/ui/misc";
import { ConfirmModal, Modal } from "@/shared/ui/overlay";
import { Segmented, Tabs } from "@/shared/ui/tabs";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

// редактор тяжёлый — грузим только в админке и только на клиенте
const RichEditor = dynamic(() => import("./rich-editor").then((m) => m.RichEditor), { ssr: false, loading: () => <Skeleton className="h-[260px]" /> });

const STATUS = { published: { label: "Опубликовано", tone: "success" }, draft: { label: "Черновик", tone: "muted" }, scheduled: { label: "Запланировано", tone: "gold" } } as const;

export function ContentScreen({ initial }: { initial: NewsArticle[] }) {
  const [tab, setTab] = useState("articles");
  const [articles, setArticles] = useState(initial);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [editing, setEditing] = useState<NewsArticle>(initial.find((a) => a.status === "draft") ?? initial[0]);
  const [cover, setCover] = useState<File | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [preview, setPreview] = useState(false);
  const [remove, setRemove] = useState<NewsArticle | null>(null);

  const list = articles.filter((a) => filter === "all" || a.status === filter);
  const set = <K extends keyof NewsArticle>(k: K, v: NewsArticle[K]) => setEditing((e) => ({ ...e, [k]: v }));
  const save = (status: NewsArticle["status"]) => {
    const next = { ...editing, status, date: status === "scheduled" && scheduleAt ? new Date(scheduleAt).toISOString() : editing.date };
    setArticles((l) => (l.some((a) => a.slug === next.slug) ? l.map((a) => (a.slug === next.slug ? next : a)) : [next, ...l]));
    setEditing(next);
    toast.success(status === "published" ? "Статья опубликована" : status === "scheduled" ? "Публикация запланирована" : "Черновик сохранён");
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Админка // Контент"
        title="Новости и контент"
        sub="Статьи, баннеры и страницы"
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setEditing({ slug: `new-${Date.now()}`, title: "", rubric: "guides", date: new Date().toISOString(), readMinutes: 3, lead: "", author: "Редакция", status: "draft", body: "<p></p>" })}
          >
            Новая статья
          </Button>
        }
      />
      <Tabs
        size="lg"
        active={tab}
        onChange={setTab}
        items={[
          { key: "articles", label: "Статьи" },
          { key: "banners", label: "Баннеры на главной" },
          { key: "faq", label: "FAQ" },
          { key: "legal", label: "Правовые страницы" },
        ]}
      />
      {tab !== "articles" ? (
        <p className="border border-dashed border-text-4 p-8 text-text-2">Раздел «{{ banners: "Баннеры на главной", faq: "FAQ", legal: "Правовые страницы" }[tab]}» использует тот же редактор и статусы, что и статьи. Макета нет — список элементов и редактор появятся вместе с API контента.</p>
      ) : (
        <div className="grid gap-6 desk:grid-cols-[1fr_460px]">
          <Card className="min-w-0 self-start">
            <CardHeader title="Статьи">
              <Segmented label="Статус" active={filter} onChange={setFilter} items={[{ key: "all", label: "Все" }, { key: "draft", label: "Черновики" }, { key: "published", label: "Опубликованные" }]} />
            </CardHeader>
            <Table minWidth={720} label="Статьи">
              <THead>
                <Th sticky>Статья</Th>
                <Th>Рубрика</Th>
                <Th>Статус</Th>
                <Th>Дата</Th>
                <Th align="right" />
              </THead>
              <tbody>
                {list.map((a) => (
                  <Tr key={a.slug} active={editing.slug === a.slug}>
                    <Td sticky>
                      <span className="flex items-center gap-3">
                        <Placeholder label="IMG" className="h-11 w-14 shrink-0 border border-line [&>span]:text-[8px]!" />
                        <span className="flex flex-col">
                          <span className="leading-tight font-semibold">{a.title}</span>
                          <span className="mono text-[10px] tracking-[0.14em] text-text-3 uppercase">Автор: {a.author}</span>
                        </span>
                      </span>
                    </Td>
                    <Td>
                      <Badge tone="muted">{RUBRICS[a.rubric]}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
                    </Td>
                    <Td className="mono">{a.status === "draft" ? "—" : fmtDay(a.date)}</Td>
                    <Td align="right">
                      <span className="flex justify-end gap-2">
                        <IconButton icon={Pencil} label={`Редактировать «${a.title}»`} size={32} onClick={() => setEditing(a)} />
                        <IconButton icon={Trash} label={`Удалить «${a.title}»`} size={32} onClick={() => setRemove(a)} />
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <section className="relative flex flex-col gap-5 self-start border border-line bg-elev-1 p-6" aria-labelledby="editor-h">
            <CornerMarkers only="tl" offset={6} />
            <h2 id="editor-h" className="t-h2">
              Редактор · {RUBRICS[editing.rubric]}
            </h2>
            <Field label="Заголовок" htmlFor="at">
              <Input id="at" value={editing.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid gap-4 tab:grid-cols-2">
              <Field label="Рубрика" htmlFor="ar">
                <Select id="ar" value={editing.rubric} onChange={(e) => set("rubric", e.target.value as NewsArticle["rubric"])} options={Object.entries(RUBRICS).map(([value, label]) => ({ value, label }))} />
              </Field>
              <Field label="Статус" htmlFor="as">
                <Select id="as" value={editing.status} onChange={(e) => set("status", e.target.value as NewsArticle["status"])} options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))} />
              </Field>
            </div>
            <FileDrop label="Обложка" hint="Перетащите файл · 21:9 · до 5 МБ" accept={IMAGE_TYPES} maxMb={5} value={cover} onChange={setCover} compact />
            <Field label="Лид" htmlFor="al">
              <Textarea id="al" rows={2} value={editing.lead} onChange={(e) => set("lead", e.target.value)} />
            </Field>
            <Field label="Текст">
              <RichEditor key={editing.slug} value={editing.body ?? ""} onChange={(html) => set("body", html)} />
            </Field>
            {editing.status === "scheduled" && (
              <Field label="Опубликовать" htmlFor="asch">
                <Input id="asch" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              </Field>
            )}
            <div className="flex flex-wrap gap-3">
              <Button icon={Eye} onClick={() => setPreview(true)}>
                Предпросмотр
              </Button>
              <Button variant="ghost" onClick={() => save("draft")}>
                В черновик
              </Button>
              <Button variant="primary" icon={Check} disabled={editing.title.trim().length < 5} onClick={() => save(editing.status === "scheduled" ? "scheduled" : "published")}>
                {editing.status === "scheduled" ? "Запланировать" : "Опубликовать"}
              </Button>
            </div>
          </section>
        </div>
      )}
      <Modal open={preview} onClose={() => setPreview(false)} title="Предпросмотр" size="lg">
        <article className="flex flex-col gap-5">
          <Badge tone="muted" className="self-start">
            {RUBRICS[editing.rubric]}
          </Badge>
          <h1 className="font-display text-[40px] leading-none">{editing.title || "Без заголовка"}</h1>
          <p className="text-[17px] text-text-2">{editing.lead}</p>
          <div className="prose-cts" dangerouslySetInnerHTML={{ __html: sanitize(editing.body ?? "") }} />
        </article>
      </Modal>
      <ConfirmModal
        open={!!remove}
        onClose={() => setRemove(null)}
        danger
        title="Удалить статью?"
        text={`«${remove?.title}» исчезнет с сайта. Ссылки на неё начнут вести на 404.`}
        confirmLabel="Удалить"
        onConfirm={() => {
          setArticles((l) => l.filter((a) => a !== remove));
          setRemove(null);
          toast.success("Статья удалена");
        }}
      />
    </div>
  );
}
