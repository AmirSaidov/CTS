# CTS — фронтенд

Esports Tournament CRM: публичный сайт, кабинет игрока, CRM организатора, настройки, админка `/control`.
57 экранов макета → Next.js 16 (App Router) + TypeScript + Tailwind v4. Бэкенд — Django REST + Django Channels.

## Запуск

```bash
npm i
cp .env.example .env.local   # NEXT_PUBLIC_API_MOCKS=1 — работа без бэкенда
npm run dev                  # http://localhost:3000
```

В режиме моков слева внизу есть **DEV-переключатель роли** (гость / игрок / капитан / организатор / судья / админ) — так видно все кабинеты без бэкенда. Моковый мир живёт в 24.09.2026 (как в макете), WebSocket эмулируется: live-счёт SF-02, прогресс чек-ина, новое уведомление через 25 с.

| Команда | Что делает |
|---|---|
| `npm run typecheck` / `npm run lint` | TypeScript strict / ESLint |
| `npm run build` | продакшен-сборка |
| `npm run test:e2e` | Playwright: вход, заявка, чек-ин + счёт (и на мобильном), мастер, публикация, спор, роли, live |
| `npm run check:overflow` | все маршруты × 375/768/1440: нет горизонтального скролла и ошибок гидрации |
| `npm run api:types` | типы из OpenAPI Django (drf-spectacular) → `src/shared/api/schema.d.ts` |
| `/dev/ui` | витрина UI-кита и экран 57 «Пустые состояния» (в проде — 404) |

## Структура

```
src/
  app/
    (marketing)/          01 лендинг
    (public)/             03–14 каталог, турнир, матч, расписание, профили, рейтинг, новости, тарифы, о платформе, правовые
    (auth)/               15–20 вход, регистрация, восстановление, подтверждение, онбординг
    (player)/             21–28 кабинет игрока + /tournaments/[slug]/apply
    (org)/org/            02, 29–43 CRM: дашборд, мастер, управление турниром (manage), CRM-разделы
    (settings)/settings/  44–48
    (admin)/control/      49–53 (не /admin — чтобы не конфликтовать с админкой Django)
    not-found / error / global-error / maintenance   54–56
  proxy.ts                защита маршрутов по роли (в Next 16 middleware → proxy)
  shared/
    tokens/tokens.css     все цвета и размеры — только отсюда
    ui/                   UI-кит: Button, Card+CornerMarkers, Badge, form, Tabs, Table, Modal, Toast, EmptyState, FileDrop, OTP, Stepper…
    layouts/              PublicHeader/Footer, AuthShell, CabinetShell (один каркас на 4 кабинета), SystemScreen
    api/                  client.ts (fetch, refresh-токен, ошибки {code,message,fields}), endpoints.ts, keys.ts, mocks/
    realtime/             WebSocket-клиент + эмулятор
    auth/ lib/            сессия, права (матрица экрана 42), форматирование дат, часы, sanitize
  features/               экранная логика по доменам: bracket, match, live, player, org/wizard, org/manage, org/crm, control, settings…
messages/                 ru.json (основной), ky.json, en.json
```

## Контракт с бэкендом

**REST.** Все вызовы — в `src/shared/api/endpoints.ts`: у каждого есть мок и реальный запрос к `/api/v1/…`. Пути — предложение, сверить с OpenAPI и поправить в одном файле. Ключи приходят в snake_case, фронт конвертирует в camelCase.

- Авторизация: JWT access+refresh в **httpOnly-cookie**; 401 → один общий `POST /auth/refresh/` и повтор запроса. Браузер ходит на тот же origin (`next.config.ts` проксирует `/api/v1` в Django), поэтому CORS не нужен.
- SSR приватных страниц пробрасывает cookie пользователя автоматически (`shared/api/server.ts`); публичные запросы с `revalidate` cookie не трогают.
- Ошибки: `{code, message, fields}` → ошибки полей под инпутами, общие — в форме и тостом. Заголовок `x-request-id` показывается на 500.
- 503 / флаг maintenance → `/maintenance`.
- Для роутинга `proxy.ts` читает из payload JWT поля `is_player`, `is_organizer`, `is_platform_admin`, `email_verified` (без проверки подписи; права окончательно проверяет Django).

**WebSocket** (`src/shared/realtime/client.ts`) — одно соединение на вкладку, переподключение 1→30 с с джиттером, плашка «Нет соединения», дозапрос данных после восстановления. События пишутся в кэш TanStack Query (`features/live/hooks.ts`).

```
→ {"action":"subscribe"|"unsubscribe","channel":"tournament:osh-open"}
← {"channel":"…","event":"…","data":{…}}

tournament:{slug}      match.updated · match.advanced · bracket.rebuilt
match:{slug}:{code}    match.score · match.finished
checkin:{tournamentId} checkin.updated · checkin.extended · checkin.closed
user                   notification.created · invite.created · checkin.opponent · match.updated
```

## Решения и отступления от текста ТЗ

- **Палитра.** В тексте ТЗ (раздел 3) — красная (#E0202E на #0B0707), а макет, который по ТЗ является источником истины, нарисован в стальной. Взята палитра макета. Красная оставлена комментариями в `tokens.css`: для перехода достаточно поменять один блок.
- `--accent-deep` (столбцы графиков) поднят до #5F6D82, чтобы контраст с карточкой был 3.4:1 (WCAG 1.4.11).
- `#5C636E` (`--text-4`) даёт 3.2:1 и используется только для декоративных техметок.
- Пункт «Матчи» в сайдбаре организатора ведёт на экран 36 ближайшего активного турнира, «Обзор» админки — на «Пользователи» (этих экранов нет в макете).

## Не сделано / ждёт заказчика или бэкенда

- **i18n**: next-intl подключён, язык меняется на экране 46, в `messages/` вынесены навигация, меню кабинетов, общие кнопки и пустые состояния. Тексты внутри экранов пока строками в коде (RU). Перенести их в `messages/*.json` нужно до приёмки (это критерий приёмки ТЗ).
- **ISR публичных страниц**: сейчас SSR на каждый запрос, потому что корневой layout читает сессию из cookie. Для ISR нужно грузить сессию на публичных страницах на клиенте.
- Платёжный сервис, цены, лимиты, возраст, юр. тексты стоят заглушками `[ЦЕНА]`, `[N]`, `[ВОЗРАСТ]`. Это открытые вопросы из раздела 13 ТЗ.
- Нужен ли организатору онбординг игр: пока после подтверждения почты он сразу уходит в `/org` (`app/(auth)/verify/page.tsx`).
- Экранов нет в макете: создание команды, публичная страница организации `/org/[slug]`, баннеры/FAQ/правовые в админке (вкладки есть, редактор — как у статей).
- Web Push: кнопка «Разрешить» запрашивает разрешение браузера, подписку (VAPID) оформит бэкенд.
