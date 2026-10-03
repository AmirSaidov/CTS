from django.contrib import admin

from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "price_month", "price_year", "currency", "is_active", "order"]
    list_editable = ["is_active", "order"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["organization", "plan", "status", "period", "current_period_end"]
    list_filter = ["status", "plan", "period"]
    search_fields = ["organization__name", "organization__slug"]
    raw_id_fields = ["organization"]
