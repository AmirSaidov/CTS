"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, Quote } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Rich-text статьи: заголовки, цитаты, картинки, ссылки. Хранится как HTML, на сайте рендерится после санитайза. */
export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: false }), Link.configure({ openOnClick: false }), Image],
    content: value,
    editorProps: { attributes: { class: "prose-cts min-h-[220px] px-4 py-4 outline-none", "aria-label": "Текст статьи", role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const btn = (label: string, Icon: typeof Bold, run: () => void, active?: boolean) => (
    <button type="button" key={label} onClick={run} aria-label={label} title={label} aria-pressed={active} className={cn("flex size-9 items-center justify-center border transition-colors", active ? "border-accent bg-elev-2 text-text" : "border-line text-text-2 hover:text-text")}>
      <Icon size={15} aria-hidden />
    </button>
  );

  return (
    <div className="border border-line bg-sunken focus-within:border-accent">
      <div className="flex flex-wrap gap-1.5 border-b border-line p-2" role="toolbar" aria-label="Форматирование">
        {editor && (
          <>
            {btn("Заголовок", Heading2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading"))}
            {btn("Жирный", Bold, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
            {btn("Курсив", Italic, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
            {btn("Цитата", Quote, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
            {btn("Список", List, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
            {btn("Ссылка", Link2, () => {
              const url = window.prompt("Адрес ссылки", "https://");
              if (url) editor.chain().focus().setLink({ href: url }).run();
              else editor.chain().focus().unsetLink().run();
            }, editor.isActive("link"))}
            {btn("Картинка", ImagePlus, () => {
              const url = window.prompt("Адрес картинки (после загрузки в медиатеку)", "https://");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            })}
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
