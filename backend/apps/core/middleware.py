import logging
import re
import uuid

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.translation import gettext as _

from .context import request_id_var, user_id_var

logger = logging.getLogger("cts.request")

_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")


class ApiTrailingSlashMiddleware:
    """
    /api/v1/plans → /api/v1/plans/ внутри, без редиректа.

    Next.js по умолчанию срезает завершающий слэш (308) до rewrite в Django, и запрос приходит без него.
    Редирект APPEND_SLASH давал бы бесконечный цикл 308 ↔ 301, а для POST — 500.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.path_info.startswith("/api/") and not request.path_info.endswith("/"):
            request.path_info += "/"
            request.path += "/"
        return self.get_response(request)


class RequestIdMiddleware:
    """X-Request-ID в каждом ответе; входящий id (от прокси фронта) переиспользуется."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        incoming = request.headers.get("X-Request-ID", "")
        request_id = incoming if _REQUEST_ID_RE.match(incoming) else uuid.uuid4().hex
        request.request_id = request_id  # type: ignore[attr-defined]
        token = request_id_var.set(request_id)
        user_token = user_id_var.set("-")
        try:
            response = self.get_response(request)
        finally:
            request_id_var.reset(token)
            user_id_var.reset(user_token)
        response["X-Request-ID"] = request_id
        return response


class MaintenanceMiddleware:
    """Режим техработ (экран 56): API отвечает 503 с временем окончания."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if settings.MAINTENANCE_MODE and request.path.startswith("/api/"):
            return JsonResponse(
                {"code": "maintenance", "message": _("Идут технические работы"), "until": settings.MAINTENANCE_UNTIL},
                status=503,
            )
        return self.get_response(request)


class ApiServerErrorMiddleware:
    """Непойманные исключения под /api/ → JSON 500 с request_id (его видит пользователь на экране 55)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        return self.get_response(request)

    def process_exception(self, request: HttpRequest, exception: Exception) -> HttpResponse | None:
        if not request.path.startswith("/api/") or settings.DEBUG:
            return None
        logger.exception("unhandled_error", extra={"data": {"path": request.path}})
        return JsonResponse(
            {
                "code": "server_error",
                "message": _("Ошибка сервера"),
                "request_id": getattr(request, "request_id", None),
            },
            status=500,
        )
