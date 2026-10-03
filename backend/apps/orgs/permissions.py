"""
Матрица прав сотрудников организации (экран 42) — одна таблица в коде.
Отдаётся фронту в /auth/me/ списком разрешений. Имена — как в frontend/src/shared/lib/permissions.ts фронта.
"""

from .models import OrgRole

OWNER, ADMIN, JUDGE, MOD = OrgRole.OWNER, OrgRole.ADMIN, OrgRole.JUDGE, OrgRole.MODERATOR

ORG_PERMISSIONS: dict[str, frozenset[str]] = {
    "tournaments.manage": frozenset({OWNER, ADMIN}),  # создавать и удалять турниры
    "applications.decide": frozenset({OWNER, ADMIN, MOD}),  # одобрять заявки
    "results.edit": frozenset({OWNER, ADMIN, JUDGE}),  # вносить и менять результаты
    "disputes.resolve": frozenset({OWNER, ADMIN, JUDGE}),  # решать споры
    "mailings.send": frozenset({OWNER, ADMIN}),  # рассылки
    "billing.manage": frozenset({OWNER}),  # подписка и оплата
    "staff.manage": frozenset({OWNER}),  # управлять командой организаторов
}


def role_has(role: str, permission: str) -> bool:
    return role in ORG_PERMISSIONS.get(permission, frozenset())


def permissions_for(role: str) -> list[str]:
    return [name for name, roles in ORG_PERMISSIONS.items() if role in roles]
