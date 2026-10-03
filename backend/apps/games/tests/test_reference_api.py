import pytest
from django.db.utils import IntegrityError

from apps.billing.api.serializers import format_money
from apps.games.models import Game, RulesTemplate

pytestmark = pytest.mark.django_db


def test_games_list_matches_frontend_contract(api, seeded):
    Game.objects.filter(slug="mlbb").update(status=Game.Status.OFF)

    data = api.get("/api/v1/games/").data

    slugs = [g["slug"] for g in data]
    assert "mlbb" not in slugs and slugs[0] == "valorant"
    valorant = data[0]
    assert valorant["roster"] == {"main": 5, "subs": 2}
    assert valorant["account_check"] == "riot"
    assert valorant["formats"] == ["single", "double", "groups", "swiss"]


def test_games_hide_disabled_formats(api, seeded):
    from apps.games.models import BracketFormat

    BracketFormat.objects.filter(code="swiss").update(enabled=False)

    valorant = api.get("/api/v1/games/").data[0]

    assert "swiss" not in valorant["formats"]


def test_plans_list(api, seeded):
    data = api.get("/api/v1/plans/").data

    assert [p["key"] for p in data] == ["free", "pro", "league"]
    free, pro = data[0], data[1]
    assert free["price_month"] == "0"
    assert pro["price_month"] == "—"  # цена не утверждена, но поле — строка, как во фронте
    assert pro["recommended"] is True
    assert free["limits"]["active_tournaments"] == 3


def test_seed_is_idempotent(seeded):
    from django.core.management import call_command

    call_command("seed", verbosity=0)

    assert Game.objects.count() == 6
    assert RulesTemplate.objects.count() == 6


def test_one_current_rules_template_per_game(seeded):
    game = Game.objects.get(slug="cs2")
    with pytest.raises(IntegrityError):
        RulesTemplate.objects.create(game=game, title="v2", version=2, is_current=True)


@pytest.mark.parametrize(("tyiyn", "text"), [(None, None), (0, "0"), (199000, "1 990"), (199050, "1 990,50")])
def test_format_money(tyiyn, text):
    assert format_money(tyiyn) == text
