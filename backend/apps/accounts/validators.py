import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

# те же правила, что в frontend/src/features/auth/register-form.tsx фронта
NICK_RE = re.compile(r"^[A-Za-z0-9_.-]{3,24}$")

RESERVED_NICKS = frozenset(
    {"admin", "administrator", "cts", "control", "support", "moderator", "root", "system", "api", "me", "org", "null"}
)


def validate_nickname(value: str) -> None:
    if not NICK_RE.match(value):
        raise ValidationError(_("3–24 символа: латиница, цифры, _ . -"), code="invalid_nick")
    if value.lower() in RESERVED_NICKS:
        raise ValidationError(_("Ник уже занят"), code="nick_taken")


class CtsPasswordValidator:
    """Минимум 8 символов, буквы, цифры и спецсимвол (раздел 5)."""

    def validate(self, password: str, user=None) -> None:
        if (
            len(password) < 8
            or not re.search(r"[A-Za-zА-Яа-яЁё]", password)
            or not re.search(r"\d", password)
            or not re.search(r"[^\w\s]|_", password)
        ):
            raise ValidationError(_("Минимум 8 символов: буквы, цифры и спецсимвол"), code="weak_password")

    def get_help_text(self) -> str:
        return _("Минимум 8 символов: буквы, цифры и спецсимвол")
