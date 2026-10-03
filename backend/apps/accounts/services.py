"""Бизнес-логика аккаунтов (раздел 5). Вьюхи только вызывают эти функции."""

import hashlib
import hmac
import logging
import secrets
from dataclasses import dataclass

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import F
from django.http import HttpRequest
from django.utils import timezone, translation
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.translation import gettext as _
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core import ratelimit
from apps.core.exceptions import ApiError, Gone, TooManyRequests
from apps.core.net import client_ip
from apps.games.models import Game

from . import useragent
from .models import LegalConsent, User, UserGame, UserSession, VerificationCode
from .tasks import send_email
from .tokens import issue_refresh

logger = logging.getLogger(__name__)

CFG = settings.ACCOUNTS


# ───────────────────────── регистрация ─────────────────────────


@dataclass
class RegisterData:
    role: str  # player / organizer
    nick: str
    email: str
    password: str


@transaction.atomic
def register_user(data: RegisterData, request: HttpRequest) -> User:
    from apps.orgs.services import create_organization

    user = User.objects.create_user(
        email=data.email,
        nickname=data.nick,
        password=data.password,
        default_role=User.DefaultRole.ORG if data.role == "organizer" else User.DefaultRole.PLAYER,
        language=translation.get_language() or "ru",
    )
    ip = client_ip(request) or None
    LegalConsent.objects.bulk_create(
        [LegalConsent(user=user, document=doc, version=ver, ip=ip) for doc, ver in CFG["LEGAL_VERSIONS"].items()]
    )
    if data.role == "organizer":
        # фронт держит одну организацию на пользователя (раздел 13.2); название меняется в брендинге
        create_organization(owner=user, name=data.nick)
    transaction.on_commit(lambda: send_verification_code(user))
    return user


def nick_available(nick: str) -> bool:
    from .validators import NICK_RE, RESERVED_NICKS

    if not NICK_RE.match(nick) or nick.lower() in RESERVED_NICKS:
        return False
    return not User.objects.filter(nickname__iexact=nick).exists()


# ───────────────────────── коды подтверждения ─────────────────────────


def _hash_code(code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256).hexdigest()


def send_verification_code(user: User, purpose: str = VerificationCode.Purpose.VERIFY_EMAIL) -> None:
    """Новый 6-значный код на почту: живёт 10 минут; повторная отправка — не чаще раза в 60 секунд."""
    last = VerificationCode.objects.filter(user=user, purpose=purpose).order_by("-created_at").first()
    if last and timezone.now() - last.created_at < CFG["CODE_RESEND_INTERVAL"]:
        wait = CFG["CODE_RESEND_INTERVAL"] - (timezone.now() - last.created_at)
        raise TooManyRequests(
            code="resend_too_soon",
            message=_("Новый код можно запросить через %(s)s с") % {"s": int(wait.total_seconds()) + 1},
            extra={"retry_after": int(wait.total_seconds()) + 1},
        )

    code = f"{secrets.randbelow(1_000_000):06d}"
    VerificationCode.objects.filter(user=user, purpose=purpose, used_at__isnull=True).update(used_at=timezone.now())
    VerificationCode.objects.create(
        user=user,
        channel=VerificationCode.Channel.EMAIL,
        purpose=purpose,
        target=user.email,
        code_hash=_hash_code(code),
        expires_at=timezone.now() + CFG["CODE_TTL"],
    )
    with translation.override(user.language):
        subject = _("Код подтверждения CTS: %(code)s") % {"code": code}
        body = _(
            "Ваш код подтверждения: %(code)s\n\n"
            "Код действует 10 минут. Если вы не регистрировались в CTS, просто игнорируйте письмо."
        ) % {"code": code}
    send_email.delay(to=user.email, subject=str(subject), body=str(body))


def check_code(user: User, code: str, purpose: str = VerificationCode.Purpose.VERIFY_EMAIL) -> None:
    """
    Проверка кода: не больше 5 попыток; после — нужен новый код.
    Вызывать вне транзакции: счётчик попыток должен сохраниться и при ошибке.
    """
    vc = (
        VerificationCode.objects.filter(user=user, purpose=purpose, used_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if vc is None or vc.expires_at < timezone.now():
        raise ApiError(
            code="code_expired", message=_("Код устарел — запросите новый"), fields={"code": [_("Код устарел")]}
        )
    if vc.attempts >= CFG["CODE_MAX_ATTEMPTS"]:
        raise TooManyRequests(code="too_many_attempts", message=_("Слишком много попыток — запросите новый код"))
    if not hmac.compare_digest(vc.code_hash, _hash_code(code)):
        VerificationCode.objects.filter(pk=vc.pk).update(attempts=F("attempts") + 1)
        raise ApiError(code="invalid_code", message=_("Неверный код"), fields={"code": [_("Неверный код")]})
    # условное обновление: один код нельзя использовать дважды параллельными запросами
    if not VerificationCode.objects.filter(pk=vc.pk, used_at__isnull=True).update(used_at=timezone.now()):
        raise ApiError(
            code="code_expired", message=_("Код устарел — запросите новый"), fields={"code": [_("Код устарел")]}
        )


def verify_email(user: User, code: str) -> None:
    if user.email_verified:
        return
    check_code(user, code)
    User.objects.filter(pk=user.pk).update(email_verified=True)
    user.email_verified = True


# ───────────────────────── вход и сессии ─────────────────────────

LOGIN_SCOPE_ACCOUNT = "login:acc"
LOGIN_SCOPE_IP = "login:ip"


def _login_blocked(login: str, ip: str) -> bool:
    limit = CFG["LOGIN_MAX_FAILURES"]
    return ratelimit.exceeded(LOGIN_SCOPE_ACCOUNT, login, limit) or ratelimit.exceeded(LOGIN_SCOPE_IP, ip, limit)


def _login_failed(login: str, ip: str) -> None:
    window = CFG["LOGIN_FAILURE_WINDOW"]
    ratelimit.hit(LOGIN_SCOPE_ACCOUNT, login, window)
    ratelimit.hit(LOGIN_SCOPE_IP, ip, window)


def authenticate_login(login: str, password: str, request: HttpRequest) -> User:
    """Вход по почте или нику. 5 неудач за 15 минут на аккаунт и IP → 429."""
    login = login.strip().lower()
    ip = client_ip(request)
    if _login_blocked(login, ip):
        raise TooManyRequests(
            code="too_many_attempts",
            message=_("Слишком много попыток. Подождите и попробуйте снова."),
            extra={"retry_after": int(CFG["LOGIN_FAILURE_WINDOW"].total_seconds())},
        )
    user = User.objects.get_by_login(login)
    if user is None:
        User().set_password(password)  # выравниваем время ответа
    if user is None or not user.check_password(password):
        _login_failed(login, ip)
        logger.info("login_failed", extra={"data": {"ip": ip}})
        raise ApiError(code="invalid_credentials", message=_("Неверная почта/ник или пароль"))
    if not user.is_active:
        raise ApiError(code="account_blocked", message=_("Аккаунт заблокирован"), status_code=403)
    ratelimit.reset(LOGIN_SCOPE_ACCOUNT, login)
    return user


def start_session(user: User, request: HttpRequest, remember: bool = True) -> RefreshToken:
    ua = useragent.parse(request.META.get("HTTP_USER_AGENT", ""))
    session = UserSession(
        user=user,
        remember=remember,
        ip=client_ip(request) or None,
        browser=ua["browser"],
        os=ua["os"],
        device=ua["device"],
    )
    refresh = issue_refresh(user, session)
    session.refresh_jti = refresh["jti"]
    session.save()
    User.objects.filter(pk=user.pk).update(last_login=timezone.now())
    return refresh


def rotate_refresh(raw: str | None) -> tuple[User, RefreshToken]:
    """Ротация refresh: старый — в чёрный список, новый — с актуальными claims (например, email_verified)."""
    invalid = ApiError(code="token_invalid", message=_("Сессия истекла, войдите снова"), status_code=401)
    if not raw:
        raise invalid
    try:
        old = RefreshToken(raw)  # type: ignore[arg-type]  # проверяет подпись, срок и чёрный список
    except TokenError:
        raise invalid from None

    with transaction.atomic():
        session = (
            UserSession.objects.select_for_update()
            .select_related("user")
            .filter(id=old.get("sid"), revoked_at__isnull=True, refresh_jti=old["jti"])
            .first()
        )
        if session is None or not session.user.is_active or session.user.deleted_at is not None:
            raise invalid
        user = session.user
        old.blacklist()
        refresh = issue_refresh(user, session)
        session.refresh_jti = refresh["jti"]
        session.last_seen = timezone.now()
        session.save(update_fields=["refresh_jti", "last_seen"])
    return user, refresh


def revoke_session(session: UserSession) -> None:
    session.revoked_at = timezone.now()
    session.save(update_fields=["revoked_at"])
    _blacklist_jtis([session.refresh_jti])


def revoke_all_sessions(user: User) -> None:
    sessions = list(UserSession.objects.filter(user=user, revoked_at__isnull=True))
    UserSession.objects.filter(pk__in=[s.pk for s in sessions]).update(revoked_at=timezone.now())
    _blacklist_jtis([s.refresh_jti for s in sessions])


def logout(raw_refresh: str | None) -> None:
    if not raw_refresh:
        return
    try:
        token = RefreshToken(raw_refresh)  # type: ignore[arg-type]
    except TokenError:
        return
    session = UserSession.objects.filter(id=token.get("sid"), revoked_at__isnull=True).first()
    if session:
        revoke_session(session)


def _blacklist_jtis(jtis: list[str]) -> None:
    for outstanding in OutstandingToken.objects.filter(jti__in=jtis):
        BlacklistedToken.objects.get_or_create(token=outstanding)


# ───────────────────────── восстановление пароля ─────────────────────────


def _reset_token(user: User) -> str:
    return f"{urlsafe_base64_encode(force_bytes(user.pk))}.{default_token_generator.make_token(user)}"


def request_password_reset(email: str, request: HttpRequest) -> None:
    """Всегда «успех», даже если почты нет — защита от перебора адресов."""
    ip = client_ip(request)
    if ratelimit.hit("forgot:ip", ip, CFG["LOGIN_FAILURE_WINDOW"]) > 10:
        return
    if ratelimit.hit("forgot:email", email, CFG["LOGIN_FAILURE_WINDOW"]) > 3:
        return
    user = User.objects.filter(email__iexact=email.strip(), deleted_at__isnull=True, is_active=True).first()
    if user is None:
        return
    link = f"{settings.FRONTEND_URL}/reset/{_reset_token(user)}"
    with translation.override(user.language):
        subject = _("Восстановление пароля CTS")
        body = _(
            "Чтобы задать новый пароль, перейдите по ссылке:\n%(link)s\n\n"
            "Ссылка действует 30 минут и сработает один раз. Если вы не запрашивали сброс, игнорируйте письмо."
        ) % {"link": link}
    send_email.delay(to=user.email, subject=str(subject), body=str(body))


@transaction.atomic
def reset_password(token: str, password: str) -> User:
    expired = Gone(code="reset_link_expired", message=_("Ссылка устарела — запросите новую"))
    uid_part, _sep, token_part = token.partition(".")
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid_part)), deleted_at__isnull=True)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        raise expired from None
    if not default_token_generator.check_token(user, token_part):
        raise expired
    try:
        validate_password(password, user)
    except DjangoValidationError as exc:
        raise ApiError(
            code="validation_error", message=exc.messages[0], fields={"password": list(exc.messages)}
        ) from None
    user.set_password(password)
    user.save(update_fields=["password"])  # смена хеша делает ссылку одноразовой
    revoke_all_sessions(user)
    return user


# ───────────────────────── онбординг ─────────────────────────


@transaction.atomic
def save_onboarding(user: User, games: list[str] | None, city: str | None) -> None:
    if games is not None:
        found = {g.slug: g for g in Game.objects.filter(slug__in=games).exclude(status=Game.Status.OFF)}
        unknown = [slug for slug in games if slug not in found]
        if unknown:
            raise ApiError(
                code="validation_error",
                message=_("Проверьте поля"),
                fields={"games": [_("Неизвестная игра: %(s)s") % {"s": ", ".join(unknown)}]},
            )
        UserGame.objects.filter(user=user).exclude(game__slug__in=games).delete()
        existing = set(UserGame.objects.filter(user=user).values_list("game__slug", flat=True))
        UserGame.objects.bulk_create([UserGame(user=user, game=found[s]) for s in games if s not in existing])
    if city is not None:
        user.city = city.strip()
        user.save(update_fields=["city"])
