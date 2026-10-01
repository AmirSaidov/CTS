"use client";

import { useEffect } from "react";

const MESSAGE = "Есть несохранённые изменения. Уйти со страницы?";

/**
 * Предупреждение при уходе с несохранёнными изменениями.
 * App Router не даёт событий навигации, поэтому перехватываем: закрытие вкладки (beforeunload),
 * клики по внутренним ссылкам (capture-фаза) и «Назад» в браузере (popstate).
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onPop = () => {
      if (!window.confirm(MESSAGE)) history.pushState(null, "", window.location.href);
    };
    history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, [dirty]);
}
