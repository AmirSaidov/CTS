import pytest

from apps.accounts.tests.factories import UserFactory
from apps.billing.models import Plan, Subscription
from apps.core.exceptions import ApiError
from apps.orgs.permissions import permissions_for, role_has
from apps.orgs.services import create_organization, current_plan, ensure_feature, ensure_within_limit

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    ("role", "permission", "allowed"),
    [
        ("owner", "billing.manage", True),
        ("admin", "billing.manage", False),
        ("admin", "tournaments.manage", True),
        ("judge", "tournaments.manage", False),
        ("judge", "results.edit", True),
        ("judge", "disputes.resolve", True),
        ("moderator", "applications.decide", True),
        ("moderator", "results.edit", False),
        ("admin", "staff.manage", False),
    ],
)
def test_permission_matrix(role, permission, allowed):
    assert role_has(role, permission) is allowed


def test_owner_has_everything():
    assert len(permissions_for("owner")) == 7


def test_org_without_subscription_is_free(seeded):
    org = create_organization(owner=UserFactory(), name="Club")
    assert current_plan(org).code == "free"


def test_plan_limits_free_vs_pro(seeded):
    org = create_organization(owner=UserFactory(), name="Club")

    ensure_within_limit(org, "active_tournaments", used=2)
    with pytest.raises(ApiError) as exc:
        ensure_within_limit(org, "active_tournaments", used=3)
    assert exc.value.code == "plan_limit_reached" and exc.value.status_code == 403
    with pytest.raises(ApiError):
        ensure_feature(org, "branding")

    Subscription.objects.create(organization=org, plan=Plan.objects.get(code="pro"))

    ensure_within_limit(org, "active_tournaments", used=500)
    ensure_feature(org, "branding")


def test_org_slug_unique(seeded):
    a = create_organization(owner=UserFactory(), name="Cyber Arena")
    b = create_organization(owner=UserFactory(), name="Cyber Arena")
    assert (a.slug, b.slug) == ("cyber-arena", "cyber-arena-2")
