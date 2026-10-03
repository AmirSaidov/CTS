from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "apps.accounts"
    label = "accounts"
    verbose_name = "Аккаунты"

    def ready(self) -> None:
        from . import schema  # noqa: F401 — регистрирует схему авторизации в drf-spectacular
