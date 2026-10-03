import { format as fmt, formatDistanceStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { now as clockNow } from "./clock";

/*
 * С API все даты приходят в UTC (ISO 8601). Выводим в часовом поясе пользователя (экран 46);
 * для турнира дополнительно показываем его собственный пояс.
 */
export const DEFAULT_TZ = "Asia/Bishkek";

export function inTz(iso: string, tz = DEFAULT_TZ) {
  return new TZDate(iso, tz);
}

export const fmtTime = (iso: string, tz?: string) => fmt(inTz(iso, tz), "HH:mm");
export const fmtDay = (iso: string, tz?: string) => fmt(inTz(iso, tz), "dd.MM");
export const fmtDate = (iso: string, tz?: string) => fmt(inTz(iso, tz), "dd.MM.yyyy");
export const fmtDayTime = (iso: string, tz?: string) => fmt(inTz(iso, tz), "dd.MM · HH:mm");
export const fmtLong = (iso: string, tz?: string) => fmt(inTz(iso, tz), "d MMMM", { locale: ru });
export const fmtWeekdayLong = (iso: string, tz?: string) => fmt(inTz(iso, tz), "EEEE", { locale: ru });
export const fmtWeekday = (iso: string, tz?: string) => fmt(inTz(iso, tz), "EEEEEE", { locale: ru });

/** «UTC+6» для подписи часового пояса */
export function tzLabel(tz = DEFAULT_TZ, at = new Date(clockNow())) {
  const offset = -new TZDate(at, tz).getTimezoneOffset() / 60;
  return `UTC${offset >= 0 ? "+" : ""}${offset}`;
}

/** «10 мин», «2 ч», «1 д» — для лент уведомлений и очередей */
export function ago(iso: string, now = clockNow()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)} мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.floor(h / 24)} д`;
}

export function dayGroup(iso: string, at = clockNow(), tz = DEFAULT_TZ): "today" | "yesterday" | "earlier" {
  const day = (ms: number) => fmt(new TZDate(ms, tz), "yyyy-MM-dd");
  const d = day(new Date(iso).getTime());
  if (d === day(at)) return "today";
  if (d === day(at - 86_400_000)) return "yesterday";
  return "earlier";
}

export const distance = (a: Date, b: Date) => formatDistanceStrict(a, b, { locale: ru });

/** «1 240» — неразрывный пробел между разрядами */
export const num = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Обратный отсчёт: «00:42:10» или «2д 21ч» для длинных интервалов */
export function countdown(ms: number, long = false) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (long && d > 0) return `${d}д ${h}ч`;
  return `${pad2(d * 24 + h)}:${pad2(m)}:${pad2(s % 60)}`;
}

/** Файл календаря .ics для «Добавить в календарь» */
export function icsFile(o: { title: string; start: string; durationMin: number; url: string; description?: string }) {
  const toIcs = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(o.start);
  const end = new Date(start.getTime() + o.durationMin * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CTS//Tournament OS//RU",
    "BEGIN:VEVENT",
    `UID:${start.getTime()}@cts.gg`,
    `DTSTAMP:${toIcs(new Date())}`,
    `DTSTART:${toIcs(start)}`,
    `DTEND:${toIcs(end)}`,
    `SUMMARY:${o.title}`,
    `DESCRIPTION:${o.description ?? ""}`,
    `URL:${o.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${o.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function download(name: string, content: string | Blob, type = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
