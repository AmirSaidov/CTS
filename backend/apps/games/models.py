"""Справочники: игры, форматы сетки, шаблоны регламентов. Редактируются из админки (экран 52)."""

from django.db import models
from django.db.models import Q

from apps.core.models import TimeStampedModel


class AccountProvider(models.TextChoices):
    RIOT = "riot", "Riot ID"
    STEAM = "steam", "Steam"
    DISCORD = "discord", "Discord"
    TELEGRAM = "telegram", "Telegram"
    MANUAL = "manual", "Вручную"


class Game(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Активна"
        BETA = "beta", "Бета"
        OFF = "off", "Выключена"

    name = models.CharField("название", max_length=64)
    slug = models.SlugField("slug", max_length=32, unique=True)
    short = models.CharField("сокращение", max_length=4, help_text="Для логотипа-заглушки: VL, CS")
    publisher = models.CharField("издатель", max_length=64, blank=True)
    team_size = models.PositiveSmallIntegerField("игроков в основе", default=5)
    max_subs = models.PositiveSmallIntegerField("максимум запасных", default=2)
    account_provider = models.CharField(
        "проверка аккаунта", max_length=16, choices=AccountProvider.choices, default=AccountProvider.MANUAL
    )
    status = models.CharField("статус", max_length=8, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    art = models.ImageField("арт", upload_to="games/", blank=True)
    maps = models.JSONField("карты", default=list, blank=True)
    order = models.PositiveSmallIntegerField("порядок", default=0)

    class Meta:
        verbose_name = "игра"
        verbose_name_plural = "игры"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name


class BracketFormat(TimeStampedModel):
    class Code(models.TextChoices):
        SINGLE = "single", "Single Elimination"
        DOUBLE = "double", "Double Elimination"
        GROUPS = "groups", "Группы + плей-офф"
        SWISS = "swiss", "Швейцарская система"
        LEAGUE = "league", "Круговая лига"

    code = models.CharField("код", max_length=16, choices=Code.choices, unique=True)
    name = models.CharField("название", max_length=64)
    enabled = models.BooleanField("включён", default=True)
    is_beta = models.BooleanField("бета", default=False)
    games = models.ManyToManyField(Game, related_name="formats", blank=True, verbose_name="игры")
    order = models.PositiveSmallIntegerField("порядок", default=0)

    class Meta:
        verbose_name = "формат сетки"
        verbose_name_plural = "форматы сетки"
        ordering = ["order"]

    def __str__(self) -> str:
        return self.name


class RulesTemplate(TimeStampedModel):
    """Шаблон регламента с историей версий: текущая версия у игры одна."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="rules_templates", verbose_name="игра")
    title = models.CharField("название", max_length=128)
    body = models.JSONField("разделы", default=list, help_text='[{"title": "1. Общие положения", "body": "…"}]')
    version = models.PositiveIntegerField("версия", default=1)
    is_current = models.BooleanField("текущая", default=True)

    class Meta:
        verbose_name = "шаблон регламента"
        verbose_name_plural = "шаблоны регламентов"
        ordering = ["game", "-version"]
        constraints = [
            models.UniqueConstraint(fields=["game", "version"], name="rules_template_game_version"),
            models.UniqueConstraint(fields=["game"], condition=Q(is_current=True), name="rules_template_one_current"),
        ]

    def __str__(self) -> str:
        return f"{self.game} · v{self.version}"
