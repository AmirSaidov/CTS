"""CSRF для cookie-запросов: SameSite=Lax + проверка Origin (apps/accounts/csrf.py)."""

import pytest

from apps.core.testing import FRONTEND_ORIGIN, browser

from .factories import DEFAULT_PASSWORD

pytestmark = pytest.mark.django_db

LOGIN = "/api/v1/auth/login/"
# меняющий запрос с авторизацией; для подтверждённого пользователя ничего не делает и отвечает 200
UNSAFE = "/api/v1/auth/verify/resend/"
ME = "/api/v1/auth/me/"
EVIL = "https://evil.example"


def logged_in(user, origin=FRONTEND_ORIGIN):
    client = browser(origin)
    resp = client.post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")
    assert resp.status_code == 200, resp.data
    return client


def test_foreign_origin_rejected(user):
    client = logged_in(user)

    resp = client.post(UNSAFE, HTTP_ORIGIN=EVIL)

    assert resp.status_code == 403
    assert resp.data["code"] == "csrf_failed"


def test_trusted_origin_passes(user):
    client = logged_in(user)

    resp = client.post(UNSAFE)

    assert resp.status_code == 200


def test_trusted_origin_with_trailing_slash_and_case(user):
    client = logged_in(user)
    resp = client.post(UNSAFE, HTTP_ORIGIN="HTTP://LOCALHOST:3000")
    assert resp.status_code == 200


def test_get_without_origin_passes_like_nextjs_ssr(user):
    """SSR Next.js запрашивает /auth/me/ сервером: только Cookie, без Origin."""
    client = logged_in(user)
    ssr = browser(origin=None)
    ssr.cookies = client.cookies

    resp = ssr.get(ME)

    assert resp.status_code == 200
    assert resp.data["nick"] == user.nickname


def test_unsafe_request_with_cookie_and_without_origin_rejected(user):
    client = logged_in(user)
    no_origin = browser(origin=None)
    no_origin.cookies = client.cookies

    resp = no_origin.post(UNSAFE)

    assert resp.status_code == 403 and resp.data["code"] == "csrf_failed"


def test_referer_used_when_origin_missing(user):
    client = logged_in(user)
    no_origin = browser(origin=None)
    no_origin.cookies = client.cookies

    resp = no_origin.post(UNSAFE, HTTP_REFERER=f"{FRONTEND_ORIGIN}/verify")

    assert resp.status_code == 200


def test_origin_null_rejected(user):
    client = logged_in(user)
    resp = client.post(UNSAFE, HTTP_ORIGIN="null")
    assert resp.status_code == 403


def test_bearer_header_is_not_subject_to_origin_check(user):
    """Токен в заголовке Authorization браузер сам не подставит — CSRF невозможен."""
    client = logged_in(user)
    token = client.cookies["access"].value
    script = browser(origin=None)

    resp = script.post(UNSAFE, HTTP_AUTHORIZATION=f"Bearer {token}")

    assert resp.status_code == 200


def test_refresh_and_logout_check_origin(user):
    client = logged_in(user)

    assert client.post("/api/v1/auth/refresh/", HTTP_ORIGIN=EVIL).status_code == 403
    assert client.post("/api/v1/auth/logout/", HTTP_ORIGIN=EVIL).status_code == 403
    assert client.post("/api/v1/auth/refresh/").status_code == 200


def test_login_from_foreign_origin_rejected(user):
    resp = browser(EVIL).post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")
    assert resp.status_code == 403 and resp.data["code"] == "csrf_failed"


def test_login_without_origin_allowed_for_scripts(user):
    resp = browser(origin=None).post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")
    assert resp.status_code == 200


def test_trusted_origins_come_from_settings(user, settings):
    settings.CSRF_TRUSTED_ORIGINS = ["https://cts.gg"]
    client = logged_in(user, origin="https://cts.gg")

    assert client.post(UNSAFE).status_code == 200
    assert client.post(UNSAFE, HTTP_ORIGIN=FRONTEND_ORIGIN).status_code == 403


# ───── cookie ─────


@pytest.mark.parametrize(("debug", "secure"), [(True, ""), (False, True)])
def test_cookie_secure_only_off_in_debug(user, settings, debug, secure):
    settings.DEBUG = debug

    resp = browser().post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")

    for name in ("access", "refresh"):
        cookie = resp.cookies[name]
        assert cookie["secure"] == secure
        assert cookie["httponly"] is True
        assert cookie["samesite"] == "Lax"
        assert cookie["path"] == "/"


def test_no_csrftoken_cookie_needed(user):
    resp = browser().post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")
    assert "csrftoken" not in resp.cookies


# ───── SSR Next.js после истечения access: GET по refresh-cookie ─────


def only_refresh(client):
    ssr = browser(origin=None)
    ssr.cookies["refresh"] = client.cookies["refresh"].value
    return ssr


def test_get_with_only_refresh_cookie_authenticates(user):
    ssr = only_refresh(logged_in(user))

    resp = ssr.get(ME)

    assert resp.status_code == 200 and resp.data["nick"] == user.nickname


def test_unsafe_with_only_refresh_cookie_is_401(user):
    client = logged_in(user)
    no_access = browser()
    no_access.cookies["refresh"] = client.cookies["refresh"].value

    resp = no_access.post(UNSAFE)

    assert resp.status_code == 401  # браузер обновит access через /auth/refresh/ и повторит


def test_rotated_refresh_does_not_authenticate(user):
    client = logged_in(user)
    old = only_refresh(client)
    client.post("/api/v1/auth/refresh/")

    assert old.get(ME).status_code == 401


def test_refresh_of_revoked_session_does_not_authenticate(user):
    client = logged_in(user)
    ssr = only_refresh(client)
    client.post("/api/v1/auth/logout/")

    assert ssr.get(ME).status_code == 401


def test_invalid_bearer_does_not_fall_back_to_refresh(user):
    client = logged_in(user)
    ssr = only_refresh(client)

    assert ssr.get(ME, HTTP_AUTHORIZATION="Bearer garbage").status_code == 401
