from apps.accounts.models import User

from .models import Organization, OrgMember


def primary_membership(user: User) -> OrgMember | None:
    """Пока у пользователя одна организация (раздел 13.2) — берём самую раннюю."""
    return (
        OrgMember.objects.select_related("organization")
        .filter(user=user, organization__deleted_at__isnull=True)
        .order_by("created_at")
        .first()
    )


def usage(org: Organization) -> dict[str, int]:
    """Использование лимитов тарифа. Активные турниры подключатся с приложением tournaments (этап 4)."""
    return {"active_tournaments": 0}
