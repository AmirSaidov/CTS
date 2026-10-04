import type { BrowserContext } from "@playwright/test";

export type Role = "guest" | "player" | "captain" | "organizer";

/** Роль в режиме моков — cookie, как у dev-переключателя */
export async function as(context: BrowserContext, role: Role, baseURL = "http://localhost:3100") {
  await context.addCookies([{ name: "cts_mock_role", value: role, url: baseURL }]);
}
