"""Помощники для тестов, общие для всех приложений."""

from rest_framework.test import APIClient

FRONTEND_ORIGIN = "http://localhost:3000"


def browser(origin: str | None = FRONTEND_ORIGIN) -> APIClient:
    """Клиент как браузер на странице фронта: шлёт Origin (через прокси Next.js он сохраняется)."""
    return APIClient(HTTP_ORIGIN=origin) if origin else APIClient()
