/** Раздел настроек: слева заголовок и пояснение, справа поля (экраны 44–46) */
export function SettingsSection({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-8 desk:grid-cols-[340px_minmax(0,640px)]">
      <div className="flex flex-col gap-2">
        <h2 className="t-h2">{title}</h2>
        {text && <p className="text-[14px] text-text-2">{text}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}
