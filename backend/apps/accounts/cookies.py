from typing import Any

from django.conf import settings
from django.http import HttpResponse
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


def _cfg() -> dict[str, Any]:
    return settings.JWT_COOKIE


def _common() -> dict[str, Any]:
    cfg = _cfg()
    return {
        # без Secure — только в разработке (DEBUG=True), иначе браузер не отдаст cookie по http://localhost
        "secure": not settings.DEBUG,
        "httponly": True,
        "samesite": cfg["SAMESITE"],
        "domain": cfg["DOMAIN"],
    }


def set_access_cookie(response: HttpResponse, access: AccessToken) -> None:
    lifetime = settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"]
    response.set_cookie(
        _cfg()["ACCESS_NAME"], str(access), max_age=int(lifetime.total_seconds()), path="/", **_common()
    )


def set_auth_cookies(response: HttpResponse, refresh: RefreshToken) -> None:
    set_access_cookie(response, refresh.access_token)
    # без «Запомнить меня» refresh живёт до закрытия браузера (cookie без max-age)
    remember = bool(refresh.get("remember", True))
    lifetime = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    response.set_cookie(
        _cfg()["REFRESH_NAME"],
        str(refresh),
        max_age=int(lifetime.total_seconds()) if remember else None,
        path=_cfg()["REFRESH_PATH"],
        **_common(),
    )


def clear_auth_cookies(response: HttpResponse) -> None:
    cfg = _cfg()
    response.delete_cookie(cfg["ACCESS_NAME"], path="/", domain=cfg["DOMAIN"], samesite=cfg["SAMESITE"])
    response.delete_cookie(
        cfg["REFRESH_NAME"], path=cfg["REFRESH_PATH"], domain=cfg["DOMAIN"], samesite=cfg["SAMESITE"]
    )
