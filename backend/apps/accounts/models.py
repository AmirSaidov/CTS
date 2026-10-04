import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils.timezone import now

from apps.core.models import SoftDeleteModel, TimeStampedModel


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def get_by_login(self, login: str) -> "User | None":
        """Пользователь по почте или нику, без учёта регистра."""
        login = login.strip()
        field = "email__iexact" if "@" in login else "nickname__iexact"
        return self.filter(**{field: login}, deleted_at__isnull=True).first()

    def create_user(self, email: str, nickname: str, password: str | None = None, **extra) -> "User":
        user = self.model(email=self.normalize_email(email).lower(), nickname=nickname, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, nickname: str, password: str | None = None, **extra) -> "User":
        extra.update(is_staff=True, is_superuser=True, email_verified=True)
        return self.create_user(email, nickname, password, **extra)


class User(AbstractBaseUser, PermissionsMixin, SoftDeleteModel):
    class DefaultRole(models.TextChoices):
        PLAYER = "player", "Игрок"
        ORG = "org", "Организатор"
        BOTH = "both", "Игрок и организатор"

    class Language(models.TextChoices):
        RU = "ru", "Русский"
        KY = "ky", "Кыргызча"
        EN = "en", "English"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("почта", max_length=254, unique=True)
    phone = models.CharField("телефон", max_length=20, blank=True)
    nickname = models.CharField("ник", max_length=24)
    full_name = models.CharField("имя", max_length=120, blank=True)
    city = models.CharField("город", max_length=64, blank=True)
    avatar = models.ImageField("аватар", upload_to="users/avatars/", blank=True)
    banner = models.ImageField("баннер", upload_to="users/banners/", blank=True)
    bio = models.TextField("о себе", max_length=600, blank=True)
    main_role = models.CharField("игровая роль", max_length=32, blank=True)
    default_role = models.CharField(
        "кабинет по умолчанию", max_length=8, choices=DefaultRole.choices, default=DefaultRole.PLAYER
    )
    language = models.CharField("язык", max_length=2, choices=Language.choices, default=Language.RU)
    looking_for_team = models.BooleanField("ищет команду", default=False)
    email_verified = models.BooleanField("почта подтверждена", default=False)
    phone_verified = models.BooleanField("телефон подтверждён", default=False)

    is_active = models.BooleanField("активен", default=True, help_text="Снимите, чтобы заблокировать вход")
    is_staff = models.BooleanField("суперадмин CTS", default=False)
    date_joined = models.DateTimeField("зарегистрирован", default=now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["nickname"]

    class Meta:
        verbose_name = "пользователь"
        verbose_name_plural = "пользователи"
        constraints = [
            # ник и почта уникальны без учёта регистра (раздел 5)
            models.UniqueConstraint(Lower("email"), name="user_email_ci_unique"),
            models.UniqueConstraint(Lower("nickname"), name="user_nickname_ci_unique"),
        ]

    def __str__(self) -> str:
        return self.nickname

    @property
    def tag(self) -> str:
        """Инициалы для аватара-заглушки."""
        return self.nickname[:2].upper()

    @property
    def is_player(self) -> bool:
        return self.default_role in (self.DefaultRole.PLAYER, self.DefaultRole.BOTH)


class PrivacySettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="privacy")
    show_stats = models.BooleanField("показывать статистику", default=True)
    show_city = models.BooleanField("показывать город", default=True)
    invites_from_all = models.BooleanField("приглашения от всех", default=True)

    class Meta:
        verbose_name = "приватность"
        verbose_name_plural = "приватность"

    def __str__(self) -> str:
        return f"приватность {self.user_id}"


class SocialLinks(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="socials")
    twitch = models.CharField(max_length=200, blank=True)
    youtube = models.CharField(max_length=200, blank=True)
    telegram = models.CharField(max_length=200, blank=True)
    instagram = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = "соцсети"
        verbose_name_plural = "соцсети"

    def __str__(self) -> str:
        return f"соцсети {self.user_id}"


class GameAccount(TimeStampedModel):
    """Игровой аккаунт. Один внешний аккаунт нельзя привязать к двум пользователям."""

    class Provider(models.TextChoices):
        RIOT = "riot", "Riot ID"
        STEAM = "steam", "Steam"
        DISCORD = "discord", "Discord"
        TELEGRAM = "telegram", "Telegram"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="game_accounts")
    provider = models.CharField(max_length=16, choices=Provider.choices)
    external_id = models.CharField(max_length=128)
    display_name = models.CharField(max_length=128, blank=True)
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "игровой аккаунт"
        verbose_name_plural = "игровые аккаунты"
        constraints = [
            models.UniqueConstraint(fields=["provider", "external_id"], name="game_account_external_unique"),
            models.UniqueConstraint(fields=["user", "provider"], name="game_account_one_per_provider"),
        ]


class VerificationCode(models.Model):
    """6-значный код: подтверждение почты, смена адреса, 2FA. Хранится только хеш."""

    class Channel(models.TextChoices):
        EMAIL = "email", "Почта"
        SMS = "sms", "SMS"
        TELEGRAM = "telegram", "Telegram"

    class Purpose(models.TextChoices):
        VERIFY_EMAIL = "verify_email", "Подтверждение почты"
        CHANGE_EMAIL = "change_email", "Смена почты"
        CHANGE_PHONE = "change_phone", "Смена телефона"
        TWO_FACTOR = "two_factor", "Вход с 2FA"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_codes")
    channel = models.CharField(max_length=16, choices=Channel.choices)
    purpose = models.CharField(max_length=16, choices=Purpose.choices)
    target = models.CharField("адрес", max_length=254, help_text="Куда отправлен код")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "код подтверждения"
        verbose_name_plural = "коды подтверждения"
        indexes = [models.Index(fields=["user", "purpose", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.purpose} · {self.target}"


class UserSession(models.Model):
    """Сессия устройства. id попадает в JWT (claim sid) — отзыв сессии сразу закрывает доступ."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    refresh_jti = models.CharField(max_length=64, db_index=True)
    remember = models.BooleanField(default=True)
    device = models.CharField(max_length=64, blank=True)
    browser = models.CharField(max_length=64, blank=True)
    os = models.CharField(max_length=64, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    city = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(default=now)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "сессия"
        verbose_name_plural = "сессии"
        ordering = ["-last_seen"]

    def __str__(self) -> str:
        return f"{self.user_id} · {self.browser} {self.os}"


class LegalConsent(models.Model):
    """Согласие с документом: версия и время (раздел 5)."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consents")
    document = models.CharField(max_length=16)  # terms / privacy
    version = models.CharField(max_length=16)
    accepted_at = models.DateTimeField(default=now)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = "согласие"
        verbose_name_plural = "согласия"

    def __str__(self) -> str:
        return f"{self.document} v{self.version}"
