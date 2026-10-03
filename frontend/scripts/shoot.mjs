// Скриншоты страниц для сверки с макетом: node scripts/shoot.mjs <outDir> <role> <path> [path…]
// Ширина 1440 (как в макете); SHOOT_W=375 — мобильная проверка.
import { chromium } from "@playwright/test";

const [outDir, role, ...paths] = process.argv.slice(2);
const width = Number(process.env.SHOOT_W ?? 1440);
const base = process.env.SHOOT_BASE ?? "http://localhost:3100";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
await ctx.addCookies([{ name: "cts_mock_role", value: role, url: base }]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()} → ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()} console → ${m.text()}`));

for (const p of paths) {
  const res = await page.goto(base + p, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(600);
  const name = p.replace(/[/?=&]+/g, "_").replace(/^_/, "") || "root";
  await page.screenshot({ path: `${outDir}/${name}-${width}.png`, fullPage: true });
  console.log(res?.status(), p);
}
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
await browser.close();
