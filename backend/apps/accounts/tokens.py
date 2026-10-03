"""
JWT с claims для роутинга фронта (раздел 13.1): is_player, is_organizer, is_platform_admin,
email_verified — frontend/src/proxy.ts читает их без проверки подписи. Права всё равно проверяет Django.
"""

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from apps.orgs.models import OrgMember

from .models import User, UserSession


def user_claims(user: User) -> dict[str, object]:
    return {
        "is_player": user.is_player,
        "is_organizer": OrgMember.objects.filter(user=user, organization__deleted_at__isnull=True).exists(),
        "is_platform_admin": user.is_staff,
        "email_verified": user.email_verified,
    }


def issue_refresh(user: User, session: UserSession) -> RefreshToken:
    refresh = RefreshToken.for_user(user)
    refresh["sid"] = str(session.id)
    refresh["remember"] = session.remember
    for key, value in user_claims(user).items():
        refresh[key] = value
    return refresh


def issue_access(user: User, session: UserSession) -> AccessToken:
    """Новый access без ротации refresh — например, после подтверждения почты."""
    access = AccessToken.for_user(user)
    access["sid"] = str(session.id)
    for key, value in user_claims(user).items():
        access[key] = value
    return access
