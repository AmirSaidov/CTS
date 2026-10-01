import type { ApiError } from "./types";

export const USE_MOCKS = process.env.NEXT_PUBLIC_API_MOCKS === "1";

/** На сервере нужен абсолютный адрес Django, в браузере — относительный (через rewrite в next.config). */
const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_URL ?? "http://localhost:8000/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL ?? "/api/v1");

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message);
    this.name = "ApiRequestError";
  }

  /** Ошибки полей формы: { nick: ["Ник занят"] } */
  get fields() {
    return this.body.fields ?? {};
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  /** На сервере — заголовок Cookie из входящего запроса (см. shared/api/server.ts) */
  headers?: Record<string, string>;
  /** next.revalidate для публичных SSR/ISR-запросов */
  revalidate?: number | false;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

// camelCase ↔ snake_case: Django отдаёт snake_case, фронт живёт в camelCase
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function mapKeys(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => mapKeys(v, fn));
  if (value && typeof value === "object" && !(value instanceof FormData) && !(value instanceof Blob)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [fn(k), mapKeys(v, fn)]));
  }
  return value;
}

/*
 * На сервере приватные запросы (без revalidate) автоматически несут cookie входящего запроса —
 * регистрируется из server.ts (server-only), чтобы next/headers не попал в клиентский бандл.
 * Публичные запросы с revalidate cookie не трогают — иначе страница перестала бы быть ISR.
 */
let serverHeaders: (() => Promise<Record<string, string>>) | null = null;
export function registerServerHeaders(fn: () => Promise<Record<string, string>>) {
  serverHeaders = fn;
}

let refreshing: Promise<boolean> | null = null;

/** Прозрачное обновление access-токена (refresh лежит в httpOnly-cookie). Один запрос на все параллельные 401. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(buildUrl("/auth/refresh/"), { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function request<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const forwarded = typeof window === "undefined" && serverHeaders && opts.revalidate === undefined && !opts.headers ? await serverHeaders().catch(() => ({})) : {};
  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    credentials: "include",
    signal: opts.signal,
    headers: {
      Accept: "application/json",
      ...(opts.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...forwarded,
      ...opts.headers,
    },
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(mapKeys(opts.body, toSnake)),
    ...(opts.revalidate !== undefined ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
  });

  if (res.status === 401 && !retried && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    if (await refreshSession()) return request<T>(path, opts, true);
  }

  // технические работы (экран 56): Django отвечает 503 / флаг maintenance
  if (res.status === 503) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- вне React-дерева: роутера нет
    if (typeof window !== "undefined") window.location.assign("/maintenance");
    else (await import("next/navigation")).redirect("/maintenance");
  }

  if (!res.ok) {
    let body: ApiError;
    try {
      body = mapKeys(await res.json(), toCamel) as ApiError;
    } catch {
      body = { code: `http_${res.status}`, message: res.statusText || "Ошибка сервера" };
    }
    body.requestId ??= res.headers.get("x-request-id") ?? undefined;
    throw new ApiRequestError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return mapKeys(await res.json(), toCamel) as T;
}

/** Мок или настоящий запрос — одна точка переключения. */
export async function call<T>(mock: () => T | Promise<T>, real: () => Promise<T>, latency = 220): Promise<T> {
  if (!USE_MOCKS) return real();
  if (typeof window !== "undefined" && latency) await new Promise((r) => setTimeout(r, latency));
  return structuredClone(await mock());
}

export function mockError(status: number, message: string, fields?: ApiError["fields"]): never {
  throw new ApiRequestError(status, { code: `mock_${status}`, message, fields });
}
