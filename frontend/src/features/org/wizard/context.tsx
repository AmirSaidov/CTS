"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/shared/api/endpoints";
import { toast } from "@/shared/lib/stores";
import type { Draft } from "./model";

interface Ctx {
  draft: Draft;
  set: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  patch: (p: Partial<Draft>) => void;
  save: (step: number, silent?: boolean) => Promise<string>;
  savedAt: Date | null;
  saving: boolean;
  dirty: boolean;
}

const WizardCtx = createContext<Ctx | null>(null);
const AUTOSAVE_MS = 12_000;
const storageKey = (id: string) => `cts-draft-${id}`;

/**
 * Состояние мастера живёт в layout сегмента setup — сохраняется при переходе между шагами.
 * Черновик пишется на сервер после шага 1 и автосохраняется каждые 12 секунд.
 * Копия в sessionStorage — чтобы не потерять ввод при перезагрузке вкладки.
 */
export function WizardProvider({ initial, children }: { initial: Draft; children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft>(initial);

  // локальная копия (если вкладку перезагрузили) — только после монтирования, чтобы не сломать гидрацию
  useEffect(() => {
    if (!initial.id) return;
    try {
      const raw = sessionStorage.getItem(storageKey(initial.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- восстановление из sessionStorage
      if (raw) setDraft({ ...initial, ...JSON.parse(raw), id: initial.id });
    } catch {}
  }, [initial]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const stepRef = useRef(1);

  const set = useCallback(<K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  }, []);
  const patch = useCallback((p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDirty(true);
  }, []);

  const save = useCallback(
    async (step: number, silent = false) => {
      stepRef.current = step;
      setSaving(true);
      try {
        const { id, ...body } = draft;
        const res = await api.saveDraft(id, step, body as Record<string, unknown>);
        try {
          sessionStorage.setItem(storageKey(res.id), JSON.stringify({ ...draft, id: res.id }));
        } catch {}
        setDraft((d) => ({ ...d, id: res.id }));
        setDirty(false);
        setSavedAt(new Date());
        if (!silent) toast.success("Черновик сохранён");
        return res.id;
      } catch (e) {
        if (!silent) toast.error("Не удалось сохранить черновик");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [draft],
  );

  // автосохранение только когда черновик уже есть на сервере
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!dirty || !draft.id) return;
    const t = setTimeout(() => saveRef.current(stepRef.current, true).catch(() => {}), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, draft]);

  return <WizardCtx.Provider value={{ draft, set, patch, save, savedAt, saving, dirty }}>{children}</WizardCtx.Provider>;
}

export function useWizard() {
  const c = useContext(WizardCtx);
  if (!c) throw new Error("useWizard вне WizardProvider");
  return c;
}
