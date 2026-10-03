from django.contrib import admin

from .models import BracketFormat, Game, RulesTemplate


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "team_size", "max_subs", "account_provider", "status", "order"]
    list_editable = ["status", "order"]
    list_filter = ["status", "account_provider"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(BracketFormat)
class BracketFormatAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "enabled", "is_beta", "order"]
    list_editable = ["enabled", "is_beta", "order"]
    filter_horizontal = ["games"]


@admin.register(RulesTemplate)
class RulesTemplateAdmin(admin.ModelAdmin):
    list_display = ["game", "title", "version", "is_current", "updated_at"]
    list_filter = ["game", "is_current"]
