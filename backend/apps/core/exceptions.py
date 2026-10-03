"""
Единый формат ошибок API (раздел 6):
{"code": "plan_limit_reached", "message": "…", "fields": {"email": ["Уже занят"]}}
"""

from typing import Any

from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class ApiError(exceptions.APIException):
    """Бизнес-ошибка со стабильным кодом для фронта."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    default_code = "error"
    default_detail = _("Ошибка запроса")

    def __init__(
        self,
        code: str | None = None,
        message: Any = None,
        status_code: int | None = None,
        fields: dict[str, list[str]] | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(detail=message or self.default_detail, code=code or self.default_code)
        self.code = code or self.default_code
        if status_code:
            self.status_code = status_code
        self.fields = fields
        self.extra = extra or {}


class Conflict(ApiError):
    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"
    default_detail = _("Данные уже изменены, обновите страницу")


class Gone(ApiError):
    status_code = status.HTTP_410_GONE
    default_code = "gone"
    default_detail = _("Ссылка устарела")


class TooManyRequests(ApiError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_code = "rate_limited"
    default_detail = _("Слишком много попыток, попробуйте позже")


_DEFAULT_CODES = {
    400: "validation_error",
    401: "not_authenticated",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    415: "unsupported_media_type",
    429: "rate_limited",
}


def _flatten(detail: Any) -> list[str]:
    if isinstance(detail, list):
        return [x for item in detail for x in _flatten(item)]
    if isinstance(detail, dict):
        return [x for item in detail.values() for x in _flatten(item)]
    return [str(detail)]


def _fields(detail: dict[str, Any]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for key, value in detail.items():
        if isinstance(value, dict):
            # вложенные сериализаторы: {"socials": {"twitch": [...]}} → {"socials.twitch": [...]}
            for sub_key, sub_value in _fields(value).items():
                out[f"{key}.{sub_key}"] = sub_value
        else:
            out[key] = _flatten(value)
    return out


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    response = drf_exception_handler(exc, context)
    if response is None:
        return None  # 500 — отдаёт ApiServerErrorMiddleware

    body: dict[str, Any]
    if isinstance(exc, ApiError):
        body = {"code": exc.code, "message": str(exc.detail)}
        if exc.fields:
            body["fields"] = exc.fields
        body.update(exc.extra)
    elif isinstance(exc, exceptions.ValidationError):
        detail = exc.detail
        codes = exc.get_codes()
        body = {"code": "validation_error", "message": str(_("Проверьте поля"))}
        if isinstance(detail, dict):
            detail = dict(detail)
            non_field = detail.pop("non_field_errors", None)
            if non_field:
                body["message"] = _flatten(non_field)[0]
                if isinstance(codes, dict) and codes.get("non_field_errors"):
                    body["code"] = _flatten(codes["non_field_errors"])[0]
            if detail:
                body["fields"] = _fields(detail)
        else:
            body["message"] = _flatten(detail)[0]
    else:
        codes = exc.get_codes() if isinstance(exc, exceptions.APIException) else None
        code = codes if isinstance(codes, str) else _DEFAULT_CODES.get(response.status_code, "error")
        other_detail = getattr(exc, "detail", None)
        body = {"code": code, "message": _flatten(other_detail)[0] if other_detail else ""}
        wait = getattr(exc, "wait", None)
        if isinstance(exc, exceptions.Throttled) and wait:
            body["retry_after"] = int(wait)

    response.data = body
    return response
