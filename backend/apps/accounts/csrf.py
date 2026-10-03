"""
CSRF-защита запросов с cookie (раздел 11) без токена: cookie SameSite=Lax + проверка Origin.

- Безопасные методы (GET, HEAD, OPTIONS) не проверяются: SSR Next.js ходит GET-запросами
  с cookie пользователя и без Origin.
- Меняющие данные запросы с cookie должны прийти с Origin (или Referer) из CSRF_TRUSTED_ORIGINS.
  Браузер всегда шлёт Origin на POST/PUT/PATCH/DELETE; прокси Next.js его пробрасывает.
"""

from urllib.parse import urlsplit

from django.conf import settings
from django.http import HttpRequest
from django.utils.translation import gettext as _
from rest_framework.exceptions import PermissionDenied

SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})


def _origin_of(url: str) -> str | None:
    parts = urlsplit(url)
    if not parts.scheme or not parts.netloc:
        return None
    return f"{parts.scheme}://{parts.netloc}".lower()


def request_origin(request: HttpRequest) -> str | None:
    origin = request.headers.get("Origin")
    if origin and origin != "null":
        return origin.rstrip("/").lower()
    referer = request.headers.get("Referer")
    return _origin_of(referer) if referer else None


def trusted_origins() -> set[str]:
    return {o.rstrip("/").lower() for o in settings.CSRF_TRUSTED_ORIGINS}


def enforce_origin(request: HttpRequest) -> None:
    """403 csrf_failed, если меняющий запрос с cookie пришёл не с доверенного адреса."""
    if request.method in SAFE_METHODS:
        return
    origin = request_origin(request)
    if origin is None:
        raise PermissionDenied(detail=_("Запрос без заголовка Origin отклонён"), code="csrf_failed")
    if origin not in trusted_origins():
        raise PermissionDenied(detail=_("Запрос с чужого адреса отклонён"), code="csrf_failed")


def reject_foreign_origin(request: HttpRequest) -> None:
    """Для входа и регистрации (cookie ещё нет): чужой Origin — отказ, без Origin — пропускаем (скрипты, тесты)."""
    origin = request_origin(request)
    if origin is not None and origin not in trusted_origins():
        raise PermissionDenied(detail=_("Запрос с чужого адреса отклонён"), code="csrf_failed")
