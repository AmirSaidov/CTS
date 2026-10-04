from django.conf import settings
from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel


class OrgRole(models.TextChoices):
    OWNER = "owner", "Владелец"
    ADMIN = "admin", "Админ"
    JUDGE = "judge", "Судья"
    MODERATOR = "moderator", "Модератор"


class Organization(TimeStampedModel, SoftDeleteModel):
    class Verification(models.TextChoices):
        NONE = "none", "Не проверена"
        PENDING = "pending", "На проверке"
        VERIFIED = "verified", "Проверена"
        REJECTED = "rejected", "Отклонена"

    name = models.CharField("название", max_length=80)
    slug = models.SlugField("slug", max_length=48, unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="owned_orgs", verbose_name="владелец"
    )
    logo = models.ImageField("логотип", upload_to="orgs/logos/", blank=True)
    verification_status = models.CharField(
        "верификация", max_length=16, choices=Verification.choices, default=Verification.NONE
    )

    class Meta:
        verbose_name = "организация"
        verbose_name_plural = "организации"

    def __str__(self) -> str:
        return self.name


class OrgMember(TimeStampedModel):
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members", verbose_name="организация"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="org_memberships", verbose_name="пользователь"
    )
    role = models.CharField("роль", max_length=16, choices=OrgRole.choices)
    last_active = models.DateTimeField("последняя активность", null=True, blank=True)

    class Meta:
        verbose_name = "сотрудник организации"
        verbose_name_plural = "сотрудники организаций"
        constraints = [models.UniqueConstraint(fields=["organization", "user"], name="org_member_unique")]

    def __str__(self) -> str:
        return f"{self.user} · {self.organization} · {self.role}"
