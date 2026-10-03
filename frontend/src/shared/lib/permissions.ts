import type { OrgRole, SessionUser } from "@/shared/api/types";

/**
 * Матрица прав сотрудников организатора (экран 42).
 * Фронт только прячет недоступное — окончательно права проверяет бэкенд.
 */
export const ORG_ACTIONS = [
  "tournaments.manage",
  "applications.decide",
  "results.edit",
  "disputes.resolve",
  "mailings.send",
  "billing.manage",
  "staff.manage",
] as const;
export type OrgAction = (typeof ORG_ACTIONS)[number];

export const ORG_ACTION_LABELS: Record<OrgAction, string> = {
  "tournaments.manage": "Создавать и удалять турниры",
  "applications.decide": "Одобрять заявки",
  "results.edit": "Вносить и менять результаты",
  "disputes.resolve": "Решать споры",
  "mailings.send": "Рассылки",
  "billing.manage": "Подписка и оплата",
  "staff.manage": "Управлять командой организаторов",
};

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Владелец",
  admin: "Админ",
  judge: "Судья",
  moderator: "Модератор",
};

export const ORG_ROLE_HINTS: Record<OrgRole, string> = {
  owner: "Полный доступ, включая оплату и команду.",
  admin: "Всё, кроме подписки и управления командой организаторов.",
  judge: "Судья видит все турниры организации, но не может менять настройки и оплату.",
  moderator: "Проверяет заявки и отправляет рассылки.",
};

export const ROLE_MATRIX: Record<OrgRole, readonly OrgAction[]> = {
  owner: ORG_ACTIONS,
  admin: ["tournaments.manage", "applications.decide", "results.edit", "disputes.resolve", "mailings.send"],
  judge: ["results.edit", "disputes.resolve"],
  moderator: ["applications.decide", "mailings.send"],
};

export function can(user: SessionUser | null, action: OrgAction): boolean {
  const role = user?.org?.role;
  return !!role && ROLE_MATRIX[role].includes(action);
}

export function isCaptain(user: SessionUser | null, teamSlug?: string) {
  return !!user?.captainOf && (!teamSlug || user.captainOf === teamSlug);
}

/** Pro-функции не прячем, а показываем с плашкой и ведём на /pricing */
export function hasPlan(user: SessionUser | null, plan: "pro" | "league") {
  const p = user?.org?.plan;
  return plan === "pro" ? p === "pro" || p === "league" : p === "league";
}
