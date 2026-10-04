import { expect, test } from "@playwright/test";
import { as } from "./helpers";

test.describe("Вход", () => {
  test("гость попадает на /login с next и возвращается после входа", async ({ page, context, baseURL }) => {
    await as(context, "guest", baseURL);
    await page.goto("/me/matches");
    await expect(page).toHaveURL(/\/login\?next=%2Fme%2Fmatches/);
    await page.getByLabel("Почта или ник").fill("aktan@mail.kg");
    await page.getByLabel("Пароль", { exact: true }).fill("secret123");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/me\/matches/);
    await expect(page.getByRole("heading", { name: "Мои матчи" })).toBeVisible();
  });

  test("неверный пароль — общая ошибка без уточнения", async ({ page, context, baseURL }) => {
    await as(context, "guest", baseURL);
    await page.goto("/login");
    await page.getByLabel("Почта или ник").fill("aktan");
    await page.getByLabel("Пароль", { exact: true }).fill("x");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Неверная почта/ник или пароль");
  });
});

test("подача заявки капитаном", async ({ page, context, baseURL }) => {
  await as(context, "captain", baseURL);
  await page.goto("/tournaments/osh-open/apply");
  const send = page.getByRole("button", { name: "Отправить заявку" });
  await expect(send).toBeDisabled();
  await page.getByLabel("Телефон").fill("+996 555 123 456");
  for (const rule of ["Прочитал и принимаю регламент турнира", "Все игроки старше [ВОЗРАСТ] или имеют согласие родителей", "Согласен на публикацию ников и результатов"]) {
    await page.getByText(rule).click();
  }
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText("Заявка отправлена")).toBeVisible();
});

test("чек-ин и ввод счёта со скриншотом @mobile", async ({ page, context, baseURL }) => {
  await as(context, "captain", baseURL);
  await page.goto("/me/matches");
  await page.getByRole("button", { name: "Я на месте · чек-ин" }).click();
  await expect(page.getByRole("button", { name: "Вы на месте" })).toBeDisabled();

  const submit = page.getByRole("button", { name: "Отправить на подтверждение" });
  await expect(page.getByText("Итог: 2 : 1")).toBeVisible();
  await expect(submit).toBeDisabled(); // без скриншота нельзя
  await page.locator('input[type="file"][accept*="image/png"]').first().setInputFiles({ name: "score.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71]) });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("button", { name: "Ждём подтверждения" })).toBeVisible();
});

test("создание турнира: валидация шага и переход дальше", async ({ page, context, baseURL }) => {
  await as(context, "organizer", baseURL);
  await page.goto("/org/tournaments/new");
  await page.getByRole("button", { name: "Далее" }).click();
  await expect(page.locator("#main form, #main").getByRole("alert").filter({ hasText: "Название — минимум 3 символа" })).toBeVisible();
  await page.getByLabel("Название турнира").fill("Bishkek Night Cup");
  await expect(page.getByText("Будет в URL: cts.gg/bishkek-night-cup")).toBeVisible();
  await expect(page.getByLabel("Превью карточки турнира")).toContainText("Bishkek Night Cup");
  await page.getByRole("button", { name: "Далее" }).click();
  await expect(page).toHaveURL(/\/org\/tournaments\/\w+\/setup\/2/);
  await expect(page.getByText("Шаг 2 из 2 · Даты и регистрация")).toBeVisible();
});

test("публикация турнира со второго шага через подтверждение", async ({ page, context, baseURL }) => {
  await as(context, "organizer", baseURL);
  await page.goto("/org/tournaments/t3/setup/2");
  await page.getByRole("button", { name: "Опубликовать турнир" }).click();
  await expect(page.getByRole("dialog")).toContainText("нельзя поменять игру и формат сетки");
  await page.getByRole("dialog").getByRole("button", { name: "Опубликовать" }).click();
  await expect(page).toHaveURL(/\/org\/tournaments\/t3\/applications/);
});

test("владелец организации решает спор", async ({ page, context, baseURL }) => {
  await as(context, "organizer", baseURL);
  await page.goto("/org/tournaments/t3/matches");
  const panel = page.getByRole("region", { name: /Спор · QF-03/ }).or(page.locator("section", { has: page.getByRole("heading", { name: "Спор · QF-03" }) }));
  await expect(panel.first()).toBeVisible();
  await page.getByText("Samurai KG").last().click();
  await page.getByRole("button", { name: "Вынести решение" }).click();
  await expect(page.getByText("Решение вынесено")).toBeVisible();
});

test("MVP: в меню нет убранных экранов, их адреса отдают 404", async ({ page, context, baseURL }) => {
  await as(context, "organizer", baseURL);
  await page.goto("/org");
  for (const name of ["База участников", "Рассылки", "Аналитика", "Команда организаторов", "Брендирование", "Подписка"]) {
    await expect(page.getByRole("link", { name })).toHaveCount(0);
  }
  for (const path of ["/rankings", "/schedule", "/about", "/me/invites", "/org/participants", "/settings/billing", "/control/users"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
  }
});

test("live: счёт матча обновляется без перезагрузки", async ({ page, context, baseURL }) => {
  await as(context, "guest", baseURL);
  await page.goto("/tournaments/bishkek-cyber-cup/matches/SF-02");
  const lotus = page.locator("article", { hasText: "Lotus" });
  const before = await lotus.innerText();
  // эмулятор сокета шлёт счёт раз в 6 секунд
  await expect.poll(async () => lotus.innerText(), { timeout: 20_000 }).not.toBe(before);
});
