import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/shared/api/endpoints";
import { Container } from "@/shared/ui/page";
import { Eyebrow } from "@/shared/ui/misc";
import { Tabs } from "@/shared/ui/tabs";
import { LegalToc } from "@/features/legal/toc";

const DOCS = { privacy: "Политика конфиденциальности", terms: "Пользовательское соглашение", rules: "Правила турниров" } as const;
type Doc = keyof typeof DOCS;
type Props = { params: Promise<{ doc: string }> };

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return { title: DOCS[doc as Doc] ?? "Документ", alternates: { canonical: `/legal/${doc}` } };
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  if (!(doc in DOCS)) notFound();
  const d = await api.legal(doc as Doc);

  return (
    <Container className="flex flex-col gap-10 pt-16 pb-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>[ Правовая информация ]</Eyebrow>
        <h1 className="font-display text-[clamp(40px,6vw,88px)] leading-[0.95] break-words">{d.title}</h1>
        <p className="mono-label">
          Редакция от {d.edition} / Версия {d.version}
        </p>
      </div>
      <Tabs active={doc} items={(Object.keys(DOCS) as Doc[]).map((k) => ({ key: k, label: DOCS[k], href: `/legal/${k}` }))} />
      <div className="grid gap-12 desk:grid-cols-[280px_1fr]">
        <LegalToc sections={d.sections.map((s) => ({ id: s.id, title: s.title }))} />
        <div className="flex max-w-[780px] flex-col gap-12">
          {d.sections.map((s) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-24 flex-col gap-4">
              <h2 className="t-h2">{s.title}</h2>
              <p className="text-[16px] text-text-2">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
