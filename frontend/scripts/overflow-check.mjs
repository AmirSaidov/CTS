// Критерий приёмки: страница без горизонтального скролла на 375 / 768 / 1440.
// node scripts/overflow-check.mjs  (нужен запущенный dev-сервер, SHOOT_BASE — его адрес)
import { chromium } from "@playwright/test";

const base = process.env.SHOOT_BASE ?? "http://localhost:3100";
// маршруты MVP («ТЗ на урезание до MVP», раздел 4)
const ROUTES = {
  guest: ["/", "/tournaments", "/tournaments/bishkek-cyber-cup", "/tournaments/bishkek-cyber-cup/matches/SF-02", "/pricing", "/legal/privacy", "/login", "/register", "/forgot", "/reset/abc", "/nope"],
  captain: ["/verify", "/me", "/me/profile", "/me/team", "/tournaments/osh-open/apply", "/me/matches", "/me/notifications", "/settings/profile"],
  organizer: ["/org", "/org/tournaments", "/org/tournaments/new", "/org/tournaments/t3/setup/2", "/org/tournaments/t3/applications", "/org/tournaments/t3/bracket", "/org/tournaments/t3/matches", "/org/tournaments/t3/checkin", "/org/notifications", "/dev/ui"],
};
const widths = (process.env.WIDTHS ?? "375,768,1440").split(",").map(Number);

const browser = await chromium.launch();
let bad = 0;
for (const [role, paths] of Object.entries(ROUTES)) {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await ctx.addCookies([{ name: "cts_mock_role", value: role, url: base }]);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.split("\n")[0]));
    for (const p of paths) {
      await page.goto(base + p, { waitUntil: "networkidle", timeout: 120_000 });
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        let culprit = "";
        if (sw > vw) {
          for (const el of document.querySelectorAll("body *")) {
            const b = el.getBoundingClientRect();
            if (b.right > vw + 1 && b.width > 0 && !el.closest("[role=region]") && getComputedStyle(el).position !== "fixed") {
              culprit = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)} → ${Math.round(b.right)}px`;
              break;
            }
          }
        }
        return { vw, sw, culprit };
      });
      if (r.sw > r.vw || errors.length) {
        bad++;
        console.log(`✗ ${width}px ${role} ${p}: scroll ${r.sw}/${r.vw} ${r.culprit} ${errors.join(" | ")}`);
      }
      errors.length = 0;
    }
    await ctx.close();
  }
}
console.log(bad ? `${bad} проблем` : "OK: горизонтального скролла и ошибок нет");
await browser.close();
