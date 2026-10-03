import { USE_MOCKS } from "@/shared/api/client";

/** В режиме моков «логин» — просто cookie с ролью; с реальным бэкендом Django сам ставит httpOnly-cookie. */
export function setMockRole(role: string) {
  if (USE_MOCKS) document.cookie = `cts_mock_role=${role}; path=/; max-age=31536000; samesite=lax`;
}

/** next из ?next=… — только относительные пути, чтобы не было open redirect */
export function safeNext(next: string | null | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
