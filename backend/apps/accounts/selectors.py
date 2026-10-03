from typing import Any

from apps.orgs.permissions import permissions_for
from apps.orgs.selectors import primary_membership, usage
from apps.orgs.services import current_plan

from .models import User


def me_payload(user: User) -> dict[str, Any]:
    """Текущий пользователь в форме SessionUser фронта (src/shared/api/types.ts)."""
    membership = primary_membership(user)
    org = None
    if membership:
        organization = membership.organization
        plan = current_plan(organization)
        used = usage(organization)
        org = {
            "slug": organization.slug,
            "name": organization.name,
            "role": membership.role,
            "plan": plan.code,
            "permissions": permissions_for(membership.role),
            "limits": {
                "tournaments": [used["active_tournaments"], plan.limit("active_tournaments")],
                "staff": [used["staff"], plan.limit("staff")],
                "mailings": [used["mailings_per_month"], plan.limit("mailings_per_month")],
            },
        }
    return {
        "id": user.id,
        "nick": user.nickname,
        "tag": user.tag,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "city": user.city,
        "avatar": user.avatar.url if user.avatar else None,
        "email_verified": user.email_verified,
        "is_player": user.is_player,
        "is_organizer": membership is not None,
        "is_platform_admin": user.is_staff,
        # команды и счётчики подключатся с приложениями teams и notifications (этап 3)
        "captain_of": None,
        "team": None,
        "org": org,
        "games": list(user.user_games.values_list("game__slug", flat=True)),
        "default_cabinet": "org" if user.default_role == User.DefaultRole.ORG and membership else "player",
        "locale": user.language,
        "timezone": user.timezone,
        "unread": {"notifications": 0, "invites": 0},
    }
