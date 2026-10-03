"""
Контрактные тесты: запросы ровно как во фронте.

- пути, методы и тела — из frontend/src/shared/api/endpoints.ts (auth, me, games, plans);
- преобразование ключей и заголовки — как в frontend/src/shared/api/client.ts
  (тело camelCase → snake_case, ответ snake_case → camelCase, credentials: include);
- ожидаемые поля ответов — из frontend/src/shared/api/types.ts.

Если фронт поменяет контракт, эти тесты нужно обновить вместе с ним.
"""

import json
import re
from typing import Any

import pytest
from django.core import mail

from apps.accounts.models import User
from apps.accounts.tests.factories import DEFAULT_PASSWORD, UserFactory
from apps.core.testing import FRONTEND_ORIGIN, browser
from apps.orgs.services import create_organization

pytestmark = pytest.mark.django_db


# ───── копия frontend/src/shared/api/client.ts ─────


def to_camel(s: str) -> str:
    return re.sub(r"_([a-z0-9])", lambda m: m.group(1).upper(), s)


def to_snake(s: str) -> str:
    return re.sub(r"[A-Z]", lambda m: f"_{m.group(0).lower()}", s)


def map_keys(value: Any, fn) -> Any:
    if isinstance(value, list):
        return [map_keys(v, fn) for v in value]
    if isinstance(value, dict):
        return {fn(k): map_keys(v, fn) for k, v in value.items()}
    return value


class FrontClient:
    """Как request() из client.ts: браузер на странице фронта, cookie сохраняются между запросами."""

    def __init__(self, origin: str | None = FRONTEND_ORIGIN):
        self.http = browser(origin)

    def request(self, path: str, method: str = "GET", body: Any = None, query: dict | None = None, **headers):
        kwargs: dict[str, Any] = {"HTTP_ACCEPT": "application/json", **headers}
        if body is not None:
            kwargs["data"] = json.dumps(map_keys(body, to_snake))
            kwargs["content_type"] = "application/json"
        if query:
            kwargs["QUERY_STRING"] = "&".join(f"{k}={v}" for k, v in query.items() if v not in (None, ""))
        resp = getattr(self.http, method.lower())(f"/api/v1{path}", **kwargs)
        data = map_keys(resp.json(), to_camel) if resp.content else None
        return resp.status_code, data, resp


def assert_has(obj: dict, keys: str) -> None:
    missing = set(keys.split()) - set(obj)
    assert not missing, f"нет полей {missing} в {sorted(obj)}"


def assert_api_error(data: dict) -> None:
    """ApiError из types.ts: code, message, fields?"""
    assert isinstance(data["code"], str) and data["code"]
    assert isinstance(data["message"], str) and data["message"]
    if "fields" in data:
        assert all(isinstance(v, list) and all(isinstance(x, str) for x in v) for v in data["fields"].values())


GAME_KEYS = "slug name short publisher teamSize roster accountCheck formats status"
PLAN_KEYS = "key tier name tagline priceMonth priceYear yearDiscount features cta"
SESSION_USER_KEYS = (
    "id nick tag email phone fullName emailVerified isPlayer isOrganizer isPlatformAdmin "
    "captainOf team org defaultCabinet locale timezone unread"
)


def last_code() -> str:
    return re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)


# ───── справочники ─────


def test_games(seeded):
    status, data, _ = FrontClient().request("/games/")

    assert status == 200 and isinstance(data, list) and data
    for game in data:
        assert_has(game, GAME_KEYS)
        assert game["slug"] in {"valorant", "cs2", "dota2", "mlbb", "pubgm", "eafc"}
        assert set(game["roster"]) == {"main", "subs"}
        assert game["accountCheck"] in {"riot", "steam", "discord", "telegram", "manual"}
        assert set(game["formats"]) <= {"single", "double", "groups", "swiss", "league"}
        assert game["status"] in {"active", "beta"}


def test_plans(seeded):
    status, data, _ = FrontClient().request("/plans/")

    assert status == 200
    for plan in data:
        assert_has(plan, PLAN_KEYS)
        assert plan["key"] in {"free", "pro", "league"}
        for key in ("priceMonth", "priceYear", "yearDiscount", "tier", "tagline", "cta"):
            assert isinstance(plan[key], str), key
        assert all(isinstance(f, str) for f in plan["features"])
        assert isinstance(plan.get("recommended", False), bool)


# ───── регистрация → подтверждение → онбординг ─────


def test_register_exactly_as_frontend_sends_requires_terms(seeded):
    """register-form.tsx вырезает terms перед отправкой — бэкенд требует согласие (раздел 5)."""
    body = {"role": "player", "nick": "NewPlayer", "email": "new@mail.kg", "password": "Str0ng!pass"}

    status, data, _ = FrontClient().request("/auth/register/", "POST", body)

    assert status == 400
    assert_api_error(data)
    assert "terms" in data["fields"]


def test_register_verify_onboarding_flow(seeded, django_capture_on_commit_callbacks):
    front = FrontClient()
    body = {"role": "player", "nick": "NewPlayer", "email": "new@mail.kg", "password": "Str0ng!pass", "terms": True}

    with django_capture_on_commit_callbacks(execute=True):
        status, data, resp = front.request("/auth/register/", "POST", body)
    assert (status, data) == (201, {"ok": True})
    assert {"access", "refresh"} <= set(resp.cookies)

    status, data, _ = front.request(
        "/auth/verify/", "POST", {"code": "000000" if last_code() != "000000" else "111111"}
    )
    assert status == 400
    assert_api_error(data)
    assert data["fields"]["code"]  # verify/page.tsx показывает e.fields.code[0]

    status, data, _ = front.request("/auth/verify/", "POST", {"code": last_code()})
    assert (status, data) == (200, {"ok": True})

    # onboarding/games/page.tsx и onboarding/accounts/page.tsx — по отдельности
    assert front.request("/me/onboarding/", "PATCH", {"games": ["valorant", "cs2"]})[:2] == (200, {"ok": True})
    assert front.request("/me/onboarding/", "PATCH", {"city": "Бишкек"})[:2] == (200, {"ok": True})

    status, me, _ = front.request("/auth/me/")
    assert status == 200 and me["emailVerified"] is True and me["defaultCabinet"] == "player"


def test_register_field_errors_map_to_form_fields(seeded, user):
    body = {"role": "player", "nick": user.nickname, "email": "x@mail.kg", "password": "Str0ng!pass", "terms": True}

    status, data, _ = FrontClient().request("/auth/register/", "POST", body)

    assert status == 400
    assert_api_error(data)
    assert list(data["fields"]) == ["nick"]  # applyServerErrors ставит ошибку на поле nick


def test_resend_code(seeded, django_capture_on_commit_callbacks):
    front = FrontClient()
    body = {"role": "player", "nick": "NewPlayer", "email": "new@mail.kg", "password": "Str0ng!pass", "terms": True}
    with django_capture_on_commit_callbacks(execute=True):
        front.request("/auth/register/", "POST", body)

    status, data, _ = front.request("/auth/verify/resend/", "POST")

    # повтор не чаще раза в 60 секунд (раздел 5) — сразу после регистрации 429
    assert status == 429
    assert_api_error(data)
    assert data["retryAfter"] > 0


@pytest.mark.parametrize(("nick", "available"), [(None, False), ("fresh_nick", True), ("admin", False)])
def test_check_nick(nick, available, user):
    nick = nick or user.nickname.upper()  # None — занятый ник другого регистра
    status, data, _ = FrontClient().request("/auth/nick-available/", query={"nick": nick})
    assert (status, data) == (200, {"available": available})


# ───── вход, сессия, выход ─────


def test_login_me_refresh_logout(seeded):
    user = UserFactory(nickname="Aktan", email="aktan@mail.kg", full_name="Актан")
    front = FrontClient()

    status, data, _ = front.request(
        "/auth/login/", "POST", {"login": "aktan", "password": DEFAULT_PASSWORD, "remember": True}
    )
    assert (status, data) == (200, {"ok": True})

    # session.ts: api.me({headers: {cookie}}) — серверный GET без Origin
    ssr = FrontClient(origin=None)
    ssr.http.cookies = front.http.cookies
    status, me, _ = ssr.request("/auth/me/")
    assert status == 200
    assert_has(me, SESSION_USER_KEYS)
    assert me["nick"] == "Aktan" and me["tag"] == "AK" and me["fullName"] == "Актан"
    assert me["org"] is None and me["team"] is None and me["captainOf"] is None
    assert me["locale"] in {"ru", "ky", "en"}
    assert set(me["unread"]) == {"notifications", "invites"}

    # client.ts: refreshSession() — POST без тела, только cookie
    status, data, _ = front.request("/auth/refresh/", "POST")
    assert (status, data) == (200, {"ok": True})

    assert front.request("/auth/logout/", "POST")[:2] == (200, {"ok": True})
    status, data, _ = front.request("/auth/me/")
    assert status == 401
    assert_api_error(data)
    assert user.sessions.filter(revoked_at__isnull=True).count() == 0


def test_me_for_organizer_matches_session_user(seeded):
    user = UserFactory(default_role=User.DefaultRole.ORG)
    create_organization(owner=user, name="Cyber Arena")
    front = FrontClient()
    front.request("/auth/login/", "POST", {"login": user.email, "password": DEFAULT_PASSWORD, "remember": True})

    _, me, _ = front.request("/auth/me/")

    assert me["isOrganizer"] is True and me["defaultCabinet"] == "org"
    org = me["org"]
    assert_has(org, "slug name role plan limits")
    assert org["role"] in {"owner", "admin", "judge", "moderator"}
    assert org["plan"] in {"free", "pro", "league"}
    for key in ("tournaments", "staff", "mailings"):
        used, cap = org["limits"][key]
        assert isinstance(used, int) and (cap is None or isinstance(cap, int))
    # имена прав — как в frontend/src/shared/lib/permissions.ts
    assert set(org["permissions"]) <= {
        "tournaments.manage",
        "applications.decide",
        "results.edit",
        "disputes.resolve",
        "mailings.send",
        "billing.manage",
        "staff.manage",
    }


def test_login_wrong_password_and_rate_limit(user):
    front = FrontClient()
    for _ in range(5):
        status, data, _ = front.request(
            "/auth/login/", "POST", {"login": user.email, "password": "nope", "remember": True}
        )
        assert status == 400
        assert_api_error(data)

    # login-form.tsx: 429 → «Слишком много попыток»
    status, _, _ = front.request(
        "/auth/login/", "POST", {"login": user.email, "password": DEFAULT_PASSWORD, "remember": True}
    )
    assert status == 429


def test_refresh_without_cookie_is_401(db):
    status, data, _ = FrontClient().request("/auth/refresh/", "POST")
    assert status == 401
    assert_api_error(data)


# ───── восстановление пароля ─────


def test_forgot_and_reset(user):
    front = FrontClient()

    assert front.request("/auth/password/forgot/", "POST", {"email": user.email})[:2] == (200, {"ok": True})
    assert front.request("/auth/password/forgot/", "POST", {"email": "ghost@mail.kg"})[:2] == (200, {"ok": True})

    # ссылка ведёт на страницу фронта /reset/[token]
    link = re.search(r"(\S+/reset/(\S+))", mail.outbox[-1].body)
    assert link.group(1).startswith("http://localhost:3000/reset/")
    token = link.group(2)

    status, data, _ = front.request("/auth/password/reset/", "POST", {"token": token, "password": "weak"})
    assert status == 400 and data["message"] != "Проверьте поля"  # reset/page.tsx показывает только message

    assert front.request("/auth/password/reset/", "POST", {"token": token, "password": "N3w!password"})[:2] == (
        200,
        {"ok": True},
    )

    # reset/page.tsx: 410 → «Ссылка устарела»
    status, data, _ = front.request("/auth/password/reset/", "POST", {"token": token, "password": "N3w!password"})
    assert status == 410
    assert_api_error(data)


# ───── общие свойства ответов ─────


def test_every_response_has_request_id(db):
    _, _, resp = FrontClient().request("/auth/me/")
    assert resp["X-Request-ID"]


def test_401_on_private_endpoint_without_cookie(db):
    status, data, _ = FrontClient().request("/me/onboarding/", "PATCH", {"city": "Ош"})
    assert status == 401  # client.ts делает refresh только на 401
    assert_api_error(data)


# ───── прокси Next.js: завершающий слэш срезается (308) до rewrite в Django ─────


def test_paths_without_trailing_slash_work_without_redirect(seeded, user):
    front = FrontClient()

    status, data, _ = front.request("/plans")
    assert status == 200 and data[0]["key"] == "free"

    body = {"login": user.email, "password": DEFAULT_PASSWORD, "remember": True}
    assert front.request("/auth/login", "POST", body)[:2] == (200, {"ok": True})
    assert front.request("/me/onboarding", "PATCH", {"city": "Ош"})[:2] == (200, {"ok": True})
    status, me, _ = front.request("/auth/me")
    assert status == 200 and me["nick"] == user.nickname
