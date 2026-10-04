"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/* Поля форм: фон elev-1/sunken, рамка line, фокус — рамка accent. Подпись сверху моно-капсом, подсказка/ошибка снизу. */

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
  aside,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="mono-label text-text-2!">
              {label}
            </label>
          )}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] text-text-3">{hint}</p>
      )}
    </div>
  );
}

const control =
  "w-full border border-line bg-sunken text-[15px] text-text placeholder:text-text-3 transition-colors outline-none hover:border-line-strong focus:border-accent aria-invalid:border-danger disabled:opacity-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  prefix?: string;
  invalid?: boolean;
  right?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon: Icon, prefix, invalid, right, className, ...rest }, ref) {
  return (
    <div className="relative flex items-center">
      {Icon && <Icon size={16} strokeWidth={1.75} className="pointer-events-none absolute left-4 text-text-3" aria-hidden />}
      {prefix && <span className="pointer-events-none absolute left-4 text-[15px] text-text-3">{prefix}</span>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(control, "h-12", Icon || prefix ? "pl-11" : "pl-4", right ? "pr-12" : "pr-4", className)}
        {...rest}
      />
      {right && <div className="absolute right-2 flex items-center">{right}</div>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { className, invalid, ...rest },
  ref,
) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-24 resize-y px-4 py-3 leading-[1.6]", className)} {...rest} />;
});

export { Select } from "./select";

/** Пароль с показом и подсказкой требований («Буквы, цифры и спецсимвол») */
export const Password = forwardRef<HTMLInputElement, InputProps>(function Password(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <Input
      ref={ref}
      type={shown ? "text" : "password"}
      icon={Lock}
      autoComplete="current-password"
      right={
        <button type="button" onClick={() => setShown((v) => !v)} className="flex size-9 items-center justify-center text-text-3 hover:text-text" aria-label={shown ? "Скрыть пароль" : "Показать пароль"}>
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      {...props}
    />
  );
});

export function passwordStrength(v: string) {
  return { length: v.length >= 8, letters: /[a-zа-яё]/i.test(v), digits: /\d/.test(v), special: /[^a-zа-яё0-9]/i.test(v) };
}

/* ───────── Checkbox / Toggle / Radio-карточки ───────── */

export const Checkbox = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: React.ReactNode; hint?: React.ReactNode }>(function Checkbox(
  { label, hint, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label htmlFor={cid} className={cn("group inline-flex cursor-pointer items-start gap-3 text-[14px]", rest.disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
        <input ref={ref} id={cid} type="checkbox" className="peer absolute inset-0 cursor-pointer appearance-none border border-line-strong bg-sunken checked:border-primary checked:bg-primary focus-visible:outline focus-visible:outline-accent" {...rest} />
        <svg viewBox="0 0 12 12" className="pointer-events-none relative hidden size-3 text-primary-ink peer-checked:block" aria-hidden>
          <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      {(label || hint) && (
        <span className="flex flex-col">
          {label && <span className="text-text">{label}</span>}
          {hint && <span className="text-[12px] text-text-3">{hint}</span>}
        </span>
      )}
    </label>
  );
});

export function Toggle({ checked, onChange, label, hint, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; hint?: React.ReactNode; disabled?: boolean; id?: string }) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="flex items-center justify-between gap-6">
      {(label || hint) && (
        <label htmlFor={tid} className="flex cursor-pointer flex-col">
          {label && <span className="text-[15px] font-semibold">{label}</span>}
          {hint && <span className="text-[13px] text-text-3">{hint}</span>}
        </label>
      )}
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 shrink-0 border transition-colors disabled:opacity-40",
          checked ? "border-accent bg-elev-2" : "border-line-strong bg-sunken",
        )}
      >
        <span className={cn("absolute top-[3px] size-4 transition-all duration-150", checked ? "left-[19px] bg-primary" : "left-[3px] bg-text-4")} />
      </button>
    </div>
  );
}

/** Большой вариант выбора с заголовком и описанием (экраны 16, 29, 30, 46, 50) */
export function RadioCard({
  checked,
  onSelect,
  title,
  text,
  icon: Icon,
  eyebrow,
  disabled,
  name,
  value,
  className,
  multi,
}: {
  checked: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  text?: React.ReactNode;
  icon?: LucideIcon;
  eyebrow?: string;
  disabled?: boolean;
  name: string;
  value: string;
  className?: string;
  multi?: boolean;
}) {
  return (
    <label
      className={cn(
        "relative flex min-w-0 cursor-pointer flex-col gap-2 border p-5 transition-colors",
        checked ? "border-accent bg-elev-2" : "border-line bg-elev-1 hover:border-line-strong",
        disabled && "cursor-not-allowed opacity-45",
        className,
      )}
    >
      <input type={multi ? "checkbox" : "radio"} name={name} value={value} checked={checked} onChange={onSelect} disabled={disabled} className="peer sr-only" />
      <span className="pointer-events-none absolute inset-0 peer-focus-visible:outline peer-focus-visible:outline-accent" aria-hidden />
      {checked && <CornerTL />}
      <span className={cn("absolute top-4 right-4 flex size-4 items-center justify-center border", checked ? "border-text" : "border-line-strong")} aria-hidden>
        {checked && <span className="size-2 bg-text" />}
      </span>
      {eyebrow && <span className="mono-label">{eyebrow}</span>}
      {Icon && <Icon size={24} strokeWidth={1.5} className="text-accent" aria-hidden />}
      <span className="font-display pr-6 text-[22px] leading-tight [overflow-wrap:anywhere]">{title}</span>
      {text && <span className="text-[13px] leading-[1.5] text-text-2">{text}</span>}
    </label>
  );
}

function CornerTL() {
  return (
    <>
      <span className="absolute -top-px -left-px size-3 border-t-2 border-l-2 border-accent" aria-hidden />
      <span className="absolute -right-px -bottom-px size-3 border-r-2 border-b-2 border-accent" aria-hidden />
    </>
  );
}
