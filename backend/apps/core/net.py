from django.conf import settings
from django.http import HttpRequest


def client_ip(request: HttpRequest) -> str:
    """IP клиента. X-Forwarded-For учитываем только от доверенного прокси (Next.js / балансировщик)."""
    remote = request.META.get("REMOTE_ADDR", "")
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded and remote in settings.TRUSTED_PROXY_IPS:
        return forwarded.split(",")[0].strip()
    return remote
