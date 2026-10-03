from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import Plan


def format_money(tyiyn: int | None) -> str | None:
    """12345600 тыйын → «123 456»; копейки показываем, только если они есть."""
    if tyiyn is None:
        return None
    soms, rest = divmod(tyiyn, 100)
    text = f"{soms:,}".replace(",", " ")
    return f"{text},{rest:02d}" if rest else text


# Во фронте PlanInfo.priceMonth/priceYear/yearDiscount — строки; пока цена не утверждена, отдаём «—».
NOT_SET = "—"


class PlanSerializer(serializers.ModelSerializer):
    key = serializers.CharField(source="code")
    price_month = serializers.SerializerMethodField(help_text="Цена в сомах для показа; «—» — цена не утверждена")
    price_year = serializers.SerializerMethodField()
    price_month_minor = serializers.IntegerField(source="price_month", allow_null=True, help_text="В тыйынах")
    price_year_minor = serializers.IntegerField(source="price_year", allow_null=True)
    year_discount = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            "key",
            "tier",
            "name",
            "tagline",
            "price_month",
            "price_year",
            "price_month_minor",
            "price_year_minor",
            "currency",
            "year_discount",
            "features",
            "recommended",
            "cta",
            "limits",
        ]

    @extend_schema_field(serializers.CharField())
    def get_price_month(self, plan: Plan) -> str:
        return format_money(plan.price_month) or NOT_SET

    @extend_schema_field(serializers.CharField())
    def get_price_year(self, plan: Plan) -> str:
        return format_money(plan.price_year) or NOT_SET

    @extend_schema_field(serializers.CharField())
    def get_year_discount(self, plan: Plan) -> str:
        discount = plan.year_discount_percent
        return NOT_SET if discount is None else str(discount)
