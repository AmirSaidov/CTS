from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.orgs.models import OrgRole

from ..models import User
from ..validators import validate_nickname


def _django_errors(exc: DjangoValidationError) -> serializers.ValidationError:
    return serializers.ValidationError(list(exc.messages))


# ───── запросы ─────


class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["player", "organizer"])
    nick = serializers.CharField(max_length=24, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    terms = serializers.BooleanField(help_text="Согласие с пользовательским соглашением и политикой конфиденциальности")

    def validate_nick(self, value: str) -> str:
        try:
            validate_nickname(value)
        except DjangoValidationError as exc:
            raise _django_errors(exc) from None
        if User.objects.filter(nickname__iexact=value).exists():
            raise serializers.ValidationError(_("Ник уже занят"), code="nick_taken")
        return value

    def validate_email(self, value: str) -> str:
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(_("Почта уже зарегистрирована"), code="email_taken")
        return value

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise _django_errors(exc) from None
        return value

    def validate_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError(_("Нужно принять соглашение и политику"), code="terms_required")
        return value


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(help_text="Почта или ник")
    password = serializers.CharField(trim_whitespace=False)
    remember = serializers.BooleanField(default=True)


class VerifySerializer(serializers.Serializer):
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": _("Код — 6 цифр")})


class ForgotSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class NickQuerySerializer(serializers.Serializer):
    nick = serializers.CharField()


class NickAvailableSerializer(serializers.Serializer):
    available = serializers.BooleanField()


class OnboardingSerializer(serializers.Serializer):
    games = serializers.ListField(child=serializers.SlugField(), required=False, max_length=20)
    city = serializers.CharField(required=False, allow_blank=True, max_length=64)


# ───── ответ /auth/me/ (SessionUser фронта) ─────


class TeamRefSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    tag = serializers.CharField()


class OrgLimitsSerializer(serializers.Serializer):
    tournaments = serializers.ListField(
        child=serializers.IntegerField(allow_null=True), help_text="[использовано, лимит]; null — без лимита"
    )
    staff = serializers.ListField(child=serializers.IntegerField(allow_null=True))
    mailings = serializers.ListField(child=serializers.IntegerField(allow_null=True))


class MeOrgSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
    role = serializers.ChoiceField(choices=OrgRole.choices)
    plan = serializers.CharField()
    permissions = serializers.ListField(child=serializers.CharField(), help_text="Разрешения роли (матрица экрана 42)")
    limits = OrgLimitsSerializer()


class UnreadSerializer(serializers.Serializer):
    notifications = serializers.IntegerField()
    invites = serializers.IntegerField()


class MeSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    nick = serializers.CharField()
    tag = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(allow_blank=True)
    full_name = serializers.CharField(allow_blank=True)
    city = serializers.CharField(allow_blank=True)
    avatar = serializers.CharField(allow_null=True)
    email_verified = serializers.BooleanField()
    is_player = serializers.BooleanField()
    is_organizer = serializers.BooleanField()
    is_platform_admin = serializers.BooleanField()
    captain_of = serializers.CharField(allow_null=True)
    team = TeamRefSerializer(allow_null=True)
    org = MeOrgSerializer(allow_null=True)
    games = serializers.ListField(child=serializers.CharField())
    default_cabinet = serializers.ChoiceField(choices=["player", "org"])
    locale = serializers.ChoiceField(choices=User.Language.choices)
    timezone = serializers.CharField()
    unread = UnreadSerializer()
