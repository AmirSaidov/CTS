from rest_framework import generics

from ..models import Plan
from .serializers import PlanSerializer


class PlanListView(generics.ListAPIView):
    """Тарифы для лендинга и страницы цен (экраны 01, 12)."""

    serializer_class = PlanSerializer
    pagination_class = None
    filter_backends: list = []
    authentication_classes: list = []
    queryset = Plan.objects.filter(is_active=True)
