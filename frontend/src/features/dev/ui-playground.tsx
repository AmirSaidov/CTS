"use client";

import { useState } from "react";
import { Mail, Trophy, Users } from "lucide-react";
import { toast } from "@/shared/lib/stores";
import { Button } from "@/shared/ui/button";
import { ColorPicker } from "@/shared/ui/color-picker";
import { Checkbox, Field, Input, Password, RadioCard, Select, Textarea, Toggle } from "@/shared/ui/form";
import { FileDrop, IMAGE_TYPES } from "@/shared/ui/file-drop";
import { OtpInput } from "@/shared/ui/otp";
import { ConfirmModal } from "@/shared/ui/overlay";
import { Chips, Segmented, Tabs } from "@/shared/ui/tabs";
import { Stepper, StepBar } from "@/shared/ui/stepper";
import { Countdown, Tip } from "@/shared/ui/feedback";

/** Интерактивная часть витрины: формы, вкладки, оверлеи, тосты */
export function UiPlayground() {
  const [tab, setTab] = useState("a");
  const [seg, setSeg] = useState<"x" | "y" | "z">("x");
  const [chip, setChip] = useState("all");
  const [radio, setRadio] = useState("1");
  const [toggle, setToggle] = useState(true);
  const [otp, setOtp] = useState("4819");
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState("#D5DBE3");
  const [modal, setModal] = useState(false);
  const [deadline] = useState(() => new Date(Date.now() + 42 * 60_000).toISOString());

  return (
    <>
      <section className="flex flex-col gap-6">
        <h2 className="t-h1">Формы</h2>
        <div className="grid gap-6 desk:grid-cols-3">
          <div className="flex flex-col gap-4">
            <Field label="Почта" htmlFor="ui-email" hint="Подсказка под полем">
              <Input id="ui-email" icon={Mail} placeholder="you@mail.kg" />
            </Field>
            <Field label="Ошибка" htmlFor="ui-err" error="Ник уже занят">
              <Input id="ui-err" invalid defaultValue="Aktan" />
            </Field>
            <Field label="Пароль" htmlFor="ui-pass">
              <Password id="ui-pass" />
            </Field>
            <Field label="Выбор" htmlFor="ui-sel">
              <Select id="ui-sel" options={["Valorant", "CS2", "Dota 2"]} />
            </Field>
            <Field label="Текст" htmlFor="ui-ta">
              <Textarea id="ui-ta" rows={3} />
            </Field>
          </div>
          <div className="flex flex-col gap-4">
            <Checkbox label="Запомнить меня" defaultChecked />
            <Toggle label="Тумблер" hint="С подсказкой" checked={toggle} onChange={setToggle} />
            <div className="grid grid-cols-2 gap-3">
              <RadioCard name="ui-r" value="1" icon={Users} title="Игрок" text="Описание" checked={radio === "1"} onSelect={() => setRadio("1")} />
              <RadioCard name="ui-r" value="2" icon={Trophy} title="Организатор" text="Описание" checked={radio === "2"} onSelect={() => setRadio("2")} />
            </div>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
          <div className="flex flex-col gap-4">
            <FileDrop label="Баннер" hint="1920×1080 · до 5 МБ" accept={IMAGE_TYPES} maxMb={5} value={file} onChange={setFile} aspect="16 / 9" />
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="t-h1">Навигация</h2>
        <Tabs active={tab} onChange={setTab} items={[{ key: "a", label: "Сетка" }, { key: "b", label: "Матчи", count: 3 }, { key: "c", label: "Чек-ин" }]} />
        <Segmented label="Пример" active={seg} onChange={setSeg} items={[{ key: "x", label: "Все" }, { key: "y", label: "Активные" }, { key: "z", label: "Архив" }]} />
        <Chips active={chip} onChange={setChip} items={[{ key: "all", label: "Все" }, { key: "open", label: "Регистрация открыта" }, { key: "lan", label: "LAN" }]} />
        <div className="grid gap-6 desk:grid-cols-2">
          <Stepper steps={["Игра и формат", "Даты", "Правила", "Оформление", "Публикация"]} current={3} done={[1, 2]} />
          <div className="flex flex-col gap-6">
            <StepBar current={2} total={4} />
            <span className="font-display text-[40px]">
              <Countdown to={deadline} />
            </span>
            <span>
              Сокращение: <Tip text="Best of 3 — до двух побед">BO3</Tip>
            </span>
          </div>
        </div>
      </section>
      <section className="flex flex-wrap gap-3">
        <Button onClick={() => toast.success("Сохранено", "Тост успеха")}>Тост: успех</Button>
        <Button onClick={() => toast.error("Ошибка", "Тост ошибки")}>Тост: ошибка</Button>
        <Button onClick={() => toast.info("Новое уведомление", "С действием", { label: "К матчу", href: "/me/matches" })}>Тост: инфо</Button>
        <Button variant="danger" onClick={() => setModal(true)}>
          Модалка
        </Button>
        <ConfirmModal open={modal} onClose={() => setModal(false)} onConfirm={() => setModal(false)} danger title="Распустить команду?" text="Опасное действие требует подтверждения." confirmLabel="Распустить" />
      </section>
    </>
  );
}
