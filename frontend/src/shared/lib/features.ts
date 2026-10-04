/*
 * Экраны, отложенные на v2 («ТЗ на урезание до MVP», раздел 6): код остаётся, пункты меню убраны,
 * маршрут закрыт флагом и отдаёт 404. Включить экран — FEATURE_<NAME>=true в .env (только сервер:
 * proxy.ts и i18n). Пункты меню при этом нужно вернуть вручную.
 *
 * Переменные читаются явно, по одной: динамический process.env[name] в proxy может не сработать.
 */
const env = {
  SCHEDULE: process.env.FEATURE_SCHEDULE,
  PLAYER_PROFILE: process.env.FEATURE_PLAYER_PROFILE,
  TEAM_PROFILE: process.env.FEATURE_TEAM_PROFILE,
  RANKINGS: process.env.FEATURE_RANKINGS,
  ABOUT: process.env.FEATURE_ABOUT,
  MY_TOURNAMENTS: process.env.FEATURE_MY_TOURNAMENTS,
  INVITES: process.env.FEATURE_INVITES,
  PARTICIPANTS: process.env.FEATURE_PARTICIPANTS,
  NOTIFICATION_SETTINGS: process.env.FEATURE_NOTIFICATION_SETTINGS,
  LOCALE: process.env.FEATURE_LOCALE,
  BILLING: process.env.FEATURE_BILLING,
  DELETE_ACCOUNT: process.env.FEATURE_DELETE_ACCOUNT,
};

export type Feature = keyof typeof env;

/** Флаг → маршруты экрана (номер экрана макета в комментарии) */
const ROUTES: Record<Feature, string[]> = {
  SCHEDULE: ["/schedule"], // 04
  PLAYER_PROFILE: ["/p"], // 07
  TEAM_PROFILE: ["/t"], // 08
  RANKINGS: ["/rankings"], // 09
  ABOUT: ["/about"], // 13
  MY_TOURNAMENTS: ["/me/tournaments"], // 24
  INVITES: ["/me/invites"], // 27
  PARTICIPANTS: ["/org/participants"], // 39
  NOTIFICATION_SETTINGS: ["/settings/notifications"], // 45
  LOCALE: ["/settings/locale"], // 46
  BILLING: ["/settings/billing"], // 47
  DELETE_ACCOUNT: ["/settings/delete"], // 48
};

export function featureOn(name: Feature) {
  return env[name] === "true";
}

/** Маршрут отложенного экрана, флаг которого выключен */
export function isDeferredRoute(pathname: string) {
  return (Object.keys(ROUTES) as Feature[]).some((f) => !featureOn(f) && ROUTES[f].some((r) => pathname === r || pathname.startsWith(`${r}/`)));
}
