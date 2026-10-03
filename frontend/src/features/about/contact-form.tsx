"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheck, Send } from "lucide-react";
import { api } from "@/shared/api/endpoints";
import { applyServerErrors } from "@/shared/lib/forms";
import { Button } from "@/shared/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/shared/ui/form";
import { CornerMarkers } from "@/shared/ui/card";

const schema = z.object({
  name: z.string().trim().min(2, "Как к вам обращаться?"),
  contact: z.string().trim().refine((v) => /^@[\w\d_]{3,}$/.test(v) || z.email().safeParse(v).success, "Почта или @username в Telegram"),
  topic: z.string(),
  message: z.string().trim().min(10, "Напишите хотя бы пару предложений"),
  consent: z.literal(true, { error: "Нужно согласие на обработку данных" }),
});
type Form = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, setError, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { topic: "Подключение клуба / лиги" },
  });
  const { errors, isSubmitting } = formState;

  if (sent) {
    return (
      <div role="status" className="relative flex flex-col items-start gap-4 border border-success bg-elev-1 p-8">
        <CircleCheck size={28} className="text-success-text" aria-hidden />
        <h3 className="t-h2">Сообщение отправлено</h3>
        <p className="text-text-2">Ответим в течение рабочего дня — на почту или в Telegram.</p>
        <Button onClick={() => setSent(false)}>Написать ещё</Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async ({ consent: _c, ...body }) => {
        try {
          await api.contact(body);
          setSent(true);
        } catch (e) {
          applyServerErrors(e, setError);
        }
      })}
      className="relative flex flex-col gap-6 border border-line bg-elev-1 p-6 tab:p-8"
    >
      <CornerMarkers only="tl" />
      <div className="grid gap-4 tab:grid-cols-2">
        <Field label="Имя" htmlFor="c-name" error={errors.name?.message}>
          <Input id="c-name" placeholder="Как к вам обращаться" invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Почта или Telegram" htmlFor="c-contact" error={errors.contact?.message}>
          <Input id="c-contact" placeholder="@username" invalid={!!errors.contact} {...register("contact")} />
        </Field>
      </div>
      <Field label="Тема" htmlFor="c-topic">
        <Select id="c-topic" {...register("topic")} options={["Подключение клуба / лиги", "Тариф Лига", "Проблема с турниром", "Сотрудничество", "Другое"]} />
      </Field>
      <Field label="Сообщение" htmlFor="c-msg" error={errors.message?.message}>
        <Textarea id="c-msg" rows={5} invalid={!!errors.message} {...register("message")} />
      </Field>
      <div className="flex flex-col gap-1">
        <Checkbox label="Согласен на обработку персональных данных" {...register("consent")} />
        {errors.consent && <p role="alert" className="text-[12px] text-danger">{errors.consent.message}</p>}
      </div>
      {errors.root && <p role="alert" className="text-[13px] text-danger">{errors.root.message}</p>}
      <Button type="submit" variant="primary" size="lg" icon={Send} loading={isSubmitting} block>
        Отправить
      </Button>
    </form>
  );
}
