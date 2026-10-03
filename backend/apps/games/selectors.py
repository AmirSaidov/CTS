from django.db.models import Prefetch, QuerySet

from .models import BracketFormat, Game


def public_games() -> QuerySet[Game]:
    """Игры для каталога и онбординга: без выключенных, с включёнными форматами."""
    return Game.objects.exclude(status=Game.Status.OFF).prefetch_related(
        Prefetch("formats", queryset=BracketFormat.objects.filter(enabled=True))
    )
