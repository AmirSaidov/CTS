# Фронт ↔ бэкенд: этап 1 «Фундамент»

Для фронтендера CTS. Как подключить Next.js к Django и что поправить у себя.
Проверено на фронте из этого репозитория: запросы через rewrite `/api/v1` → `localhost:8000`,
SSR с cookie, `proxy.ts`.

## Что уже работает

| Метод в `endpoints.ts` | Запрос | Ответ |
| --- | --- | --- |
| `games` | `GET /games/` | `Game[]` |
| `plans` | `GET /plans/` | `PlanInfo[]`; неутверждённые цены — строка `"—"` |
| `me` | `GET /auth/me/` | `SessionUser` (+ `org.permissions`, `games`, `city`, `avatar`) |
| `register` | `POST /auth/register/` | `201 {ok}` + cookie; **нужно поле `terms`**, см. ниже |
| `checkNick` | `GET /auth/nick-available/?nick=` | `{available}` |
| `login` | `POST /auth/login/` | `{ok}` + cookie; 400 `invalid_credentials`, 429 после 5 ошибок |
| `verify` | `POST /auth/verify/` | `{ok}` + новый access с `email_verified: true` |
| `resendCode` | `POST /auth/verify/resend/` | `{ok}`; чаще раза в 60 с — 429 `resend_too_soon` |
| `forgot` | `POST /auth/password/forgot/` | всегда `{ok}` |
| `reset` | `POST /auth/password/reset/` | `{ok}`; устаревшая ссылка — 410 |
| `logout` | `POST /auth/logout/` | `{ok}`, cookie удаляются |
| `saveOnboarding` | `PATCH /me/onboarding/` | `{ok}`; `games` и `city` можно слать по отдельности |
| `refreshSession` (client.ts) | `POST /auth/refresh/` | `{ok}` + новые cookie; иначе 401 |

Ошибки — `{code, message, fields?}`, у каждого ответа есть заголовок `X-Request-ID`.
Всё остальное из `endpoints.ts` (турниры, команды, кабинеты, CRM, админка) — этапы 2–5, сейчас **404**.

## `.env.local` фронта

```env
NEXT_PUBLIC_API_MOCKS=0
API_INTERNAL_URL=http://localhost:8000/api/v1
API_INTERNAL_ORIGIN=http://localhost:8000
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Открывайте сайт по **http://localhost:3000**, а не по `127.0.0.1:3000` или IP из сети: меняющие запросы
принимаются только с Origin из `CSRF_TRUSTED_ORIGINS` в `backend/.env` (по умолчанию `http://localhost:3000`).
Нужен другой адрес — добавьте его туда через запятую.

## Запуск бэкенда

```bash
cd backend
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py seed --demo
.venv/Scripts/python manage.py runserver        # http://localhost:8000, Swagger — /api/v1/docs/
```

Первая установка — в [`../README.md`](../README.md).

## Демо-аккаунты

Пароль у всех: `CtsDemo2026!`

| Почта | Ник | Кто |
| --- | --- | --- |
| `aktan@cts.local` | `Aktan` | игрок, почта подтверждена |
| `org@cts.local` | `CyberArena` | организатор, владелец «[Клуб] Cyber Arena», тариф Free |
| `admin@cts.local` | `ctsadmin` | суперадмин (`isPlatformAdmin`), вход в `/admin/` Django |

## Где взять код подтверждения локально

Письма не отправляются, а **печатаются в консоль `runserver`**. После регистрации или «Отправить код
повторно» ищите в выводе сервера строку `Ваш код подтверждения: 123456`. Там же — ссылка сброса пароля
`http://localhost:3000/reset/<token>`. Код живёт 10 минут, даёт 5 попыток.

## Что поправить во фронте

### 1. Отправлять `terms` при регистрации — обязательно

`register-form.tsx` вырезает поле: `handleSubmit(async ({ terms: _t, ...body }) => …)`. Бэкенд требует
согласие (ТЗ, раздел 5: сохраняется версия документа и время) и без него отвечает 400:
`fields.terms = ["Обязательное поле."]`. Нужно отправлять `terms: true` и добавить его в тип тела
`api.register` в `endpoints.ts`.

### 2. Смешанный режим моков — обязательно, пока не готовы этапы 2–5

Сейчас переключатель один: `NEXT_PUBLIC_API_MOCKS=0` отправляет в API **все** вызовы. Эндпоинтов этапов 2–5
ещё нет, поэтому с реальным API падают с 500 главная `/` (`api.bracket`), каталог `/tournaments` и
кабинеты, например `/settings/profile` (`api.sessions`). Работают `/login`, `/register`, `/verify`,
`/forgot`, `/reset/…`, `/onboarding/*`, `/pricing`, `/about`.

Предложение: настоящий API — только для готовых групп, остальное — моки. Например, в `client.ts`:

```ts
// NEXT_PUBLIC_API_REAL=auth,me,games,plans — что уже есть на бэкенде; пусто — как сейчас (всё по USE_MOCKS)
const REAL = new Set((process.env.NEXT_PUBLIC_API_REAL ?? "").split(",").filter(Boolean));

export async function call<T>(mock: () => T | Promise<T>, real: () => Promise<T>, latency = 220, group?: string) {
  if (!USE_MOCKS || (group && REAL.has(group))) return real();
  // …как сейчас
}
```

Группу передают методы `endpoints.ts`: `games` → `"games"`, `plans` → `"plans"`, `me` и `saveOnboarding` → `"me"`,
`login`, `register`, `verify`, `resendCode`, `forgot`, `reset`, `logout`, `checkNick` → `"auth"`.
Учтите три места, которые завязаны на `USE_MOCKS` целиком:

- `session.ts` в режиме моков берёт пользователя из cookie `cts_mock_role`, а не из `/auth/me/`.
  Для смешанного режима ему нужен настоящий `api.me`.
- `proxy.ts` в режиме моков читает роль из `cts_mock_role`. Для смешанного режима ему нужен JWT.
- `next.config.ts` при `NEXT_PUBLIC_API_MOCKS=1` отключает rewrite `/api/v1` → Django.

### 3. Таймер повторной отправки кода — желательно

На `/verify` `RESEND_AFTER = 42` секунды, а бэкенд по ТЗ разрешает повтор раз в **60** секунд.
Нажатие на 42-й секунде получит 429 `resend_too_soon` (`message` и `retryAfter` в теле), а
`await api.resendCode()` не обёрнут в `try/catch`. Поставьте 60 и покажите `e.message` в тосте.

### 4. Куда вести после входа — желательно

`login-form.tsx` выбирает `/org` или `/me` по тому, есть ли «org» в логине: это логика моков. С API вместо этого
берите `defaultCabinet` из `/auth/me/` или положитесь на `proxy.ts`: `/login` для вошедшего уже
редиректит по `is_organizer` из JWT.

### 5. Права модератора — сверить

В `permissions.ts` у модератора есть `mailings.send`, а в ТЗ (экран 42) модератор рассылки делать **не может**.
Бэкенд следует ТЗ. Имена прав совпадают с фронтом, а список прав роли бэкенд отдаёт в
`/auth/me/` → `org.permissions`, так что `can()` может брать его оттуда, а не из своей матрицы.

### 6. Вход через Discord, Google и Telegram

OAuth на этапе 1 не подключён (нужны ключи приложений). Кнопки в `social.tsx` с реальным API пока не работают.

### 7. Обновление токена на сервере Next

Приём refresh на GET — временный режим. Когда фронт начнёт обновлять токен
в proxy.ts или getSession, этот режим на бэке выключим. Как он устроен — ниже, в «SSR после истечения access».

## Как устроены cookie и CSRF (менять ничего не нужно)

- `access` (15 минут) и `refresh` (30 дней, без «Запомнить меня» — до закрытия браузера): httpOnly, `SameSite=Lax`,
  `path=/`. `Secure` выключен только при `DEBUG=True`.
- **Токен `csrftoken` и заголовок `X-CSRFToken` не нужны.** Защита от CSRF — SameSite=Lax и проверка
  заголовка Origin: меняющий запрос с cookie и чужим Origin получает 403 `csrf_failed`. GET-запросы
  (в том числе SSR без Origin) не проверяются.
- В JWT есть claims для `proxy.ts`: `is_player`, `is_organizer`, `is_platform_admin`, `email_verified`.
  После `/auth/verify/` выдаётся новый access с `email_verified: true`.
- **SSR после истечения access.** Сервер Next не умеет обновлять токен, поэтому через 15 минут страницы
  приходили бы только с `refresh`. Бэкенд для GET/HEAD принимает действующий refresh вместо access, и
  `getSession()` продолжает работать. Меняющие запросы по-прежнему требуют access: браузер получает 401 и
  делает `/auth/refresh/`, как в `client.ts`.
- **Завершающий слэш.** Next по умолчанию срезает его редиректом 308 до rewrite, и Django получает
  `/api/v1/plans` вместо `/api/v1/plans/`. Бэкенд принимает оба варианта без редиректа.

## WebSocket — пока нет

Django Channels подключается на этапе 3. С `NEXT_PUBLIC_API_MOCKS=0` `RealtimeProvider` создаёт настоящий
`RealtimeClient(wsUrl())` → `ws://localhost:3000/ws/` (или `NEXT_PUBLIC_WS_URL`). Соединение не установится,
клиент будет переподключаться и показывать «Нет соединения». До этапа 3 в смешанном режиме оставьте
`MockRealtime` или не обращайте внимания на плашку.

## Как проверить

- Контрактные тесты (запросы ровно как в `endpoints.ts` и `client.ts`):
  `backend/apps/core/tests/test_frontend_contract.py`; запуск — `pytest` из `backend/`.
- Смоук через прокси Next (нужны Django на :8000 и фронт на :3000 с `NEXT_PUBLIC_API_MOCKS=0`):
  `.venv/Scripts/python scripts/smoke_next_proxy.py`. Проверяет вход, cookie, `/auth/me/`, CSRF,
  refresh, редиректы `proxy.ts` и SSR без access.
