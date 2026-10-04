"use client";

import { Children, Fragment, forwardRef, isValidElement, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/*
 * Выпадающий список в стиле интерфейса вместо системного.
 * API как у <select>: value/defaultValue, onChange(e) с e.target.value, register() из react-hook-form, <option> в children.
 * Внутри остаётся скрытый нативный <select> — он хранит значение для форм, а выбор пункта шлёт на нём обычное событие change.
 * Список открывается через Popover API (top layer): не обрезается overflow и рисуется поверх <dialog>.
 */

type Opt = { value: string; label: string; disabled?: boolean };
type OptionInput = string | { value: string; label: string };

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; options?: OptionInput[] };

const GAP = 4;
const MAX_H = 288;
const CLOSE_MS = 160;

function text(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return text(node.props.children);
  return "";
}

function collect(children: React.ReactNode, out: Opt[]) {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: React.ReactNode; disabled?: boolean }>(child)) return;
    if (child.type === Fragment) return collect(child.props.children, out);
    if (child.type !== "option") return;
    const label = text(child.props.children);
    out.push({ value: child.props.value != null ? String(child.props.value) : label, label, disabled: child.props.disabled });
  });
  return out;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, options, children, value, defaultValue, onChange, onBlur, disabled, id, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby, ...rest },
  ref,
) {
  const opts: Opt[] = [...(options ?? []).map((o) => (typeof o === "string" ? { value: o, label: o } : o)), ...collect(children, [])];

  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => selectRef.current!, []);

  const auto = useId();
  const listId = `${auto}-list`;
  const optId = (i: number) => `${auto}-opt-${i}`;

  const [current, setCurrent] = useState(() => String(value ?? defaultValue ?? opts[0]?.value ?? ""));
  const shown = value !== undefined ? String(value) : current;
  const selectedIndex = opts.findIndex((o) => o.value === shown);
  const selected = opts[selectedIndex];

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const [active, setActive] = useState(-1);
  const closeTimer = useRef<number>(undefined);
  const typed = useRef({ q: "", t: 0 });

  // react-hook-form ставит значение прямо в DOM через ref — подхватываем его после монтирования
  useLayoutEffect(() => {
    if (value === undefined && selectRef.current) setCurrent(selectRef.current.value);
  }, [value]);

  const place = useCallback(() => {
    const btn = buttonRef.current;
    const list = listRef.current;
    if (!btn || !list) return;
    const r = btn.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const h = Math.min(list.scrollHeight, MAX_H);
    const up = h > below && above > below;
    const maxH = Math.max(120, Math.min(MAX_H, up ? above : below));
    list.style.maxHeight = `${maxH}px`;
    list.style.minWidth = `${r.width}px`;
    const w = list.offsetWidth;
    list.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
    list.style.top = up ? `${r.top - GAP - Math.min(h, maxH)}px` : `${r.bottom + GAP}px`;
    setSide(up ? "top" : "bottom");
  }, []);

  const show = () => {
    if (disabled || open) return;
    window.clearTimeout(closeTimer.current);
    if (value === undefined && selectRef.current) setCurrent(selectRef.current.value);
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  };

  const hide = useCallback(() => {
    setOpen(false);
    setVisible(false);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      const list = listRef.current;
      if (list?.matches(":popover-open")) list.hidePopover();
    }, CLOSE_MS);
  }, []);

  // открытие: показать popover, поставить на место, на следующем кадре включить анимацию
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    if (!list.matches(":popover-open")) list.showPopover();
    place();
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open, place]);

  // пока открыт: следим за скроллом/ресайзом и кликом мимо
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) hide();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, place, hide]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // активный пункт держим в видимой части списка
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const pick = (i: number) => {
    const o = opts[i];
    const sel = selectRef.current;
    hide();
    buttonRef.current?.focus();
    if (!o || o.disabled || !sel || o.value === shown) return;
    sel.value = o.value;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const move = (from: number, step: 1 | -1) => {
    for (let i = from + step; i >= 0 && i < opts.length; i += step) if (!opts[i].disabled) return i;
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        show();
      }
      return;
    }
    if (k === "Tab") return hide();
    const nav: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => move(a, 1)),
      ArrowUp: () => setActive((a) => move(a, -1)),
      Home: () => setActive(move(-1, 1)),
      End: () => setActive(move(opts.length, -1)),
      Enter: () => pick(active),
      " ": () => pick(active),
      // stopPropagation ниже не даёт Esc закрыть модалку, в которой стоит список
      Escape: () => hide(),
    };
    if (nav[k]) {
      e.preventDefault();
      e.stopPropagation();
      nav[k]();
    } else if (k.length === 1) {
      // поиск по первым буквам
      const now = Date.now();
      typed.current = { q: (now - typed.current.t < 600 ? typed.current.q : "") + k.toLowerCase(), t: now };
      const i = opts.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.q));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <div className="relative">
      <select
        ref={selectRef}
        tabIndex={-1}
        aria-hidden
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        disabled={disabled}
        onChange={(e) => {
          setCurrent(e.target.value);
          onChange?.(e);
        }}
        onBlur={onBlur}
        className="sr-only"
        {...rest}
      >
        {opts.map((o, i) => (
          <option key={`${o.value}-${i}`} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>

      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (open) hide();
          // для react-hook-form: touched/валидация по blur срабатывают на скрытом select
          selectRef.current?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        }}
        className={cn(
          "group flex h-12 w-full cursor-pointer items-center gap-3 border bg-sunken pr-4 pl-4 text-left text-[15px] text-text outline-none transition-colors",
          "hover:border-line-strong focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
          open ? "border-accent" : "border-line",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-text-3")}>{selected?.label ?? "—"}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-text-3 transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)]", open && "rotate-180 text-accent")} aria-hidden />
      </button>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        popover="manual"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby ?? id}
        data-side={side}
        className={cn(
          "fixed inset-auto m-0 max-w-[min(420px,calc(100vw-16px))] overflow-y-auto overscroll-contain border border-line-strong bg-elev-1 p-1 text-text shadow-[0_16px_40px_-12px_rgba(0,0,0,.7)]",
          "transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(.2,.8,.2,1)] data-[side=bottom]:origin-top data-[side=top]:origin-bottom",
          visible ? "translate-y-0 scale-100 opacity-100" : cn("scale-[.98] opacity-0", side === "bottom" ? "-translate-y-1.5" : "translate-y-1.5"),
        )}
      >
        {/* акцентная полоска сверху: «растёт» из центра при открытии */}
        <span
          aria-hidden
          className={cn("pointer-events-none sticky top-0 z-10 -mx-1 -mt-1 mb-1 block h-0.5 bg-accent transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]", visible ? "scale-x-100" : "scale-x-0")}
        />
        {opts.map((o, i) => {
          const isSel = i === selectedIndex;
          return (
            <div
              key={`${o.value}-${i}`}
              id={optId(i)}
              role="option"
              aria-selected={isSel}
              aria-disabled={o.disabled || undefined}
              // фокус остаётся на кнопке — клавиатура и blur работают как у обычного поля
              onPointerDown={(e) => e.preventDefault()}
              onPointerMove={() => !o.disabled && active !== i && setActive(i)}
              onClick={() => pick(i)}
              style={{ "--i": i } as React.CSSProperties}
              className={cn(
                "relative flex min-h-10 cursor-pointer items-center gap-3 py-2 pr-3 pl-4 text-[15px] transition-colors duration-100",
                visible && "animate-drop-item",
                i === active && "bg-elev-2",
                isSel ? "text-text" : "text-text-2",
                o.disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <span className={cn("absolute top-1.5 bottom-1.5 left-0 w-0.5 bg-accent transition-transform duration-200", isSel || i === active ? "scale-y-100" : "scale-y-0", !isSel && "opacity-50")} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {isSel && <Check size={15} className="shrink-0 text-accent" aria-hidden />}
            </div>
          );
        })}
      </div>
    </div>
  );
});
