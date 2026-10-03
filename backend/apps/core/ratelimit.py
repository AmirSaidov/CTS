"""Rate-limit на кэше (Redis в проде): счётчик попыток в скользящем окне."""

from datetime import timedelta

from django.core.cache import cache


def _key(scope: str, ident: str) -> str:
    return f"rl:{scope}:{ident.lower()}"


def hits(scope: str, ident: str) -> int:
    return int(cache.get(_key(scope, ident), 0))


def hit(scope: str, ident: str, window: timedelta) -> int:
    key = _key(scope, ident)
    timeout = int(window.total_seconds())
    if cache.add(key, 1, timeout=timeout):
        return 1
    try:
        return int(cache.incr(key))
    except ValueError:  # ключ истёк между add и incr
        cache.set(key, 1, timeout=timeout)
        return 1


def reset(scope: str, ident: str) -> None:
    cache.delete(_key(scope, ident))


def exceeded(scope: str, ident: str, limit: int) -> bool:
    return hits(scope, ident) >= limit
