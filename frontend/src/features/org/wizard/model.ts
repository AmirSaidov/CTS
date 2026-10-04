import { z } from "zod";
import type { BracketFormat, GameSlug, Tournament } from "@/shared/api/types";

/** MVP: два шага. Правила, призы, взносы, оформление и видимость убраны — турнир всегда публичный, баннер — арт игры. */
export const STEPS = ["Игра и формат", "Даты и регистрация"] as const;

/** В MVP только Single и Double Elimination */
export type WizardFormat = Extract<BracketFormat, "single" | "double">;

export interface Draft {
  id: string | null;
  // 1
  game: GameSlug | "other";
  format: WizardFormat;
  teamSize: string;
  maxTeams: string;
  matches: string;
  name: string;
  // 2
  startDate: string;
  startTime: string;
  finalDate: string;
  timezone: string;
  regOpen: string;
  regClose: string;
  regType: "open" | "invite";
  manualReview: boolean;
  venue: "online" | "lan" | "mixed";
  address: string;
  checkin: boolean;
}

export const EMPTY_DRAFT: Draft = {
  id: null,
  game: "valorant",
  format: "single",
  teamSize: "5×5",
  maxTeams: "16",
  matches: "BO1 · финал BO3",
  name: "",
  startDate: "",
  startTime: "16:00",
  finalDate: "",
  timezone: "Asia/Bishkek",
  regOpen: "",
  regClose: "",
  regType: "open",
  manualReview: true,
  venue: "online",
  address: "",
  checkin: true,
};

/** Черновик из данных турнира (бэкенд хранит черновик как турнир со статусом draft) */
export function draftFrom(t: Tournament): Draft {
  return {
    ...EMPTY_DRAFT,
    id: t.id,
    game: t.game,
    format: t.format === "double" ? "double" : "single",
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

// Валидация по шагам — «Далее» и «Опубликовать» не пускают, пока шаг не валиден. Правила совпадают с сериализатором Django.
const step1 = z.object({ name: z.string().trim().min(3, "Название — минимум 3 символа").max(60, "До 60 символов") });
const step2 = z
  .object({ startDate: z.string().min(1, "Укажите дату старта"), finalDate: z.string().min(1, "Укажите дату финала"), regOpen: z.string().min(1, "Когда открыть регистрацию"), regClose: z.string().min(1, "Когда закрыть регистрацию"), venue: z.string(), address: z.string() })
  .refine((v) => !v.finalDate || !v.startDate || v.finalDate >= v.startDate, { path: ["finalDate"], message: "Финал не раньше старта" })
  .refine((v) => !v.regClose || !v.startDate || v.regClose.slice(0, 10) <= v.startDate, { path: ["regClose"], message: "Закрытие регистрации — не позже старта" })
  .refine((v) => !v.regClose || !v.regOpen || v.regClose > v.regOpen, { path: ["regClose"], message: "Закрытие позже открытия" })
  .refine((v) => v.venue === "online" || v.address.trim().length > 3, { path: ["address"], message: "Для LAN нужен адрес площадки" });

export const STEP_SCHEMAS = [step1, step2] as const;

export function validateStep(step: number, d: Draft): Record<string, string> {
  const r = STEP_SCHEMAS[step - 1].safeParse(d);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
}
