/*
 * Единые часы приложения. В режиме моков мир живёт в 24.09.2026 с 14:08 (как в макете),
 * а время тикает: «сейчас» = 14:08 + минуты, прошедшие с начала текущего реального часа.
 * Привязка к реальному часу, а не к моменту загрузки модуля, — чтобы сервер и браузер
 * считали одинаково (иначе «N мин назад» расходится и ломает гидрацию).
 * Без моков — обычное Date.now().
 */
export const MOCK_NOW = "2026-09-24T14:08:00+06:00";

const MOCKS = process.env.NEXT_PUBLIC_API_MOCKS === "1";
const HOUR = 3_600_000;

export const now = () => {
  const real = Date.now();
  return MOCKS ? Date.parse(MOCK_NOW) + (real % HOUR) : real;
};
export const nowIso = () => new Date(now()).toISOString();
