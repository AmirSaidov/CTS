from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import GameAccount, LegalConsent, User, UserSession


class GameAccountInline(admin.TabularInline):
    model = GameAccount
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["nickname", "email", "default_role", "email_verified", "is_active", "is_staff", "date_joined"]
    list_filter = ["default_role", "email_verified", "is_active", "is_staff", "language"]
    search_fields = ["nickname", "email", "full_name", "phone"]
    readonly_fields = ["date_joined", "last_login"]
    inlines = [GameAccountInline]
    fieldsets = [
        (None, {"fields": ["email", "nickname", "password"]}),
        (
            "Профиль",
            {"fields": ["full_name", "phone", "city", "avatar", "banner", "bio", "main_role", "looking_for_team"]},
        ),
        ("Настройки", {"fields": ["default_role", "language"]}),
        (
            "Статус",
            {"fields": ["email_verified", "phone_verified", "is_active", "is_staff", "is_superuser", "deleted_at"]},
        ),
        ("Права", {"fields": ["groups", "user_permissions"], "classes": ["collapse"]}),
        ("Даты", {"fields": ["date_joined", "last_login"]}),
    ]
    add_fieldsets = [(None, {"classes": ["wide"], "fields": ["email", "nickname", "password1", "password2"]})]


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "browser", "os", "ip", "last_seen", "revoked_at"]
    list_filter = ["revoked_at"]
    search_fields = ["user__nickname", "ip"]
    raw_id_fields = ["user"]


@admin.register(LegalConsent)
class LegalConsentAdmin(admin.ModelAdmin):
    list_display = ["user", "document", "version", "accepted_at"]
    raw_id_fields = ["user"]
