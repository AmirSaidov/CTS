import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ApiRequestError, registerServerHeaders } from "./client";

// приватные SSR-запросы к Django — от имени пользователя (cookie входящего запроса)
registerServerHeaders(async (): Promise<Record<string, string>> => {
  const cookie = (await cookies()).toString();
  return cookie ? { cookie } : {};
});

/** 404 с API → страница 54 (not-found), остальное пробрасываем в error boundary (55). */
export async function orNotFound<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) notFound();
    throw e;
  }
}
