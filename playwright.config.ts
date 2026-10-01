import { defineConfig, devices } from "@playwright/test";

/**
 * E2E ключевых сценариев (критерий приёмки ТЗ). Гоняются на моках: NEXT_PUBLIC_API_MOCKS=1.
 * Локально переиспользуют запущенный dev-сервер (E2E_BASE), в CI поднимают свой.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE = process.env.E2E_BASE ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: BASE, trace: "retain-on-failure", locale: "ru-RU", timezoneId: "Asia/Bishkek" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { NEXT_PUBLIC_API_MOCKS: "1" },
  },
});
