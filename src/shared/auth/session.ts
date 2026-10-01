import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { USE_MOCKS } from "@/shared/api/client";
import "@/shared/api/server";
import { api } from "@/shared/api/endpoints";
import type { SessionUser } from "@/shared/api/types";
import { MOCK_ROLES, mockUser, type MockRole } from "./mock-users";

export const MOCK_ROLE_COOKIE = "cts_mock_role";

/** Текущий пользователь для серверных компонентов. Кэшируется в пределах одного запроса. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  if (USE_MOCKS) {
    const role = store.get(MOCK_ROLE_COOKIE)?.value as MockRole | undefined;
    return mockUser(role && MOCK_ROLES.includes(role) ? role : "organizer");
  }
  try {
    return await api.me({ headers: { cookie: store.toString() } });
  } catch {
    return null;
  }
});
