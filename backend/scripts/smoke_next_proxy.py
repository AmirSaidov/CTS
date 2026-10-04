"""
Смоук-проверка бэкенда за прокси Next.js (rewrite /api/v1 → Django).

Запуск: Django на :8000 (с `seed --demo`), фронт на :3000 с NEXT_PUBLIC_API_MOCKS=0, затем
    .venv/Scripts/python scripts/smoke_next_proxy.py [http://localhost:3000]

Браузер имитируется: запросы идут на origin фронта, с Origin и cookie, как fetch(credentials: "include").
"""

import http.cookiejar
import json
import sys
import urllib.error
import urllib.request

FRONT = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
LOGIN = {"login": "Aktan", "password": "CtsDemo2026!", "remember": True}

jar = http.cookiejar.CookieJar()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NoRedirect)
failures: list[str] = []


def call(method: str, path: str, body=None, origin: str | None = FRONT):
    headers = {"Accept": "application/json"}
    if origin:
        headers["Origin"] = origin
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(FRONT + path, data=data, method=method, headers=headers)
    try:
        resp = opener.open(req, timeout=60)
    except urllib.error.HTTPError as err:
        resp = err
    # fetch() следует за 307/308 Next.js (он срезает завершающий слэш) с тем же методом и телом
    location = resp.headers.get("Location", "")
    if resp.status in (307, 308) and path.startswith("/api/") and location.startswith("/api/"):
        return call(method, location, body, origin)
    raw = resp.read()
    try:
        payload = json.loads(raw) if raw else None
    except ValueError:
        payload = raw.decode("utf-8", "replace")  # HTML страницы
    return resp.status, payload, resp.headers


def check(name: str, ok: bool, detail: object = "") -> None:
    print(f"{'OK  ' if ok else 'FAIL'} {name}" + (f" — {detail}" if not ok else ""))
    if not ok:
        failures.append(name)


def cookie(name: str):
    return next((c for c in jar if c.name == name), None)


status, plans, headers = call("GET", "/api/v1/plans/", origin=None)
check("GET /plans/ через прокси", status == 200 and plans[0]["key"] == "free", status)
check("X-Request-ID проходит через прокси", bool(headers.get("X-Request-ID")))

status, body, _ = call("POST", "/api/v1/auth/login/", LOGIN)
check("POST /auth/login/", (status, body) == (200, {"ok": True}), (status, body))
access, refresh = cookie("access"), cookie("refresh")
check("Set-Cookie access/refresh доходят до браузера", bool(access and refresh))
if access and refresh:
    check(
        "cookie на path=/ (их видит proxy.ts)", access.path == "/" and refresh.path == "/", (access.path, refresh.path)
    )
    check("cookie без Secure при DEBUG", not access.secure)
    check("cookie httpOnly", access.has_nonstandard_attr("HttpOnly"))

status, me, _ = call("GET", "/api/v1/auth/me/", origin=None)
check("GET /auth/me/ без Origin (как SSR)", status == 200 and me["nick"] == "Aktan", (status, me))

status, body, _ = call("POST", "/api/v1/auth/verify/resend/")
check("POST /auth/verify/resend/ со своим Origin", status == 200, (status, body))

status, body, _ = call("POST", "/api/v1/auth/verify/resend/", origin="https://evil.example")
check("POST с чужим Origin → 403 csrf_failed", status == 403 and body["code"] == "csrf_failed", (status, body))

status, body, _ = call("POST", "/api/v1/auth/refresh/")
check("POST /auth/refresh/", status == 200, (status, body))

# Страницы Next. proxy.ts читает claims из cookie, SSR берёт сессию через /auth/me/.
# /pricing рендерит кнопку Pro по-разному для вошедшего и гостя — по ней видно, узнал ли SSR пользователя.
AUTHED_LINK, GUEST_LINK = "/settings/billing?plan=pro", "/register?role=org&amp;plan=pro"


def pricing_sees_user() -> bool:
    status, html, _ = call("GET", "/pricing", origin=None)
    assert status == 200, status
    return AUTHED_LINK in html


status, _, headers = call("GET", "/login", origin=None)
check(
    "/login для вошедшего → редирект в кабинет", status in (302, 307) and "/me" in headers.get("Location", ""), status
)
check("SSR /pricing узнаёт пользователя по cookie", pricing_sees_user())
status, _, headers = call("GET", "/verify", origin=None)
check("закрытая страница /verify открывается", status == 200, (status, headers.get("Location")))

# access истёк (15 минут) — остался только refresh
if access:
    jar.clear(domain=access.domain, path=access.path, name="access")
status, _, headers = call("GET", "/verify", origin=None)
check("без access: proxy.ts пускает по refresh", status == 200, (status, headers.get("Location")))
check("без access: SSR всё ещё узнаёт пользователя (GET по refresh)", pricing_sees_user())
status, body, _ = call("POST", "/api/v1/auth/verify/resend/")
check("без access: POST → 401, браузер обновит токен", status == 401, (status, body))
status, body, _ = call("POST", "/api/v1/auth/refresh/")
check("refresh восстанавливает access", status == 200 and cookie("access") is not None, (status, body))

status, body, _ = call("POST", "/api/v1/auth/logout/")
check("POST /auth/logout/", status == 200, (status, body))
check("после выхода SSR видит гостя", not pricing_sees_user())
status, _, headers = call("GET", "/verify", origin=None)
check("после выхода — редирект на /login", status in (302, 307) and "/login" in headers.get("Location", ""), status)

print()
print("Всё прошло" if not failures else f"Провалено: {len(failures)}")
sys.exit(1 if failures else 0)
