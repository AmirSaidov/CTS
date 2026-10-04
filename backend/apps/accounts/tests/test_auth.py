import re
from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import LegalConsent, User, UserSession, VerificationCode
from apps.core.testing import browser
from apps.orgs.models import OrgMember

from .factories import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db

REGISTER = "/api/v1/auth/register/"
LOGIN = "/api/v1/auth/login/"
ME = "/api/v1/auth/me/"
REFRESH = "/api/v1/auth/refresh/"
LOGOUT = "/api/v1/auth/logout/"
VERIFY = "/api/v1/auth/verify/"
RESEND = "/api/v1/auth/verify/resend/"
FORGOT = "/api/v1/auth/password/forgot/"
RESET = "/api/v1/auth/password/reset/"


def claims(client) -> dict:
    return dict(AccessToken(client.cookies["access"].value).payload)


def last_code() -> str:
    return re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)


def register(api, django_capture_on_commit_callbacks, **overrides):
    body = {"role": "player", "nick": "Aktan", "email": "Aktan@Mail.kg", "password": "Str0ng!pass", "terms": True}
    body.update(overrides)
    with django_capture_on_commit_callbacks(execute=True):
        return api.post(REGISTER, body, format="json")


# ───── регистрация ─────


def test_register_player_logs_in_and_sends_code(api, seeded, django_capture_on_commit_callbacks):
    resp = register(api, django_capture_on_commit_callbacks)

    assert resp.status_code == 201
    assert resp.data == {"ok": True}
    user = User.objects.get()
    assert user.email == "aktan@mail.kg"
    assert not user.email_verified
    assert set(LegalConsent.objects.values_list("document", flat=True)) == {"terms", "privacy"}
    assert len(mail.outbox) == 1 and mail.outbox[0].to == ["aktan@mail.kg"]
    expected = {"is_player": True, "is_organizer": False, "is_platform_admin": False, "email_verified": False}
    assert claims(api).items() >= expected.items()
    assert resp.cookies["access"]["httponly"] and resp.cookies["refresh"]["httponly"]
    assert resp.cookies["refresh"]["path"] == "/"  # proxy.ts читает refresh на страницах


def test_register_organizer_creates_org(api, seeded, django_capture_on_commit_callbacks):
    resp = register(api, django_capture_on_commit_callbacks, role="organizer", nick="CyberClub")

    assert resp.status_code == 201
    member = OrgMember.objects.select_related("organization").get()
    assert member.role == "owner" and member.organization.slug == "cyberclub"
    assert claims(api)["is_organizer"] is True


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"nick": "ab"}, "nick"),
        ({"nick": "кириллица"}, "nick"),
        ({"nick": "Admin"}, "nick"),
        ({"password": "onlyletters"}, "password"),
        ({"password": "N0special1"}, "password"),
        ({"terms": False}, "terms"),
        ({"email": "not-an-email"}, "email"),
    ],
)
def test_register_validation(api, seeded, django_capture_on_commit_callbacks, overrides, field):
    resp = register(api, django_capture_on_commit_callbacks, **overrides)

    assert resp.status_code == 400
    assert resp.data["code"] == "validation_error"
    assert field in resp.data["fields"]


def test_register_nick_and_email_unique_case_insensitive(api, seeded, django_capture_on_commit_callbacks):
    UserFactory(nickname="Aktan", email="aktan@mail.kg")

    resp = register(api, django_capture_on_commit_callbacks, nick="AKTAN", email="AKTAN@mail.kg")

    assert resp.status_code == 400
    assert set(resp.data["fields"]) == {"nick", "email"}


def test_nick_available(api, user):
    url = "/api/v1/auth/nick-available/"
    assert api.get(url, {"nick": user.nickname.upper()}).data == {"available": False}
    assert api.get(url, {"nick": "free_nick"}).data == {"available": True}
    assert api.get(url, {"nick": "cts"}).data == {"available": False}
    assert api.get(url, {"nick": "a b"}).data == {"available": False}


# ───── вход ─────


@pytest.mark.parametrize("by", ["email", "nickname"])
def test_login_by_email_or_nick(api, user, by):
    resp = api.post(LOGIN, {"login": getattr(user, by).upper(), "password": DEFAULT_PASSWORD}, format="json")

    assert resp.status_code == 200
    assert UserSession.objects.filter(user=user, revoked_at__isnull=True).count() == 1
    assert api.get(ME).data["nick"] == user.nickname


def test_login_wrong_password_single_error(api, user):
    wrong_pass = api.post(LOGIN, {"login": user.email, "password": "nope"}, format="json")
    unknown = api.post(LOGIN, {"login": "ghost@example.com", "password": "nope"}, format="json")

    assert wrong_pass.status_code == unknown.status_code == 400
    assert wrong_pass.data["code"] == unknown.data["code"] == "invalid_credentials"


def test_login_rate_limited_after_5_failures(api, user):
    for _ in range(5):
        api.post(LOGIN, {"login": user.email, "password": "nope"}, format="json")

    resp = api.post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")

    assert resp.status_code == 429
    assert resp.data["code"] == "too_many_attempts"


def test_login_blocked_user(api):
    user = UserFactory(is_active=False)
    resp = api.post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD}, format="json")
    assert resp.status_code == 403
    assert resp.data["code"] == "account_blocked"


def test_login_without_remember_sets_session_refresh_cookie(api, user):
    resp = api.post(LOGIN, {"login": user.email, "password": DEFAULT_PASSWORD, "remember": False}, format="json")
    assert resp.cookies["refresh"]["max-age"] == ""
    assert resp.cookies["access"]["max-age"] == 900


# ───── /auth/me/ ─────


def test_me_requires_auth(api):
    resp = api.get(ME)
    assert resp.status_code == 401
    assert resp.data["code"] == "not_authenticated"


def test_me_with_expired_or_garbage_cookie_is_401_not_500(api):
    api.cookies["access"] = "garbage"
    assert api.get(ME).status_code == 401


def test_me_shape_for_organizer(api, seeded, login):
    from apps.orgs.services import create_organization

    user = UserFactory(default_role=User.DefaultRole.ORG)
    create_organization(owner=user, name="Club")
    login(user)

    data = api.get(ME).data

    assert data["is_organizer"] is True
    assert data["default_cabinet"] == "org"
    assert data["org"]["role"] == "owner"
    assert data["org"]["plan"] == "free"
    assert data["org"]["permissions"] == [
        "tournaments.manage",
        "applications.decide",
        "results.edit",
        "disputes.resolve",
    ]
    # ТЗ, 14.1: из лимитов остались только активные турниры
    assert data["org"]["limits"] == {"tournaments": [0, 3]}
    assert "timezone" not in data and "games" not in data


# ───── подтверждение почты ─────


def test_verify_email_flow(api, seeded, django_capture_on_commit_callbacks):
    register(api, django_capture_on_commit_callbacks)

    wrong = api.post(VERIFY, {"code": "000000" if last_code() != "000000" else "111111"}, format="json")
    assert wrong.status_code == 400 and wrong.data["code"] == "invalid_code"

    ok = api.post(VERIFY, {"code": last_code()}, format="json")
    assert ok.status_code == 200
    assert User.objects.get().email_verified
    assert claims(api)["email_verified"] is True  # новый access для proxy.ts


def test_verify_code_attempts_limit(api, seeded, django_capture_on_commit_callbacks):
    register(api, django_capture_on_commit_callbacks)
    code = last_code()
    bad = "000000" if code != "000000" else "111111"
    for _ in range(5):
        api.post(VERIFY, {"code": bad}, format="json")

    resp = api.post(VERIFY, {"code": code}, format="json")

    assert resp.status_code == 429
    assert VerificationCode.objects.get().attempts == 5


def test_verify_code_expired(api, seeded, django_capture_on_commit_callbacks):
    register(api, django_capture_on_commit_callbacks)
    VerificationCode.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

    resp = api.post(VERIFY, {"code": last_code()}, format="json")

    assert resp.status_code == 400 and resp.data["code"] == "code_expired"


def test_resend_not_more_than_once_a_minute(api, seeded, django_capture_on_commit_callbacks):
    register(api, django_capture_on_commit_callbacks)

    too_soon = api.post(RESEND)
    assert too_soon.status_code == 429 and too_soon.data["code"] == "resend_too_soon"

    VerificationCode.objects.update(created_at=timezone.now() - timedelta(seconds=61))
    assert api.post(RESEND).status_code == 200
    assert len(mail.outbox) == 2
    # старый код больше не работает
    assert VerificationCode.objects.filter(used_at__isnull=True).count() == 1


# ───── refresh и выход ─────


def test_refresh_rotates_and_blacklists_old(api, user, login):
    login(user)
    old_refresh = api.cookies["refresh"].value

    resp = api.post(REFRESH)
    assert resp.status_code == 200
    assert api.cookies["refresh"].value != old_refresh

    replay = browser()
    replay.cookies["refresh"] = old_refresh
    resp = replay.post(REFRESH)
    assert resp.status_code == 401 and resp.data["code"] == "token_invalid"


def test_refresh_picks_up_new_claims(api, user, login):
    login(user)
    User.objects.filter(pk=user.pk).update(is_staff=True)

    api.post(REFRESH)

    assert claims(api)["is_platform_admin"] is True


def test_logout_revokes_session_immediately(api, user, login):
    login(user)
    access = api.cookies["access"].value
    refresh = api.cookies["refresh"].value

    assert api.post(LOGOUT).status_code == 200

    stale = browser()
    stale.cookies["access"] = access
    assert stale.get(ME).status_code == 401  # access ещё не истёк, но сессия отозвана
    stale.cookies["refresh"] = refresh
    assert stale.post(REFRESH).status_code == 401


# ───── восстановление пароля ─────


def test_forgot_always_200(api, user):
    assert api.post(FORGOT, {"email": "ghost@example.com"}, format="json").status_code == 200
    assert len(mail.outbox) == 0
    assert api.post(FORGOT, {"email": user.email}, format="json").status_code == 200
    assert len(mail.outbox) == 1
    assert "/reset/" in mail.outbox[0].body


def test_reset_password_once_and_revokes_sessions(api, user, login):
    login(user)
    browser().post(FORGOT, {"email": user.email}, format="json")
    token = re.search(r"/reset/(\S+)", mail.outbox[-1].body).group(1)

    resp = browser().post(RESET, {"token": token, "password": "N3w!password"}, format="json")
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.check_password("N3w!password")
    assert api.get(ME).status_code == 401  # старые сессии завершены

    again = browser().post(RESET, {"token": token, "password": "An0ther!pass"}, format="json")
    assert again.status_code == 410 and again.data["code"] == "reset_link_expired"


def test_reset_weak_password(api, user):
    api.post(FORGOT, {"email": user.email}, format="json")
    token = re.search(r"/reset/(\S+)", mail.outbox[-1].body).group(1)

    resp = api.post(RESET, {"token": token, "password": "weak"}, format="json")

    assert resp.status_code == 400 and "password" in resp.data["fields"]


def test_reset_garbage_token(api):
    resp = api.post(RESET, {"token": "garbage", "password": "N3w!password"}, format="json")
    assert resp.status_code == 410


# ───── онбординг убран (ТЗ, 14.1) ─────


def test_onboarding_endpoint_removed(api, user, login):
    login(user)
    assert api.patch("/api/v1/me/onboarding/", {"city": "Ош"}, format="json").status_code == 404
