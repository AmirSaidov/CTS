"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { CornerMarkers } from "./card";
import { Button } from "./button";

/** Модалка на нативном <dialog>: фокус-ловушка, Esc и инертный фон — из коробки. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  side,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Drawer справа — детали спора, карточка пользователя */
  side?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-auto max-h-[90dvh] w-[calc(100%-32px)] overflow-visible bg-transparent p-0 text-text backdrop:bg-black/70",
        "open:animate-[cts-rise_.25s_ease-out]",
        size === "sm" && "max-w-[440px]",
        size === "md" && "max-w-[560px]",
        size === "lg" && "max-w-[840px]",
        side && "mr-0 h-dvh max-h-dvh max-w-[520px]",
      )}
    >
      <div className={cn("relative flex max-h-[90dvh] flex-col border border-line-strong bg-elev-1", side && "h-full max-h-dvh")}>
        <CornerMarkers />
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="t-h3">{title}</h2>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center text-text-3 hover:text-text" aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </dialog>
  );
}

/** Подтверждение опасного действия */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel = "Подтвердить",
  loading,
  danger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text?: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {text && <p className="text-[15px] text-text-2">{text}</p>}
      {children}
    </Modal>
  );
}
