from django.contrib import admin

from .models import Organization, OrgMember


class OrgMemberInline(admin.TabularInline):
    model = OrgMember
    extra = 0
    raw_id_fields = ["user"]


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "owner", "verification_status", "created_at", "deleted_at"]
    list_filter = ["verification_status"]
    search_fields = ["name", "slug", "owner__nickname", "owner__email"]
    raw_id_fields = ["owner"]
    inlines = [OrgMemberInline]
