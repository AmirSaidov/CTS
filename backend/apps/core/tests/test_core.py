import pytest

pytestmark = pytest.mark.django_db


def test_request_id_header_generated_and_reused(api):
    assert len(api.get("/healthz")["X-Request-ID"]) == 32
    assert api.get("/healthz", HTTP_X_REQUEST_ID="abc-12345678")["X-Request-ID"] == "abc-12345678"


def test_healthz_and_readyz(api):
    assert api.get("/healthz").json() == {"status": "ok"}
    resp = api.get("/readyz")
    assert resp.status_code == 200
    assert resp.json()["checks"]["db"] is True


def test_404_in_error_format(api):
    resp = api.get("/api/v1/auth/me/nope/")
    assert resp.status_code == 404


def test_method_not_allowed_in_error_format(api):
    resp = api.delete("/api/v1/games/")
    assert resp.status_code == 405
    assert resp.data["code"] == "method_not_allowed"
    assert resp.data["message"]


def test_maintenance_mode(api, settings):
    settings.MAINTENANCE_MODE = True
    settings.MAINTENANCE_UNTIL = "2026-10-03T12:00:00Z"

    resp = api.get("/api/v1/games/")

    assert resp.status_code == 503
    assert resp.json() == {"code": "maintenance", "message": "Идут технические работы", "until": "2026-10-03T12:00:00Z"}
    assert api.get("/healthz").status_code == 200


def test_openapi_schema_builds(api):
    resp = api.get("/api/v1/schema/")
    assert resp.status_code == 200
    assert b"/api/v1/auth/login/" in resp.content


def test_accept_language_en(api, user):
    resp = api.post(
        "/api/v1/auth/login/", {"login": user.email, "password": "x"}, format="json", HTTP_ACCEPT_LANGUAGE="en"
    )
    assert resp.data["code"] == "invalid_credentials"
