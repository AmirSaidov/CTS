import { z } from "zod";
import type { BracketFormat, GameSlug, Tournament } from "@/shared/api/types";

export const STEPS = ["Игра и формат", "Даты и регистрация", "Правила и призы", "Оформление", "Проверка и публикация"] as const;

export interface Draft {
  id: string | null;
  // 1
  game: GameSlug | "other";
  format: BracketFormat;
  teamSize: string;
  maxTeams: string;
  matches: string;
  thirdPlace: "no" | "yes";
  name: string;
  // 2
  startDate: string;
  startTime: string;
  finalDate: string;
  timezone: string;
  regOpen: string;
  regClose: string;
  regType: "open" | "invite" | "qualify";
  manualReview: boolean;
  requireAccount: boolean;
  waitlist: boolean;
  venue: "online" | "lan" | "mixed";
  address: string;
  checkin: boolean;
  // 3
  rules: { title: string; body: string }[];
  showKeyRules: boolean;
  currency: string;
  prizes: string[];
  feeEnabled: boolean;
  fee: string;
  judge: string;
  contact: string;
  // 4
  description: string;
  accent: string;
  stream: string;
  telegram: string;
  // 5
  visibility: "public" | "link";
  notify: boolean;
}

export const EMPTY_DRAFT: Draft = {
  id: null,
  game: "valorant",
  format: "single",
  teamSize: "5×5",
  maxTeams: "16",
  matches: "BO1 · финал BO3",
  thirdPlace: "no",
  name: "",
  startDate: "",
  startTime: "16:00",
  finalDate: "",
  timezone: "Asia/Bishkek",
  regOpen: "",
  regClose: "",
  regType: "open",
  manualReview: true,
  requireAccount: true,
  waitlist: false,
  venue: "online",
  address: "",
  checkin: true,
  rules: [],
  showKeyRules: true,
  currency: "KGS",
  prizes: ["", "", ""],
  feeEnabled: false,
  fee: "",
  judge: "",
  contact: "",
  description: "",
  accent: "#D5DBE3",
  stream: "",
  telegram: "",
  visibility: "public",
  notify: true,
};

/** Черновик из данных турнира (бэкенд хранит черновик как турнир со статусом draft) */
export function draftFrom(t: Tournament): Draft {
  return {
    ...EMPTY_DRAFT,
    id: t.id,
    game: t.game,
    format: t.format,
    maxTeams: String(t.teams.max),
    matches: t.matchFormat,
    name: t.name,
    startDate: t.startAt.slice(0, 10),
    startTime: t.startAt.slice(11, 16),
    finalDate: t.finalAt.slice(0, 10),
    regOpen: "2026-09-20T12:00",
    regClose: t.registrationClosesAt?.slice(0, 16) ?? "",
    venue: t.venue,
    address: t.venue === "online" ? "" : "[АДРЕС КЛУБА], Ош",
    rules: t.rules ?? [
      { title: "1. Общие положения", body: "Турнир проводится по правилам Riot Games. Опоздание более 10 минут — техническое поражение." },
      { title: "2. Споры", body: "Споры решает главный судья на основании скриншотов и демо." },
    ],
    prizes: ["[СУММА] + кубок", "[СУММА]", "[СУММА]"],
    contact: "@osh_open_admin",
    description: t.description ?? "",
  };
}

const TRANSLIT: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };

/** Предпросмотр адреса турнира. Окончательный slug выдаёт бэкенд (уникальность). */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[а-яёңөү]/g, (c) => TRANSLIT[c] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Валидация по шагам — «Далее» не пускает, пока шаг не валиден. Правила совпадают с сериализатором Django.
const step1 = z.object({ name: z.string().trim().min(3, "Название — минимум 3 символа").max(60, "До 60 символов") });
const step2 = z
  .object({ startDate: z.string().min(1, "Укажите дату старта"), finalDate: z.string().min(1, "Укажите дату финала"), regOpen: z.string().min(1, "Когда открыть регистрацию"), regClose: z.string().min(1, "Когда закрыть регистрацию"), venue: z.string(), address: z.string() })
  .refine((v) => !v.finalDate || !v.startDate || v.finalDate >= v.startDate, { path: ["finalDate"], message: "Финал не раньше старта" })
  .refine((v) => !v.regClose || !v.startDate || v.regClose.slice(0, 10) <= v.startDate, { path: ["regClose"], message: "Закрытие регистрации — не позже старта" })
  .refine((v) => !v.regClose || !v.regOpen || v.regClose > v.regOpen, { path: ["regClose"], message: "Закрытие позже открытия" })
  .refine((v) => v.venue === "online" || v.address.trim().length > 3, { path: ["address"], message: "Для LAN нужен адрес площадки" });
const step3 = z.object({ prizes: z.array(z.string()), contact: z.string().trim().min(2, "Контакт для капитанов обязателен") });
const step4 = z.object({ description: z.string().max(280, "До 280 символов") });

export const STEP_SCHEMAS = [step1, step2, step3, step4, z.object({})] as const;

export function validateStep(step: number, d: Draft): Record<string, string> {
  const r = STEP_SCHEMAS[step - 1].safeParse(d);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
}
