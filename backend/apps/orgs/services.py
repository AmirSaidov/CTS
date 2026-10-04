from django.db import transaction
from django.utils.text import slugify

from apps.accounts.models import User
from apps.billing.models import FREE_PLAN_CODE, Plan, Subscription
from apps.core.exceptions import ApiError

from .models import Organization, OrgMember, OrgRole


def unique_org_slug(base: str) -> str:
    root = slugify(base)[:40] or "org"
    slug, n = root, 2
    while Organization.objects.filter(slug=slug).exists():
        slug, n = f"{root}-{n}", n + 1
    return slug


@transaction.atomic
def create_organization(*, owner: User, name: str) -> Organization:
    """Организация с владельцем. Без подписки она на Free."""
    org = Organization.objects.create(name=name, slug=unique_org_slug(name), owner=owner)
    OrgMember.objects.create(organization=org, user=owner, role=OrgRole.OWNER)
    return org


def current_plan(org: Organization) -> Plan:
    sub = (
        Subscription.objects.select_related("plan")
        .filter(organization=org, status__in=Subscription.LIVE_STATUSES)
        .first()
    )
    if sub:
        return sub.plan
    return Plan.objects.get(code=FREE_PLAN_CODE)


def ensure_within_limit(org: Organization, limit: str, used: int) -> None:
    """Превышение лимита тарифа → 403 plan_limit_reached (фронт показывает модалку апгрейда)."""
    plan = current_plan(org)
    if not plan.within_limit(limit, used):
        raise ApiError(
            code="plan_limit_reached",
            message=f"Лимит тарифа {plan.name}: {limit} — {plan.limit(limit)}",
            status_code=403,
            extra={"limit": limit, "max": plan.limit(limit), "plan": plan.code},
        )


def ensure_format_allowed(org: Organization, bracket_format: str) -> None:
    """Формат сетки не входит в тариф → 403 plan_limit_reached."""
    plan = current_plan(org)
    if not plan.allows("formats", bracket_format):
        raise ApiError(
            code="plan_limit_reached",
            message=f"Формат недоступен на тарифе {plan.name}",
            status_code=403,
            extra={"limit": "formats", "plan": plan.code},
        )
