"""
Настройки CTS. Все секреты и адреса — из переменных окружения (.env локально).

Без DATABASE_URL / REDIS_URL проект поднимается на SQLite, кэше в памяти
и синхронном Celery — для локальной разработки без Docker.
"""

from datetime import timedelta
from pathlib import Path
from typing import Any

import environ
from django.utils.translation import gettext_lazy as _

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-insecure-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
ENVIRONMENT = env("ENVIRONMENT", default="local")  # local / stage / production

# Адрес фронта: ссылки в письмах (сброс пароля) и CORS/CSRF
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # сторонние
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    # CTS
    "apps.core",
    "apps.accounts",
    "apps.games",
    "apps.orgs",
    "apps.billing",
]

MIDDLEWARE = [
    "apps.core.middleware.ApiTrailingSlashMiddleware",
    "apps.core.middleware.RequestIdMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.MaintenanceMiddleware",
    "apps.core.middleware.ApiServerErrorMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {"default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")}
DATABASES["default"]["ATOMIC_REQUESTS"] = False
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = ["apps.accounts.backends.EmailOrNickBackend"]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "apps.accounts.validators.CtsPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]
# ссылка сброса пароля живёт 30 минут (раздел 5)
PASSWORD_RESET_TIMEOUT = 30 * 60

# ───── язык и время ─────
LANGUAGE_CODE = "ru"
LANGUAGES = [("ru", _("Русский")), ("ky", _("Кыргызча")), ("en", _("English"))]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# ───── кэш, Redis, Celery ─────
REDIS_URL = env("REDIS_URL", default="")

if REDIS_URL:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}}
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=REDIS_URL or "memory://")
CELERY_RESULT_BACKEND = None
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=not REDIS_URL)
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_TIMEZONE = "UTC"
CELERY_BEAT_SCHEDULE = {
    "cleanup-expired-codes": {
        "task": "apps.accounts.tasks.cleanup_expired_codes",
        "schedule": timedelta(days=1),
    },
}

# ───── почта ─────
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="CTS <noreply@cts.gg>")

# ───── DRF ─────
REST_FRAMEWORK: dict[str, Any] = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.CookieJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.exception_handler",
    "UNAUTHENTICATED_USER": "django.contrib.auth.models.AnonymousUser",
}

if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append("rest_framework.renderers.BrowsableAPIRenderer")

# ───── JWT в httpOnly-cookie (раздел 5) ─────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "SIGNING_KEY": env("JWT_SIGNING_KEY", default=SECRET_KEY),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}
JWT_COOKIE: dict[str, Any] = {
    "ACCESS_NAME": "access",  # имена читает src/proxy.ts фронта
    "REFRESH_NAME": "refresh",
    "SAMESITE": "Lax",
    "DOMAIN": env("JWT_COOKIE_DOMAIN", default=None),
    # Путь «/», а не /api/v1/auth/: proxy.ts фронта читает refresh на страницах, когда access истёк,
    # иначе через 15 минут пользователя выкидывало бы на /login. Cookie httpOnly и SameSite=Lax.
    "REFRESH_PATH": "/",
}
# Secure-флаг cookie выключается только при DEBUG=True (apps/accounts/cookies.py) — без переопределения из env.

# CSRF для запросов с cookie (раздел 11): SameSite=Lax + проверка Origin по этому списку
# (apps/accounts/csrf.py). Токен csrftoken фронту не нужен. Django-админка по-прежнему использует токен.
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[FRONTEND_URL])
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[FRONTEND_URL])
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ["X-Request-ID"]

# Фронт ходит через прокси Next.js: X-Forwarded-* доверяем только за ним (раздел 13.1)
USE_X_FORWARDED_HOST = env.bool("USE_X_FORWARDED_HOST", default=False)
TRUSTED_PROXY_IPS = env.list("TRUSTED_PROXY_IPS", default=["127.0.0.1", "::1"])
if env.bool("SECURE_PROXY_SSL", default=False):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=60 * 60 * 24 * 365)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
    SECURE_REDIRECT_EXEMPT = [r"^healthz$", r"^readyz$"]

# ───── OpenAPI (раздел 6) ─────
API_DOCS_ENABLED = env.bool("API_DOCS_ENABLED", default=ENVIRONMENT != "production")
SPECTACULAR_SETTINGS = {
    "TITLE": "CTS API",
    "DESCRIPTION": "Esports Tournament CRM — REST API. Ошибки: {code, message, fields}.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "OrgRoleEnum": "apps.orgs.models.OrgRole",
    },
}

# ───── режим техработ (экран 56) ─────
MAINTENANCE_MODE = env.bool("MAINTENANCE_MODE", default=False)
MAINTENANCE_UNTIL = env("MAINTENANCE_UNTIL", default=None)

# ───── аккаунты ─────
ACCOUNTS: dict[str, Any] = {
    "CODE_TTL": timedelta(minutes=10),
    "CODE_MAX_ATTEMPTS": 5,
    "CODE_RESEND_INTERVAL": timedelta(seconds=60),
    "LOGIN_MAX_FAILURES": 5,
    "LOGIN_FAILURE_WINDOW": timedelta(minutes=15),
    # версии документов, на которые соглашается пользователь при регистрации;
    # на этапе 5 берутся из LegalDocument
    "LEGAL_VERSIONS": {"terms": "1.0", "privacy": "1.0"},
}

# ───── логи ─────
LOG_LEVEL = env("LOG_LEVEL", default="INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"request": {"()": "apps.core.logging.RequestContextFilter"}},
    "formatters": {
        "json": {"()": "apps.core.logging.JsonFormatter"},
        "plain": {"format": "%(levelname)s %(name)s [%(request_id)s] %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "filters": ["request"],
            "formatter": env("LOG_FORMAT", default="plain" if DEBUG else "json"),
        },
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {"django.db.backends": {"level": "WARNING"}},
}

SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=ENVIRONMENT,
        send_default_pii=False,
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.0),
    )
