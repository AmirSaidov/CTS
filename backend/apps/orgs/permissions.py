"""
Матрица прав сотрудников организации — одна таблица в коде, только чтение (ТЗ, 14.2).
Нужна экранам 34–38; отдаётся фронту в /auth/me/ списком разрешений.
Имена — как в src/shared/lib/permissions.ts фронта. Права убранных экранов 40, 42, 43, 47
(mailings.send, staff.manage, billing.manage) удалены по ТЗ, 14.1.
"""

from .models import OrgRole

OWNER, ADMIN, JUDGE, MOD = OrgRole.OWNER, OrgRole.ADMIN, OrgRole.JUDGE, OrgRole.MODERATOR

ORG_PERMISSIONS: dict[str, frozenset[str]] = {
    "tournaments.manage": frozenset({OWNER, ADMIN}),  # создавать и удалять турниры
    "applications.decide": frozenset({OWNER, ADMIN, MOD}),  # одобрять заявки
    "results.edit": frozenset({OWNER, ADMIN, JUDGE}),  # вносить и менять результаты
    "disputes.resolve": frozenset({OWNER, ADMIN, JUDGE}),  # решать споры
}


def role_has(role: str, permission: str) -> bool:
    return role in ORG_PERMISSIONS.get(permission, frozenset())


def permissions_for(role: str) -> list[str]:
    return [name for name, roles in ORG_PERMISSIONS.items() if role in roles]
