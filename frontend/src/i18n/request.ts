import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

/*
 * i18n без префикса локали в URL: язык хранится в cookie NEXT_LOCALE (меняется на экране 46).
 * RU — основной; KY и EN подключаются по мере готовности переводов (недостающие ключи берутся из RU).
 */
export const LOCALES = ["ru", "ky", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export default getRequestConfig(async () => {
  const store = await cookies();
  const fromCookie = store.get("NEXT_LOCALE")?.value as Locale | undefined;
  const locale: Locale = fromCookie && LOCALES.includes(fromCookie) ? fromCookie : "ru";
  const ru = (await import("../../messages/ru.json")).default;
  const own = locale === "ru" ? ru : deepMerge(ru, (await import(`../../messages/${locale}.json`)).default);
  return { locale, messages: own, timeZone: "Asia/Bishkek" };
});

type Tree = { [k: string]: string | Tree };
function deepMerge(base: Tree, over: Tree): Tree {
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = typeof v === "object" && typeof base[k] === "object" ? deepMerge(base[k] as Tree, v) : v;
  }
  return out;
}
