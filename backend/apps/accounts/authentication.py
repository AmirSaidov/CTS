from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import authentication
from rest_framework.request import Request
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken, Token

from apps.core.context import user_id_var

from .csrf import SAFE_METHODS, enforce_origin
from .models import User, UserSession

LAST_SEEN_RESOLUTION = timedelta(minutes=5)


class CookieJWTAuthentication(authentication.BaseAuthentication):
    """
    Access-токен из httpOnly-cookie `access` (или заголовка Authorization: Bearer — для скриптов и тестов).

    Невалидный или истёкший токен = гость: публичные эндпоинты работают, а закрытые отвечают 401,
    и фронт делает один общий POST /auth/refresh/.

    SSR Next.js не умеет обновлять токен на сервере: после 15 минут страницы приходили бы только
    с refresh-cookie и считали пользователя вышедшим. Поэтому для GET/HEAD без валидного access
    принимается действующий refresh (не в чёрном списке, текущий для неотозванной сессии).
    Меняющие запросы — только с access.
    """

    keyword = "Bearer"

    def authenticate(self, request: Request):
        raw, from_cookie = self._raw_token(request)
        token: Token | None = None
        if raw:
            try:
                token = AccessToken(raw)  # type: ignore[arg-type]  # заглушки simplejwt не знают про str
            except TokenError:
                token = None
        if token is None and (not raw or from_cookie) and request.method in SAFE_METHODS:
            token, from_cookie = self._refresh_from_cookie(request), True
        if token is None:
            return None

        session = (
            UserSession.objects.select_related("user").filter(id=token.get("sid"), revoked_at__isnull=True).first()
        )
        if session is None or str(session.user_id) != str(token.get("user_id")):
            return None
        if isinstance(token, RefreshToken) and session.refresh_jti != token["jti"]:
            return None
        user: User = session.user
        if not user.is_active or user.deleted_at is not None:
            return None

        if from_cookie:
            enforce_origin(request)  # CSRF: SameSite=Lax + Origin (apps/accounts/csrf.py)

        now = timezone.now()
        if now - session.last_seen > LAST_SEEN_RESOLUTION:
            UserSession.objects.filter(pk=session.pk).update(last_seen=now)

        user_id_var.set(str(user.pk))
        request._cts_session = session  # type: ignore[attr-defined]
        return user, token

    def authenticate_header(self, request: Request) -> str:
        # нужен, чтобы «нет входа» отдавалось как 401, а не 403
        return f'{self.keyword} realm="api"'

    def _raw_token(self, request: Request) -> tuple[str | None, bool]:
        header = authentication.get_authorization_header(request).split()
        if len(header) == 2 and header[0].decode().lower() == self.keyword.lower():
            return header[1].decode(), False
        cookie = request.COOKIES.get(settings.JWT_COOKIE["ACCESS_NAME"])
        return (cookie, True) if cookie else (None, False)

    @staticmethod
    def _refresh_from_cookie(request: Request) -> RefreshToken | None:
        raw = request.COOKIES.get(settings.JWT_COOKIE["REFRESH_NAME"])
        if not raw:
            return None
        try:
            return RefreshToken(raw)  # type: ignore[arg-type]  # проверяет подпись, срок и чёрный список
        except TokenError:
            return None


def current_session(request: Request) -> UserSession | None:
    return getattr(request, "_cts_session", None)
