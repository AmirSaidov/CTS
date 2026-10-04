"""
Тарифы и подписки (раздел 9). Лимиты лежат в Plan.limits и редактируются из админки —
в коде только plan.limit("active_tournaments") и plan.allows("formats", ...).
По ТЗ, 14.1 лимитов два: активные турниры и форматы сетки. Оплаты нет (14.3) —
тариф организации меняет команда CTS в /admin/ через Subscription.
Деньги — в тыйынах целым числом + код валюты.
"""

from typing import Any

from django.db import models
from django.db.models import Q

from apps.core.models import TimeStampedModel

FREE_PLAN_CODE = "free"


class Plan(TimeStampedModel):
    class Code(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"
        LEAGUE = "league", "Лига"

    code = models.CharField("код", max_length=16, choices=Code.choices, unique=True)
    name = models.CharField("название", max_length=32)
    tier = models.CharField("метка уровня", max_length=16, blank=True, help_text="Tier-00")
    tagline = models.CharField("подзаголовок", max_length=160, blank=True)
    cta = models.CharField("текст кнопки", max_length=48, blank=True)
    recommended = models.BooleanField("рекомендуемый", default=False)
    price_month = models.PositiveIntegerField("цена за месяц, тыйын", null=True, blank=True)
    price_year = models.PositiveIntegerField("цена за год, тыйын", null=True, blank=True)
    currency = models.CharField("валюта", max_length=3, default="KGS")
    limits = models.JSONField(
        "лимиты и возможности",
        default=dict,
        blank=True,
        help_text='{"active_tournaments": 3, "formats": ["single", "double", "groups"]}; null — без лимита',
    )
    features = models.JSONField("пункты для страницы тарифов", default=list, blank=True)
    is_active = models.BooleanField("активен", default=True)
    order = models.PositiveSmallIntegerField("порядок", default=0)

    class Meta:
        verbose_name = "тариф"
        verbose_name_plural = "тарифы"
        ordering = ["order"]

    def __str__(self) -> str:
        return self.name

    def limit(self, name: str) -> int | None:
        """Числовой лимит; None — без лимита."""
        value = self.limits.get(name)
        return None if value is None else int(value)

    def allows(self, name: str, value: Any) -> bool:
        """Разрешено ли значение из списка (например, формат сетки). Отсутствие списка — разрешено всё."""
        allowed = self.limits.get(name)
        return allowed is None or value in allowed

    def within_limit(self, name: str, used: int) -> bool:
        cap = self.limit(name)
        return cap is None or used < cap

    @property
    def year_discount_percent(self) -> int | None:
        if not self.price_month or not self.price_year:
            return None
        return round(100 - self.price_year * 100 / (self.price_month * 12))


class Subscription(TimeStampedModel):
    """Подписка организации. Активная — одна; без подписки организация на Free."""

    class Status(models.TextChoices):
        TRIALING = "trialing", "Пробный период"
        ACTIVE = "active", "Активна"
        PAST_DUE = "past_due", "Просрочена"
        CANCELED = "canceled", "Отменена"
        EXPIRED = "expired", "Истекла"

    class Period(models.TextChoices):
        MONTH = "month", "Месяц"
        YEAR = "year", "Год"

    LIVE_STATUSES = (Status.TRIALING, Status.ACTIVE, Status.PAST_DUE)

    organization = models.ForeignKey(
        "orgs.Organization", on_delete=models.CASCADE, related_name="subscriptions", verbose_name="организация"
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions", verbose_name="тариф")
    status = models.CharField("статус", max_length=16, choices=Status.choices, default=Status.ACTIVE)
    period = models.CharField("период", max_length=8, choices=Period.choices, default=Period.MONTH)
    current_period_end = models.DateTimeField("конец периода", null=True, blank=True)
    cancel_at = models.DateTimeField("отмена с", null=True, blank=True)
    provider_id = models.CharField("id у провайдера", max_length=128, blank=True)

    class Meta:
        verbose_name = "подписка"
        verbose_name_plural = "подписки"
        constraints = [
            models.UniqueConstraint(
                fields=["organization"],
                condition=Q(status__in=["trialing", "active", "past_due"]),
                name="subscription_one_live_per_org",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.organization} · {self.plan} · {self.status}"
