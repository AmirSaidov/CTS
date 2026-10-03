from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import HttpRequest, JsonResponse


def healthz(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})


def readyz(request: HttpRequest) -> JsonResponse:
    """Готовность: БД, кэш (Redis), брокер Celery."""
    checks: dict[str, bool] = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks["db"] = True
    except Exception:
        checks["db"] = False
    try:
        cache.set("readyz", "1", 5)
        checks["cache"] = cache.get("readyz") == "1"
    except Exception:
        checks["cache"] = False
    if not settings.CELERY_TASK_ALWAYS_EAGER:
        try:
            from config.celery import app

            with app.connection_for_write() as conn:
                conn.ensure_connection(max_retries=1, timeout=2)
            checks["celery_broker"] = True
        except Exception:
            checks["celery_broker"] = False
    ok = all(checks.values())
    return JsonResponse({"status": "ok" if ok else "fail", "checks": checks}, status=200 if ok else 503)
