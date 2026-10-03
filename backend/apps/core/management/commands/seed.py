"""
Сиды для разработки (раздел 11): игры, форматы, тарифы, шаблоны регламентов.
Значения повторяют моки фронта (frontend/src/shared/api/mocks/data.ts), чтобы переключение
с моков на API не меняло экраны. Повторный запуск безопасен — записи обновляются.

    python manage.py seed           # справочники
    python manage.py seed --demo    # + демо-пользователи (не в production)
"""

from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User
from apps.billing.models import Plan
from apps.games.models import BracketFormat, Game, RulesTemplate
from apps.orgs.models import Organization, OrgMember, OrgRole

DEMO_PASSWORD = "CtsDemo2026!"

FORMATS = [
    ("single", "Single Elimination", False),
    ("double", "Double Elimination", False),
    ("groups", "Группы + плей-офф", False),
    ("swiss", "Швейцарская система", True),
    # во фронте есть «league» — оставить или убрать, решает заказчик (раздел 13.2)
    ("league", "Круговая лига", True),
]

GAMES = [
    # slug, name, short, publisher, team_size, max_subs, provider, status, formats, maps
    (
        "valorant",
        "Valorant",
        "VL",
        "Riot Games",
        5,
        2,
        "riot",
        "active",
        ["single", "double", "groups", "swiss"],
        ["Ascent", "Bind", "Haven", "Lotus", "Split", "Sunset", "Icebox"],
    ),
    (
        "cs2",
        "Counter-Strike 2",
        "CS",
        "Valve",
        5,
        2,
        "steam",
        "active",
        ["single", "double", "groups", "swiss"],
        ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust2", "Train"],
    ),
    ("dota2", "Dota 2", "D2", "Valve", 5, 2, "steam", "active", ["single", "double", "groups"], []),
    ("mlbb", "Mobile Legends", "ML", "Moonton", 5, 1, "manual", "active", ["single", "double"], []),
    (
        "pubgm",
        "PUBG Mobile",
        "PU",
        "Krafton",
        4,
        1,
        "manual",
        "active",
        ["single", "groups"],
        ["Erangel", "Miramar", "Sanhok"],
    ),
    ("eafc", "EA FC", "FC", "EA", 1, 0, "manual", "beta", ["single", "groups", "league"], []),
]

# Цены не утверждены (открытый вопрос к заказчику) — null, фронт показывает заглушку.
# Лимит рассылок Free и Лиги — тоже «уточнить»: значения ниже — временные, правятся в админке.
PLANS: list[dict[str, Any]] = [
    {
        "code": "free",
        "name": "Free",
        "tier": "Tier-00",
        "order": 0,
        "recommended": False,
        "tagline": "Для первого турнира и небольших клубов.",
        "cta": "Начать бесплатно",
        "price_month": 0,
        "price_year": 0,
        "limits": {
            "active_tournaments": 3,
            "staff": 1,
            "mailings_per_month": 100,
            "formats": ["single", "double", "groups"],
            "branding": False,
            "telegram": False,
            "export": False,
            "analytics": "basic",
            "entry_fee": False,
            "custom_domain": False,
            "seasons": False,
        },
        "features": [
            "До 3 активных турниров",
            "Авто-сетка и расписание",
            "Регистрация команд",
            "Публичная страница турнира",
        ],
    },
    {
        "code": "pro",
        "name": "Pro",
        "tier": "Tier-01",
        "order": 1,
        "recommended": True,
        "tagline": "Для клубов и комьюнити с регулярными турнирами.",
        "cta": "Перейти на Pro",
        "price_month": None,
        "price_year": None,
        "limits": {
            "active_tournaments": None,
            "staff": 3,
            "mailings_per_month": 1000,
            "formats": None,
            "branding": True,
            "telegram": True,
            "export": True,
            "analytics": "advanced",
            "entry_fee": True,
            "custom_domain": False,
            "seasons": False,
        },
        "features": [
            "Безлимит турниров",
            "Свой логотип и цвета",
            "Уведомления игрокам в Telegram",
            "Статистика команд и игроков",
            "Экспорт базы участников",
        ],
    },
    {
        "code": "league",
        "name": "Лига",
        "tier": "Tier-02",
        "order": 2,
        "recommended": False,
        "tagline": "Для лиг, вузов и ивент-агентств.",
        "cta": "Связаться",
        "price_month": None,
        "price_year": None,
        "limits": {
            "active_tournaments": None,
            "staff": 10,
            "mailings_per_month": 10000,
            "formats": None,
            "branding": True,
            "telegram": True,
            "export": True,
            "analytics": "advanced",
            "entry_fee": True,
            "custom_domain": True,
            "seasons": True,
        },
        "features": [
            "Всё из Pro",
            "Сезоны и рейтинги лиги",
            "До 10 организаторов с ролями",
            "Приоритетная поддержка",
            "Свой домен",
        ],
    },
]

RULES = [
    {
        "title": "1. Общие положения",
        "body": "Турнир проводится по официальным правилам игры. Опоздание более 10 минут — техническое поражение.",
    },
    {"title": "2. Состав", "body": "Заявленный состав меняется только до закрытия регистрации."},
    {"title": "3. Результаты", "body": "Капитан вносит счёт со скриншотом, соперник подтверждает в течение 15 минут."},
    {"title": "4. Споры", "body": "Споры решает главный судья на основании скриншотов и демо."},
]


class Command(BaseCommand):
    help = "Заполнить справочники (и демо-данные с --demo)"

    def add_arguments(self, parser):
        parser.add_argument("--demo", action="store_true", help="Создать демо-пользователей и организацию")

    @transaction.atomic
    def handle(self, *args, demo: bool = False, **options):
        formats = {}
        for order, (code, name, beta) in enumerate(FORMATS):
            formats[code], _ = BracketFormat.objects.update_or_create(
                code=code, defaults={"name": name, "is_beta": beta, "order": order}
            )

        for order, (slug, name, short, publisher, size, subs, provider, status, fmts, maps) in enumerate(GAMES):
            game, _ = Game.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "short": short,
                    "publisher": publisher,
                    "team_size": size,
                    "max_subs": subs,
                    "account_provider": provider,
                    "status": status,
                    "maps": maps,
                    "order": order,
                },
            )
            game.formats.set([formats[f] for f in fmts])
            RulesTemplate.objects.get_or_create(
                game=game, version=1, defaults={"title": f"Регламент {name}", "body": RULES, "is_current": True}
            )

        for plan in PLANS:
            code = plan.pop("code")
            Plan.objects.update_or_create(code=code, defaults=plan)
            plan["code"] = code

        self.stdout.write(
            self.style.SUCCESS(f"Справочники: {len(GAMES)} игр, {len(FORMATS)} форматов, {len(PLANS)} тарифа")
        )

        if demo:
            if settings.ENVIRONMENT == "production":
                raise CommandError("Демо-данные в production не создаются")
            self._demo()

    def _demo(self) -> None:
        def user(email: str, nick: str, **extra) -> User:
            u = User.objects.filter(email=email).first()
            if u is None:
                u = User.objects.create_user(
                    email=email, nickname=nick, password=DEMO_PASSWORD, email_verified=True, **extra
                )
            return u

        user("admin@cts.local", "ctsadmin", is_staff=True, is_superuser=True, default_role=User.DefaultRole.BOTH)
        user("aktan@cts.local", "Aktan", full_name="Актан", city="Бишкек", main_role="Дуэлянт")
        organizer = user("org@cts.local", "CyberArena", default_role=User.DefaultRole.ORG, city="Бишкек")
        org, _ = Organization.objects.get_or_create(
            slug="cyber-arena", defaults={"name": "[Клуб] Cyber Arena", "owner": organizer}
        )
        OrgMember.objects.get_or_create(organization=org, user=organizer, defaults={"role": OrgRole.OWNER})

        self.stdout.write(
            self.style.SUCCESS(f"Демо: admin@cts.local, aktan@cts.local, org@cts.local — пароль {DEMO_PASSWORD}")
        )
