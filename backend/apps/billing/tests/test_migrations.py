import importlib

import pytest
from django.apps import apps as django_apps

from apps.billing.models import Plan

pytestmark = pytest.mark.django_db

strip_limits = importlib.import_module("apps.billing.migrations.0002_plan_limits_scope_14").strip_limits


def test_strip_limits_keeps_only_tournaments_and_formats():
    Plan.objects.create(
        code="pro",
        name="Pro",
        limits={"active_tournaments": None, "formats": None, "staff": 3, "mailings_per_month": 1000, "branding": True},
    )

    strip_limits(django_apps, None)

    assert Plan.objects.get(code="pro").limits == {"active_tournaments": None, "formats": None}
