"""
ТЗ, 14.1: лимиты тарифов — только активные турниры и форматы сетки.
Убираем из Plan.limits остальные ключи в уже существующих базах (сиды и так создают их без них).
"""

from django.db import migrations, models

KEEP = ("active_tournaments", "formats")


def strip_limits(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    for plan in Plan.objects.all():
        limits = {key: value for key, value in (plan.limits or {}).items() if key in KEEP}
        if limits != plan.limits:
            plan.limits = limits
            plan.save(update_fields=["limits"])


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]

    # обратно ключи не восстанавливаем: значения были временными и правились в админке
    operations = [
        migrations.AlterField(
            model_name="plan",
            name="limits",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='{"active_tournaments": 3, "formats": ["single", "double", "groups"]}; null — без лимита',
                verbose_name="лимиты и возможности",
            ),
        ),
        migrations.RunPython(strip_limits, migrations.RunPython.noop),
    ]
