import pytest
from django.core.cache import cache
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.accounts.tests.factories import DEFAULT_PASSWORD, UserFactory
from apps.core.testing import FRONTEND_ORIGIN, browser


@pytest.fixture(autouse=True)
def _clean_cache():
    cache.clear()  # rate-limit счётчики не должны протекать между тестами
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def _settings(settings):
    settings.MAINTENANCE_MODE = False
    settings.CSRF_TRUSTED_ORIGINS = [FRONTEND_ORIGIN]


@pytest.fixture
def seeded(db):
    call_command("seed", verbosity=0)


@pytest.fixture
def api() -> APIClient:
    return browser()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def login(api):
    """Войти через API (cookie сохраняются в клиенте)."""

    def _login(user, password=DEFAULT_PASSWORD, client=None):
        client = client or api
        resp = client.post(
            "/api/v1/auth/login/", {"login": user.email, "password": password, "remember": True}, format="json"
        )
        assert resp.status_code == 200, resp.data
        return client

    return _login
